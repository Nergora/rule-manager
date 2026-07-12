using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using CampaignEngine.Core.Abstractions;
using CampaignEngine.Core.Models;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using RuleEngine.Core.Abstractions;
using RuleEngine.Core.Rule;
using RuleEngine.Core.Models;

namespace CampaignEngine.Core;

/// <summary>
/// Manages campaign rule evaluation for a specific module.
/// </summary>
/// <typeparam name="TCampaignRuleInput">Input model type.</typeparam>
/// <typeparam name="TCampaignRuleOutput">Output model type.</typeparam>
public class CampaignManager<TCampaignRuleInput, TCampaignRuleOutput>
    where TCampaignRuleInput : RuleInputModel
    where TCampaignRuleOutput : CampaignOutput
{
    private readonly CampaignRuleProvider _ruleProvider;
    private readonly int _moduleId;
    private readonly ILogger<CampaignManager<TCampaignRuleInput, TCampaignRuleOutput>> _logger;
    private readonly IServiceProvider _serviceProvider;

    public int ModuleId => _moduleId;

    public CampaignManager(
        int moduleId,
        IServiceProvider serviceProvider,
        ILogger<CampaignManager<TCampaignRuleInput, TCampaignRuleOutput>> logger,
        params Type[] extraType)
    {
        ArgumentNullException.ThrowIfNull(serviceProvider);
        ArgumentNullException.ThrowIfNull(logger);

        _moduleId = moduleId;
        _logger = logger;
        _serviceProvider = serviceProvider;

        var extraTypes = extraType?.Where(t => t != null).ToArray() ?? Array.Empty<Type>();
        var ruleCache = serviceProvider.GetService<IRuleCompilerCache>();
        var scopeFactory = serviceProvider.GetService<IServiceScopeFactory>();

        _ruleProvider = new CampaignRuleProvider(_moduleId, scopeFactory, serviceProvider, ruleCache, extraTypes);
        _ruleProvider.WaitInitialization();
    }

    private class CampaignRuleProvider : IRuleProvider<CampaignRuleSet, TCampaignRuleInput, TCampaignRuleOutput>
    {
        private readonly int _moduleId;
        private readonly Type[] _extraType;
        private readonly IServiceScopeFactory? _scopeFactory;
        private readonly IServiceProvider _serviceProvider;
        private readonly RuleCompiler<TCampaignRuleInput, bool> _usageRuleCompiler;
        private readonly RuleCompiler<TCampaignRuleInput, TCampaignRuleOutput> _resultRuleCompiler;
        private readonly RuleCompiler<TCampaignRuleInput, bool> _predicateCompiler;

        public CampaignRuleProvider(
            int moduleId,
            IServiceScopeFactory? scopeFactory,
            IServiceProvider serviceProvider,
            IRuleCompilerCache? cache,
            params Type[] extraType)
        {
            ArgumentNullException.ThrowIfNull(serviceProvider);

            _moduleId = moduleId;
            _extraType = extraType ?? Array.Empty<Type>();
            _scopeFactory = scopeFactory;
            _serviceProvider = serviceProvider;
            _usageRuleCompiler = new RuleCompiler<TCampaignRuleInput, bool>(_extraType, useExpressionTreeTemplate: true, cache: cache);
            _predicateCompiler = new RuleCompiler<TCampaignRuleInput, bool>(_extraType, useExpressionTreeTemplate: true, cache: cache);
            _resultRuleCompiler = new RuleCompiler<TCampaignRuleInput, TCampaignRuleOutput>(_extraType, useExpressionTreeTemplate: false, cache: cache);
        }

        private ICampaignRepository GetRepository()
        {
            // Prefer scoped resolution when a scope factory is available (background worker context).
            // Fall back to root provider for single-call contexts.
            return _serviceProvider.GetRequiredService<ICampaignRepository>();
        }

        public async Task<IDictionary<string, CampaignRuleSet>> GenerateRuleSetsAsync(
            DateTime after,
            CancellationToken cancellationToken = default)
        {
            IEnumerable<GeneralCampaign> ruleEntities;

            // Use a DI scope for background processing if a scope factory is available.
            if (_scopeFactory != null)
            {
                using var scope = _scopeFactory.CreateScope();
                var repo = scope.ServiceProvider.GetRequiredService<ICampaignRepository>();
                ruleEntities = repo.GetCampaigns(after, _moduleId).ToList();
            }
            else
            {
                ruleEntities = GetRepository().GetCampaigns(after, _moduleId).ToList();
            }

            var result = new Dictionary<string, CampaignRuleSet>();

            foreach (var ruleEntity in ruleEntities)
            {
                if (cancellationToken.IsCancellationRequested)
                    break;

                try
                {
                    var predicateRule = await _predicateCompiler.CompileAsync(
                        ruleEntity.Code, ruleEntity.Predicate, cancellationToken);
                    var resultRule = await _resultRuleCompiler.CompileAsync(
                        ruleEntity.Code, ruleEntity.Result, cancellationToken);
                    var usageRule = await _usageRuleCompiler.CompileAsync(
                        ruleEntity.Code, ruleEntity.Usage ?? "true", cancellationToken);

                    var ruleSet = RuleSet.Create<CampaignRuleSet, TCampaignRuleInput, TCampaignRuleOutput>(
                        ruleEntity.Code,
                        predicateRule,
                        resultRule,
                        ruleEntity.Priority
                    );

                    ruleSet.UsageRule = usageRule;
                    ruleSet.Name = ruleEntity.Name;
                    ruleSet.StartDate = ruleEntity.StartDate;
                    ruleSet.EndDate = ruleEntity.EndDate;
                    ruleSet.Description = ruleEntity.Description;
                    ruleSet.Quota = ruleEntity.Quota ?? 0;
                    ruleSet.CampaignTypes = ruleEntity.CampaignTypes;
                    ruleSet.CancelReasonId = ruleEntity.CancelReasonId;
                    ruleSet.CancelSourceId = ruleEntity.CancelSourceId;
                    ruleSet.CouponCodeId = ruleEntity.CouponCodeId;
                    ruleSet.DepartmentId = ruleEntity.DepartmentId;
                    ruleSet.ModulId = ruleEntity.ModulId;
                    ruleSet.PromotionCode = ruleEntity.PromotionCode;
                    ruleSet.Id = ruleEntity.Id;
                    ruleSet.CreateDate = ruleEntity.CreateDate;
                    result[ruleEntity.Code] = ruleSet;
                }
                catch (Exception e)
                {
                    var logger = _serviceProvider.GetService<ILogger<CampaignRuleProvider>>();
                    logger?.LogError(e, "Error creating rule set for campaign {CampaignCode}", ruleEntity.Code);
                }
            }

            return result;
        }

        public Task<IDictionary<string, bool>> IsExistsAsync(
            CancellationToken cancellationToken = default,
            params string[] keys)
        {
            var result = keys.ToDictionary(k => k, _ => false);
            var campaignRepo = GetRepository();
            var founded = campaignRepo.GetAllCampaigns(result);
            foreach (var foundKey in founded.Keys)
                result[foundKey] = founded[foundKey];
            return Task.FromResult<IDictionary<string, bool>>(result);
        }

        public void WaitInitialization() { }
    }

    /// <summary>
    /// Extended rule set with campaign-specific metadata.
    /// </summary>
    public class CampaignRuleSet : RuleSet<TCampaignRuleInput, TCampaignRuleOutput>
    {
        public CampaignRuleSet() { }

        public int Id { get; set; }
        public string? Name { get; set; }
        public int? ModulId { get; set; }
        public DateTime StartDate { get; set; }
        public DateTime EndDate { get; set; }
        public int? CouponCodeId { get; set; }
        public string? PromotionCode { get; set; }
        public int? DepartmentId { get; set; }
        public int? CancelReasonId { get; set; }
        public int? CancelSourceId { get; set; }
        public int? Quota { get; set; }
        public CompiledRule<TCampaignRuleInput, bool>? UsageRule { get; set; }
        public int? CampaignTypes { get; set; }
        public string? Description { get; set; }
        public DateTime CreateDate { get; set; }
    }

    /// <summary>
    /// Evaluates campaigns for the given input and returns matching results.
    /// </summary>
    public IEnumerable<TCampaignRuleOutput> GetCampaign(TCampaignRuleInput input)
    {
        ArgumentNullException.ThrowIfNull(input);
        return GetCampaign(input, out _);
    }

    /// <summary>
    /// Evaluates campaigns for the given input. Also outputs the matching rule sets.
    /// </summary>
    public IEnumerable<TCampaignRuleOutput> GetCampaign(
        TCampaignRuleInput input,
        out List<CampaignRuleSet> ruleSets)
    {
        ArgumentNullException.ThrowIfNull(input);

        try
        {
            var predicates = RuleManager.PredicateRuleSets(_ruleProvider, input);
            ruleSets = new List<CampaignRuleSet>();

            if (predicates == null || !predicates.Any())
            {
                var emptyResult = Activator.CreateInstance(typeof(TCampaignRuleOutput)) as TCampaignRuleOutput;
                return emptyResult != null
                    ? new List<TCampaignRuleOutput> { emptyResult }
                    : new List<TCampaignRuleOutput>();
            }

            var results = new List<TCampaignRuleOutput>();

            var orderDiscountPredicate = predicates.Values
                .Where(pr => pr.CampaignTypes == (int)CampaignTypes.DiscountCampaign)
                .OrderByDescending(cr => cr.Priority)
                .ThenBy(c => c.CreateDate)
                .FirstOrDefault();

            if (orderDiscountPredicate != null)
            {
                results.Add(orderDiscountPredicate.ResultRule.Invoke(input));
                ruleSets.Add(orderDiscountPredicate);
            }

            var orderPredicates = predicates.Values
                .Where(pr => pr.CampaignTypes == (int)CampaignTypes.ProductGiftCampaign)
                .OrderByDescending(cr => cr.Priority)
                .ThenBy(c => c.CreateDate);

            foreach (var orderPredicate in orderPredicates)
            {
                results.Add(orderPredicate.ResultRule.Invoke(input));
                ruleSets.Add(orderPredicate);
            }

            return results;
        }
        catch (Exception e)
        {
            _logger.LogError(e, "Error evaluating campaigns for module {ModuleId}", _moduleId);
            throw;
        }
    }

    /// <summary>
    /// Applies a campaign discount to a product in the transaction.
    /// </summary>
    public IDictionary<string, ITravelProduct> UseCampaign(
        string productKey,
        string campaignCode,
        IDictionary<string, ITravelProduct> productsInTransaction)
    {
        if (string.IsNullOrWhiteSpace(productKey))
            throw new ArgumentException("Product key cannot be null or empty.", nameof(productKey));
        if (string.IsNullOrWhiteSpace(campaignCode))
            throw new ArgumentException("Campaign code cannot be null or empty.", nameof(campaignCode));

        ArgumentNullException.ThrowIfNull(productsInTransaction);

        if (!productsInTransaction.TryGetValue(productKey, out var product))
            return productsInTransaction;

        if (product.CampaignInformations == null)
            return productsInTransaction;

        var campaignInfo = product.CampaignInformations.Values
            .FirstOrDefault(ci => ci.CampaignTypes == CampaignTypes.ProductGiftCampaign && ci.Code == campaignCode);

        if (campaignInfo == null || campaignInfo.Used)
            return productsInTransaction;

        product.TotalPrice -= campaignInfo.TotalDiscount;
        campaignInfo.Used = true;

        return productsInTransaction;
    }

    /// <summary>
    /// Returns available campaigns for the products in the transaction.
    /// </summary>
    public List<AvailableCampaign> GetAvailableCampaigns(
        string productKey,
        IDictionary<string, ITravelProduct> productsInTransaction,
        TCampaignRuleInput input)
    {
        if (string.IsNullOrWhiteSpace(productKey))
            throw new ArgumentException("Product key cannot be null or empty.", nameof(productKey));

        ArgumentNullException.ThrowIfNull(productsInTransaction);
        ArgumentNullException.ThrowIfNull(input);

        var availableCampaigns = new List<AvailableCampaign>();
        var repo = _serviceProvider.GetRequiredService<ICampaignRepository>();

        var ruleSetOrdered = RuleManager.GetRuleSets(_ruleProvider).Values
            .OrderByDescending(r => r.Priority);

        foreach (var ruleSet in ruleSetOrdered)
        {
            if (ruleSet.CampaignTypes != (int)CampaignTypes.ProductGiftCampaign)
                continue;
            if (ruleSet.UsageRule == null || !ruleSet.UsageRule.Invoke(input))
                continue;

            foreach (var product in productsInTransaction.Values)
            {
                if (product.CampaignInformations == null)
                    continue;

                var campaignResult = ruleSet.ResultRule.Invoke(input);
                var existingInfo = product.CampaignInformations.Values
                    .FirstOrDefault(ci => ci.Code == ruleSet.Code);

                if (existingInfo == null)
                    continue;

                existingInfo.TotalDiscount = campaignResult.TotalDiscount;

                if (ruleSet.Quota != 0)
                {
                    var quotaState = repo.CheckCampaignQuota(ruleSet.Quota ?? 0, ruleSet.Id);
                    if (!quotaState)
                    {
                        availableCampaigns.Add(new AvailableCampaign());
                        continue;
                    }
                }

                availableCampaigns.Add(BuildAvailableCampaign(productKey, product.Key, ruleSet, campaignResult));
            }
        }

        return availableCampaigns;
    }

    /// <summary>
    /// Removes a campaign's discount from all products in the transaction.
    /// </summary>
    public void DeleteCampaign(
        string campaignCode,
        IDictionary<string, ITravelProduct> productsInTransaction)
    {
        if (string.IsNullOrWhiteSpace(campaignCode))
            throw new ArgumentException("Campaign code cannot be null or empty.", nameof(campaignCode));

        ArgumentNullException.ThrowIfNull(productsInTransaction);

        foreach (var product in productsInTransaction.Values)
        {
            if (product.CampaignInformations == null)
                continue;

            var basketCampaigns = product.CampaignInformations.Values
                .Where(ci => ci.CampaignTypes == CampaignTypes.ProductGiftCampaign && ci.Code == campaignCode)
                .ToList();

            foreach (var basketCampaign in basketCampaigns)
            {
                if (basketCampaign.Used)
                {
                    product.TotalPrice += basketCampaign.TotalDiscount;
                    basketCampaign.Used = false;
                }
            }
        }
    }

    private static AvailableCampaign BuildAvailableCampaign(
        string productKey,
        string targetProductKey,
        CampaignRuleSet ruleSet,
        TCampaignRuleOutput campaignResult)
    {
        var availableCampaign = new AvailableCampaign
        {
            CampaignCode = ruleSet.Code,
            CampaignName = ruleSet.Name ?? string.Empty,
            CampaignType = (CampaignIncludes?)ruleSet.CampaignTypes,
            ProductKey = productKey
        };

        var targetResult = new CampaignTargetResult
        {
            ProductKey = targetProductKey,
            Discount = campaignResult.TotalDiscount
        };
        availableCampaign.TargetResults.Add(targetResult);
        return availableCampaign;
    }
}

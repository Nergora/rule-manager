using System.Collections.Concurrent;
using System.Reflection;
using Microsoft.Extensions.Logging;
using RuleEngine.Core.Models;

namespace RuleEngine.Core.Rule;

/// <summary>
/// Manages rule sets by provider. Providers are treated as singletons per type.
/// </summary>
public static class RuleManager
{
    // We key by provider type because workers are tied to the provider type, not instance.
    private static readonly ConcurrentDictionary<Type, ProviderWorker> ProviderWorkers = new();

    /// <summary>
    /// Optional logger used by provider workers and the background refresh thread.
    /// Set this early in application startup via <see cref="Configure"/>.
    /// </summary>
    public static ILogger? Logger { get; private set; }

    /// <summary>
    /// Configures the static logger used by all provider workers.
    /// Call once at application startup before any rule evaluation.
    /// </summary>
    public static void Configure(ILogger? logger)
    {
        Logger = logger;
    }

    private static ProviderWorker<TRuleSet, TInput, TOutput> GetProviderWorker<TRuleSet, TInput, TOutput>(
        IRuleProvider<TRuleSet, TInput, TOutput> provider)
        where TRuleSet : RuleSet<TInput, TOutput>
        where TInput : RuleInputModel
    {
        var providerWorker = ProviderWorkers.GetOrAdd(provider.GetType(), providerType =>
        {
            var newProviderWorker = new ProviderWorker<TRuleSet, TInput, TOutput>(provider, Logger);
            _ = newProviderWorker.ProcessAsync();
            return newProviderWorker;
        }) as ProviderWorker<TRuleSet, TInput, TOutput>;

        if (providerWorker == null)
            throw new ArgumentException("Unsupported RuleSet type.", nameof(provider));

        providerWorker.WaitInitialization();
        return providerWorker;
    }

    /// <summary>
    /// Evaluates predicate rules using <paramref name="input"/> and returns matching rule sets.
    /// </summary>
    /// <typeparam name="TRuleSet"></typeparam>
    /// <typeparam name="TInput"></typeparam>
    /// <typeparam name="TOutput"></typeparam>
    /// <param name="provider"></param>
    /// <param name="input">Input passed to predicate rules.</param>
    /// <returns>Dictionary of rule code to <typeparamref name="TRuleSet"/>.</returns>
    public static IDictionary<string, TRuleSet> PredicateRuleSets<TRuleSet, TInput, TOutput>(
        this IRuleProvider<TRuleSet, TInput, TOutput> provider, TInput input)
        where TRuleSet : RuleSet<TInput, TOutput>
        where TInput : RuleInputModel
    {
        var providerWorker = GetProviderWorker(provider);

        // TODO: consider parallel execution when the rule count exceeds a threshold.
        return providerWorker.RuleSets.Where(rs => rs.Value.Predicate(input))
            .ToDictionary(kv => kv.Key, kv => kv.Value);
    }

    /// <summary>
    /// Returns all rule sets provided by the provider.
    /// </summary>
    public static IDictionary<string, TRuleSet> GetRuleSets<TRuleSet, TInput, TOutput>(
        this IRuleProvider<TRuleSet, TInput, TOutput> provider)
        where TRuleSet : RuleSet<TInput, TOutput>
        where TInput : RuleInputModel
    {
        var providerWorker = GetProviderWorker(provider);
        return providerWorker.RuleSets;
    }

    /// <summary>
    /// Executes rule sets matching the predicate for <paramref name="input"/>.
    /// </summary>
    public static IEnumerable<TOutput> Execute<TRuleSet, TInput, TOutput>(
        IRuleProvider<TRuleSet, TInput, TOutput> provider, TInput input)
        where TRuleSet : RuleSet<TInput, TOutput>
        where TInput : RuleInputModel
    {
        var providerWorker = GetProviderWorker(provider);
        return providerWorker.Execute(input);
    }

    /// <summary>
    /// Executes rule sets matching the predicate for <paramref name="input"/>.
    /// </summary>
    public static Task<IEnumerable<TOutput>> ExecuteAsync<TRuleSet, TInput, TOutput>(
        IRuleProvider<TRuleSet, TInput, TOutput> provider, TInput input)
        where TRuleSet : RuleSet<TInput, TOutput>
        where TInput : RuleInputModel
    {
        var providerWorker = GetProviderWorker(provider);
        return providerWorker.ExecuteAsync(input);
    }

    /// <summary>
    /// Executes multi-result rule sets matching the predicate for <paramref name="input"/>.
    /// </summary>
    public static IEnumerable<TOutput> Execute<TRuleSet, TInput, TOutput>(
        IRuleProvider<TRuleSet, TInput, TOutput> provider, TInput input, IEnumerable<TOutput> availableResults)
        where TRuleSet : MultiResultRuleSet<TInput, TOutput>
        where TInput : RuleInputModel
    {
        var providerWorker = GetProviderWorker(provider);
        return providerWorker.Execute(input, availableResults);
    }

    /// <summary>
    /// Executes multi-result rule sets matching the predicate for <paramref name="input"/>.
    /// </summary>
    public static Task<IEnumerable<TOutput>> ExecuteAsync<TRuleSet, TInput, TOutput>(
        IRuleProvider<TRuleSet, TInput, TOutput> provider, TInput input, IEnumerable<TOutput> availableResults)
        where TRuleSet : MultiResultRuleSet<TInput, TOutput>
        where TInput : RuleInputModel
    {
        var providerWorker = GetProviderWorker(provider);
        return providerWorker.ExecuteAsync(input, availableResults);
    }

    private static readonly MethodInfo _genericGetProviderWorkerMethod =
        typeof(RuleManager).GetMethods(BindingFlags.NonPublic | BindingFlags.Static)
            .First(m => m.Name == "GetProviderWorker" && m.IsGenericMethod);

    private static readonly ConcurrentDictionary<Type[], MethodInfo> _getProviderWorkerMethods =
        new(new TypeArrayEqualityComparer());

    private static ProviderWorker GetProviderWorker(IRuleProvider ruleProvider)
    {
        var genericTypes = ruleProvider.GetType().GetInterfaces()
            .First(i => i.IsGenericType)
            .GetGenericArguments();

        var method = _getProviderWorkerMethods.GetOrAdd(genericTypes,
            types => _genericGetProviderWorkerMethod.MakeGenericMethod(types));

        return method.Invoke(null, new[] { ruleProvider }) as ProviderWorker
               ?? throw new InvalidOperationException("Failed to get provider worker");
    }

    public static void WaitInitialization(this IRuleProvider ruleProvider)
    {
        GetProviderWorker(ruleProvider);
    }

    public static void WaitInitialization<TRuleSet, TInput, TOutput>(
        this IRuleProvider<TRuleSet, TInput, TOutput> provider)
        where TRuleSet : RuleSet<TInput, TOutput>
        where TInput : RuleInputModel
    {
        GetProviderWorker(provider);
    }

    private static readonly CancellationTokenSource CancelToken = new();

    private static readonly Thread BackgroundThread = new(Worker)
    {
        IsBackground = true,
        Name = "RuleManager"
    };

    static RuleManager()
    {
        BackgroundThread.Start();
    }

    private static void Worker()
    {
        Task.Run(async () =>
        {
            while (!CancelToken.IsCancellationRequested)
            {
                try
                {
                    await Task.WhenAll(ProviderWorkers.Values.Select(pw => pw.ProcessAsync()));
                }
                catch (Exception ex)
                {
                    Logger?.LogError(ex, "Error during RuleManager background refresh cycle.");
                }

                try
                {
                    await Task.Delay(TimeSpan.FromSeconds(30), CancelToken.Token);
                }
                catch (OperationCanceledException)
                {
                    break;
                }
            }
        }, CancelToken.Token).Wait();
    }

    /// <summary>
    /// Equality comparer for Type[] keys in the method cache dictionary.
    /// </summary>
    private sealed class TypeArrayEqualityComparer : IEqualityComparer<Type[]>
    {
        public bool Equals(Type[]? x, Type[]? y)
        {
            if (x == null && y == null) return true;
            if (x == null || y == null) return false;
            return x.SequenceEqual(y);
        }

        public int GetHashCode(Type[] obj)
        {
            return obj.Aggregate(17, (acc, t) => acc * 31 + t.GetHashCode());
        }
    }
}

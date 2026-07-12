using System.Collections.Concurrent;
using Microsoft.Extensions.Logging;
using RuleEngine.Core.Models;
using RuleEngine.Core.Extensions;

namespace RuleEngine.Core.Rule;

/// <summary>
/// Base class for provider caching and background processing.
/// </summary>
public abstract class ProviderWorker
{
    protected int _initialized = 0;

    public abstract Task ProcessAsync();

    /// <summary>
    /// Blocks the calling thread until this worker has completed its first load.
    /// </summary>
    public abstract void WaitInitialization();
}

/// <summary>
/// Generic provider worker: caches compiled rule sets and refreshes them in the background.
/// </summary>
/// <typeparam name="TRuleSet"></typeparam>
/// <typeparam name="TInput"></typeparam>
/// <typeparam name="TOutput"></typeparam>
public class ProviderWorker<TRuleSet, TInput, TOutput> : ProviderWorker
    where TRuleSet : RuleSet<TInput, TOutput>
    where TInput : RuleInputModel
{
    private new int _initialized;
    private readonly TaskCompletionSource<bool> _initTcs = new(TaskCreationOptions.RunContinuationsAsynchronously);

    public bool Initialized => _initialized > 0;

    private readonly IRuleProvider<TRuleSet, TInput, TOutput> _provider;
    private readonly ILogger? _logger;
    public readonly ConcurrentDictionary<string, TRuleSet> RuleSets = new();

    public ProviderWorker(IRuleProvider<TRuleSet, TInput, TOutput> provider, ILogger? logger = null)
    {
        _provider = provider;
        _logger = logger;
        _providerTypeName = provider.GetType().GetFriendlyName();
    }

    private readonly string _providerTypeName;

    public override async Task ProcessAsync()
    {
        try
        {
            var lastCompileTime = RuleSets.Count > 0
                ? RuleSets.Values.Max(rs =>
                    rs.PredicateRule == null ? rs.ResultRule.CompileTime :
                    rs.ResultRule == null ? rs.PredicateRule.CompileTime :
                    rs.PredicateRule.CompileTime > rs.ResultRule.CompileTime
                        ? rs.PredicateRule.CompileTime
                        : rs.ResultRule.CompileTime)
                : default;

            // Remove deleted rule sets.
            var isExistDic = await _provider.IsExistsAsync(default, RuleSets.Keys.ToArray());
            foreach (var deletedKey in isExistDic.Where(kv => !kv.Value).Select(kv => kv.Key))
            {
                RuleSets.TryRemove(deletedKey, out _);
            }

            // Fetch updated rule sets.
            var newRuleSets = await _provider.GenerateRuleSetsAsync(lastCompileTime);
            foreach (var newRuleSet in newRuleSets)
            {
                RuleSets[newRuleSet.Key] = newRuleSet.Value;
            }
        }
        catch (Exception e)
        {
            _logger?.LogError(e, "Error in ProviderWorker.ProcessAsync for provider {ProviderType}: {Message}",
                _providerTypeName, e.Message);
        }
        finally
        {
            if (Interlocked.CompareExchange(ref _initialized, 1, 0) == 0)
            {
                _initTcs.TrySetResult(true);
            }
        }
    }

    /// <summary>
    /// Blocks until the first <see cref="ProcessAsync"/> call completes, or throws <see cref="TimeoutException"/>
    /// after 25.5 seconds.
    /// </summary>
    public override void WaitInitialization()
    {
        if (Initialized)
            return;

        if (!_initTcs.Task.Wait(TimeSpan.FromSeconds(25.5)))
        {
            throw new TimeoutException(
                $"The rule sets of the {_providerTypeName} provider haven't initialized within the timeout period.");
        }
    }

    /// <summary>
    /// Awaitable version of <see cref="WaitInitialization"/>.
    /// </summary>
    public async Task WaitInitializationAsync(CancellationToken cancellationToken = default)
    {
        if (Initialized)
            return;

        using var cts = CancellationTokenSource.CreateLinkedTokenSource(cancellationToken);
        cts.CancelAfter(TimeSpan.FromSeconds(25.5));

        try
        {
            await _initTcs.Task.WaitAsync(cts.Token);
        }
        catch (OperationCanceledException) when (!cancellationToken.IsCancellationRequested)
        {
            throw new TimeoutException(
                $"The rule sets of the {_providerTypeName} provider haven't initialized within the timeout period.");
        }
    }

    public IEnumerable<TOutput> Execute(TInput input)
    {
        return RuleSets.Values
            .Where(rs => rs.Predicate(input))
            .OrderBy(rs => rs.Priority)
            .Select(rs => rs.GetResult(input));
    }

    /// <summary>
    /// Executes matching rule sets and returns their results.
    /// Note: Rule execution is CPU-bound and runs synchronously; the Task wrapper
    /// allows callers to use await syntax without blocking the caller's synchronization context.
    /// </summary>
    public Task<IEnumerable<TOutput>> ExecuteAsync(TInput input)
        => Task.FromResult(Execute(input));

    public IEnumerable<TOutput> Execute(TInput input, IEnumerable<TOutput> availableResults)
    {
        return RuleSets.Values
            .Where(rs => rs.Predicate(input))
            .OrderBy(rs => rs.Priority)
            .Select(rs => rs is MultiResultRuleSet<TInput, TOutput> multiResult
                ? multiResult.GetResult(input, availableResults)
                : rs.GetResult(input));
    }

    public Task<IEnumerable<TOutput>> ExecuteAsync(TInput input, IEnumerable<TOutput> availableResults)
        => Task.FromResult(Execute(input, availableResults));
}

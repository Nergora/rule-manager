using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Options;
using RuleEngine.Core.Abstractions;
using RuleEngine.Core.Models;

namespace RuleEngine.Core.Cache;

/// <summary>
/// Options for <see cref="MemoryRuleCompilerCache"/>.
/// </summary>
public class MemoryRuleCompilerCacheOptions
{
    /// <summary>
    /// Sliding expiration for cached compiled rules. Defaults to 1 hour.
    /// </summary>
    public TimeSpan SlidingExpiration { get; set; } = TimeSpan.FromHours(1);
}

/// <summary>
/// Memory-based implementation of <see cref="IRuleCompilerCache"/>.
/// Uses <see cref="IMemoryCache"/> to cache compiled rules and avoid redundant Roslyn compilations.
/// </summary>
public class MemoryRuleCompilerCache : IRuleCompilerCache
{
    private readonly IMemoryCache _memoryCache;
    private readonly MemoryRuleCompilerCacheOptions _options;

    /// <summary>
    /// Creates a new <see cref="MemoryRuleCompilerCache"/> with the specified options.
    /// </summary>
    public MemoryRuleCompilerCache(IMemoryCache memoryCache, IOptions<MemoryRuleCompilerCacheOptions> options)
    {
        ArgumentNullException.ThrowIfNull(memoryCache);
        ArgumentNullException.ThrowIfNull(options);
        _memoryCache = memoryCache;
        _options = options.Value;
    }

    /// <summary>
    /// Creates a new <see cref="MemoryRuleCompilerCache"/> with default options (1-hour sliding expiration).
    /// </summary>
    public MemoryRuleCompilerCache(IMemoryCache memoryCache)
    {
        ArgumentNullException.ThrowIfNull(memoryCache);
        _memoryCache = memoryCache;
        _options = new MemoryRuleCompilerCacheOptions();
    }

    public async Task<IList<CompiledRule<TInput, TReturn>>> GetOrAddAsync<TInput, TReturn>(
        string key, Func<Task<IList<CompiledRule<TInput, TReturn>>>> factory)
    {
        ArgumentNullException.ThrowIfNull(key);
        ArgumentNullException.ThrowIfNull(factory);

        if (_memoryCache.TryGetValue(key, out IList<CompiledRule<TInput, TReturn>>? cachedResult)
            && cachedResult != null)
        {
            return cachedResult;
        }

        var result = await factory();

        var cacheEntryOptions = new MemoryCacheEntryOptions()
            .SetSlidingExpiration(_options.SlidingExpiration);

        _memoryCache.Set(key, result, cacheEntryOptions);

        return result;
    }
}

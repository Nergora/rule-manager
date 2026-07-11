using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Microsoft.Extensions.Caching.Memory;
using RuleEngine.Core.Abstractions;
using RuleEngine.Core.Models;

namespace RuleEngine.Core.Cache;

/// <summary>
/// Memory-based implementation of IRuleCompilerCache.
/// </summary>
public class MemoryRuleCompilerCache : IRuleCompilerCache
{
    private readonly IMemoryCache _memoryCache;

    public MemoryRuleCompilerCache(IMemoryCache memoryCache)
    {
        ArgumentNullException.ThrowIfNull(memoryCache);
        _memoryCache = memoryCache;
    }

    public async Task<IList<CompiledRule<TInput, TReturn>>> GetOrAddAsync<TInput, TReturn>(string key, Func<Task<IList<CompiledRule<TInput, TReturn>>>> factory)
    {
        ArgumentNullException.ThrowIfNull(key);
        ArgumentNullException.ThrowIfNull(factory);

        if (_memoryCache.TryGetValue(key, out IList<CompiledRule<TInput, TReturn>>? cachedResult) && cachedResult != null)
        {
            return cachedResult;
        }

        var result = await factory();

        var cacheEntryOptions = new MemoryCacheEntryOptions()
            .SetSlidingExpiration(TimeSpan.FromHours(1)); // Adjust expiration as needed.

        _memoryCache.Set(key, result, cacheEntryOptions);

        return result;
    }
}

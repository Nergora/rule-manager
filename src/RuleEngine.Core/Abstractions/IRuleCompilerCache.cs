using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using RuleEngine.Core.Models;

namespace RuleEngine.Core.Abstractions;

/// <summary>
/// Cache interface for storing compiled rules to prevent redundant Roslyn compilations.
/// </summary>
public interface IRuleCompilerCache
{
    /// <summary>
    /// Gets the compiled rules from the cache, or executes the factory to compile and cache them.
    /// </summary>
    /// <typeparam name="TInput">Input type</typeparam>
    /// <typeparam name="TReturn">Return type</typeparam>
    /// <param name="key">Cache key (usually the hash of the rule code)</param>
    /// <param name="factory">Factory method to compile rules if not in cache</param>
    /// <returns>Compiled rules</returns>
    Task<IList<CompiledRule<TInput, TReturn>>> GetOrAddAsync<TInput, TReturn>(string key, Func<Task<IList<CompiledRule<TInput, TReturn>>>> factory);
}

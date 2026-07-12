using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;
using RuleEngine.Core.Abstractions;
using RuleEngine.Core.Cache;
using RuleEngine.Core.Rule.DesignTime;

namespace RuleEngine.Core.Extensions;

/// <summary>
/// Extension methods for registering RuleEngine services.
/// </summary>
public static class ServiceCollectionExtensions
{
    /// <summary>
    /// Adds RuleEngine core services to the service collection.
    /// Registers <see cref="MemoryRuleCompilerCache"/> as the default <see cref="IRuleCompilerCache"/>.
    /// </summary>
    /// <param name="services">Service collection.</param>
    /// <param name="configureCache">Optional action to configure cache options.</param>
    /// <returns>Service collection for chaining.</returns>
    public static IServiceCollection AddRuleEngine(
        this IServiceCollection services,
        Action<MemoryRuleCompilerCacheOptions>? configureCache = null)
    {
        // Register IMemoryCache if not already present.
        services.TryAddSingleton<IMemoryCache>(sp => new MemoryCache(new MemoryCacheOptions()));

        // Configure cache options.
        if (configureCache != null)
            services.Configure(configureCache);
        else
            services.TryAddSingleton<Microsoft.Extensions.Options.IOptions<MemoryRuleCompilerCacheOptions>>(
                _ => Microsoft.Extensions.Options.Options.Create(new MemoryRuleCompilerCacheOptions()));

        // Register the compiler cache.
        services.TryAddSingleton<IRuleCompilerCache, MemoryRuleCompilerCache>();

        return services;
    }

    /// <summary>
    /// Adds design-time metadata services for rule editor tooling.
    /// </summary>
    /// <param name="services">Service collection.</param>
    /// <returns>Service collection for chaining.</returns>
    public static IServiceCollection AddRuleEngineDesignTime(this IServiceCollection services)
    {
        services.TryAddScoped<MetadataManagerInitializer>();
        return services;
    }
}

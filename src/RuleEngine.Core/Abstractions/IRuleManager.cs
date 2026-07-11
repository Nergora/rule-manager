using System.Threading;
using System.Threading.Tasks;
using RuleEngine.Core.Models;

namespace RuleEngine.Core.Abstractions;

/// <summary>
/// Provides rule execution using registered providers.
/// </summary>
public interface IRuleManager
{
    Task<RuleExecutionResult> ExecuteRuleAsync(string ruleType, object input, CancellationToken cancellationToken = default);
    void RegisterProvider(string ruleType, IRuleProvider provider);
}

/// <summary>
/// Provides rule definitions and validation for a rule type.
/// </summary>
public interface IRuleProvider
{
    Task<RuleDefinition?> GetRuleDefinitionAsync(object input, CancellationToken cancellationToken = default);
    Task<bool> ValidateRuleAsync(RuleDefinition rule, object input, CancellationToken cancellationToken = default);
}

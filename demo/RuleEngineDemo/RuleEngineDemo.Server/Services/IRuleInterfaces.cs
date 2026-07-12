using RuleEngine.Core.Models;

namespace RuleEngineDemo.Server.Services;

/// <summary>
/// Evaluates rules against a given input and returns execution results.
/// Demo-specific abstraction over RuleEngine.Core.
/// </summary>
public interface IRuleEvaluator
{
    Task<RuleExecutionResult> EvaluateAsync(RuleDefinition rule, object input, CancellationToken cancellationToken = default);
    Task<ValidationResult> ValidateAsync(RuleDefinition rule, object input);
    Task<Dictionary<string, string>> GetGeneratedCodeAsync(RuleDefinition rule);
}

/// <summary>
/// High-level rule evaluation facade used by API controllers.
/// </summary>
public interface IRuleEngine
{
    Task<RuleExecutionResult> EvaluateAsync(string ruleId, object input, CancellationToken cancellationToken = default);
    Task<RuleExecutionResult> EvaluateAsync<TInput>(string ruleId, TInput input, CancellationToken cancellationToken = default);
}

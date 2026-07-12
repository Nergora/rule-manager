using RuleEngine.Core.Models;

namespace RuleEngine.Core.Abstractions;

/// <summary>
/// Interface for evaluating rules
/// </summary>
public interface IRuleEvaluator
{
    /// <summary>
    /// Evaluates a rule with the given input
    /// </summary>
    /// <param name="rule">Rule definition to evaluate</param>
    /// <param name="input">Input data for the rule</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>Result of the rule evaluation</returns>
    Task<RuleExecutionResult> EvaluateAsync(RuleDefinition rule, object input, CancellationToken cancellationToken = default);

    /// <summary>
    /// Validates a rule without executing it
    /// </summary>
    /// <param name="rule">Rule definition to validate</param>
    /// <param name="input">Sample input for validation</param>
    /// <returns>Validation result</returns>
    Task<ValidationResult> ValidateAsync(RuleDefinition rule, object input);

    /// <summary>
    /// Gets the generated C# source code for the rule
    /// </summary>
    /// <param name="rule">Rule definition</param>
    /// <returns>Dictionary of component names (e.g. Predicate, Result) and their generated C# code</returns>
    Task<Dictionary<string, string>> GetGeneratedCodeAsync(RuleDefinition rule);
}
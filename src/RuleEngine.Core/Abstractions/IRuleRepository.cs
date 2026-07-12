using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using RuleEngine.Core.Models;

namespace RuleEngine.Core.Abstractions;

/// <summary>
/// Repository interface for managing rules
/// </summary>
public interface IRuleRepository
{
    /// <summary>
    /// Gets a rule by its ID
    /// </summary>
    /// <param name="id">Rule ID</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>Rule definition or null if not found</returns>
    Task<RuleDefinition?> GetByIdAsync(string id, CancellationToken cancellationToken = default);

    /// <summary>
    /// Gets the active version of a rule
    /// </summary>
    /// <param name="ruleId">Rule ID</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>Active rule definition or null if not found</returns>
    Task<RuleDefinition?> GetActiveVersionAsync(string ruleId, CancellationToken cancellationToken = default);

    /// <summary>
    /// Gets all rules
    /// </summary>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>Collection of all rules</returns>
    Task<IEnumerable<RuleDefinition>> GetAllAsync(CancellationToken cancellationToken = default);

    /// <summary>
    /// Creates a new rule
    /// </summary>
    /// <param name="request">Rule creation request</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>Created rule definition</returns>
    Task<RuleDefinition> CreateAsync(CreateRuleRequest request, CancellationToken cancellationToken = default);

    /// <summary>
    /// Updates an existing rule
    /// </summary>
    /// <param name="id">Rule ID</param>
    /// <param name="request">Update request</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>Updated rule definition</returns>
    Task<RuleDefinition> UpdateAsync(string id, UpdateRuleRequest request, CancellationToken cancellationToken = default);

    /// <summary>
    /// Deletes a rule
    /// </summary>
    /// <param name="id">Rule ID</param>
    /// <param name="cancellationToken">Cancellation token</param>
    Task DeleteAsync(string id, CancellationToken cancellationToken = default);

    /// <summary>
    /// Creates a new version of a rule
    /// </summary>
    /// <param name="ruleId">Rule ID</param>
    /// <param name="request">Version creation request</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>New rule version</returns>
    Task<RuleDefinition> CreateVersionAsync(string ruleId, CreateVersionRequest request, CancellationToken cancellationToken = default);

    /// <summary>
    /// Activates a specific version of a rule
    /// </summary>
    /// <param name="ruleId">Rule ID</param>
    /// <param name="version">Version number to activate</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>Activated rule definition</returns>
    Task<RuleDefinition> ActivateVersionAsync(string ruleId, int version, CancellationToken cancellationToken = default);
}
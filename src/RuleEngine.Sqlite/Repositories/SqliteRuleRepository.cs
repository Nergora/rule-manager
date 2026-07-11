using System.Threading;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using RuleEngine.Core.Abstractions;
using RuleEngine.Core.Models;
using RuleEngine.Sqlite.Data;

namespace RuleEngine.Sqlite.Repositories;

/// <summary>
/// SQLite implementation of the rule repository
/// </summary>
public class SqliteRuleRepository : IRuleRepository
{
    private readonly RuleDbContext _context;
    private readonly ILogger<SqliteRuleRepository> _logger;

    public SqliteRuleRepository(RuleDbContext context, ILogger<SqliteRuleRepository> logger)
    {
        ArgumentNullException.ThrowIfNull(context);
        ArgumentNullException.ThrowIfNull(logger);
        
        _context = context;
        _logger = logger;
    }

    /// <inheritdoc />
    public async Task<RuleDefinition?> GetByIdAsync(string id, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(id))
            throw new ArgumentException("ID cannot be null or empty", nameof(id));

        var ruleEntity = await _context.Rules
            .FirstOrDefaultAsync(r => r.Id == id, cancellationToken);

        if (ruleEntity == null)
            return null;

        return await BuildRuleDefinitionAsync(ruleEntity, cancellationToken);
    }

    /// <inheritdoc />
    public async Task<RuleDefinition?> GetActiveVersionAsync(string ruleId, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(ruleId))
            throw new ArgumentException("Rule ID cannot be null or empty", nameof(ruleId));

        var ruleEntity = await _context.Rules
            .FirstOrDefaultAsync(r => r.Id == ruleId, cancellationToken);

        if (ruleEntity == null)
            return null;

        return await BuildRuleDefinitionAsync(ruleEntity, cancellationToken);
    }

    /// <inheritdoc />
    public async Task<IEnumerable<RuleDefinition>> GetAllAsync(CancellationToken cancellationToken = default)
    {
        var ruleEntities = await _context.Rules.ToListAsync(cancellationToken);
        var rules = new List<RuleDefinition>();

        foreach (var ruleEntity in ruleEntities)
        {
            var rule = await BuildRuleDefinitionAsync(ruleEntity, cancellationToken);
            if (rule != null)
                rules.Add(rule);
        }

        return rules;
    }

    /// <inheritdoc />
    public async Task<RuleDefinition> CreateAsync(CreateRuleRequest request, CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(request);

        var ruleId = Guid.NewGuid().ToString();
        var now = DateTime.UtcNow;

        var ruleEntity = new RuleEntity
        {
            Id = ruleId,
            Name = request.Name,
            Description = request.Description,
            Status = RuleStatus.Draft,
            CreatedAt = now,
            UpdatedAt = now,
            Tags = request.Tags
        };

        _context.Rules.Add(ruleEntity);

        // Create initial version
        var versionEntity = RuleVersionEntity.FromDomainContent(ruleId, 1, request.Content);
        versionEntity.IsActive = true;
        _context.RuleVersions.Add(versionEntity);

        // Add parameters
        foreach (var parameter in request.Parameters)
        {
            var parameterEntity = RuleParameterEntity.FromDomainParameter(ruleId, parameter);
            _context.RuleParameters.Add(parameterEntity);
        }

        await _context.SaveChangesAsync(cancellationToken);

        _logger.LogInformation("Created rule {RuleId} with name {Name}", ruleId, request.Name);

        return await BuildRuleDefinitionAsync(ruleEntity, cancellationToken) ?? throw new InvalidOperationException("Failed to build rule definition after creation");
    }

    /// <inheritdoc />
    public async Task<RuleDefinition> UpdateAsync(string id, UpdateRuleRequest request, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(id))
            throw new ArgumentException("ID cannot be null or empty", nameof(id));

        ArgumentNullException.ThrowIfNull(request);

        var ruleEntity = await _context.Rules.FindAsync(new object[] { id }, cancellationToken);
        if (ruleEntity == null)
            throw new ArgumentException($"Rule with ID '{id}' not found", nameof(id));

        // Update basic properties
        if (request.Name != null)
            ruleEntity.Name = request.Name;
        if (request.Description != null)
            ruleEntity.Description = request.Description;
        if (request.Tags != null)
            ruleEntity.Tags = request.Tags;
        if (request.Status.HasValue)
            ruleEntity.Status = request.Status.Value;

        ruleEntity.UpdatedAt = DateTime.UtcNow;

        // Update content if provided
        if (request.Content != null)
        {
            // Deactivate current version
            var currentVersion = await _context.RuleVersions
                .FirstOrDefaultAsync(v => v.RuleId == id && v.IsActive, cancellationToken);
            if (currentVersion != null)
            {
                currentVersion.IsActive = false;
            }

            // Create new version
            var newVersionNumber = await GetNextVersionNumberAsync(id, cancellationToken);
            var newVersion = RuleVersionEntity.FromDomainContent(id, newVersionNumber, request.Content);
            newVersion.IsActive = true;
            _context.RuleVersions.Add(newVersion);
        }

        // Update parameters if provided
        if (request.Parameters != null)
        {
            // Remove existing parameters
            var existingParameters = await _context.RuleParameters
                .Where(p => p.RuleId == id)
                .ToListAsync(cancellationToken);
            _context.RuleParameters.RemoveRange(existingParameters);

            // Add new parameters
            foreach (var parameter in request.Parameters)
            {
                var parameterEntity = RuleParameterEntity.FromDomainParameter(id, parameter);
                _context.RuleParameters.Add(parameterEntity);
            }
        }

        await _context.SaveChangesAsync(cancellationToken);

        _logger.LogInformation("Updated rule {RuleId}", id);

        return await BuildRuleDefinitionAsync(ruleEntity, cancellationToken) ?? throw new InvalidOperationException("Failed to build rule definition after update");
    }

    /// <inheritdoc />
    public async Task DeleteAsync(string id, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(id))
            throw new ArgumentException("ID cannot be null or empty", nameof(id));

        var ruleEntity = await _context.Rules.FindAsync(new object[] { id }, cancellationToken);
        if (ruleEntity == null)
            throw new ArgumentException($"Rule with ID '{id}' not found", nameof(id));

        _context.Rules.Remove(ruleEntity);
        await _context.SaveChangesAsync(cancellationToken);

        _logger.LogInformation("Deleted rule {RuleId}", id);
    }

    /// <inheritdoc />
    public async Task<RuleDefinition> CreateVersionAsync(string ruleId, CreateVersionRequest request, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(ruleId))
            throw new ArgumentException("Rule ID cannot be null or empty", nameof(ruleId));

        ArgumentNullException.ThrowIfNull(request);

        var ruleEntity = await _context.Rules.FindAsync(new object[] { ruleId }, cancellationToken);
        if (ruleEntity == null)
            throw new ArgumentException($"Rule with ID '{ruleId}' not found", nameof(ruleId));

        // Deactivate current version if activating new one
        if (request.Activate)
        {
            var currentVersion = await _context.RuleVersions
                .FirstOrDefaultAsync(v => v.RuleId == ruleId && v.IsActive, cancellationToken);
            if (currentVersion != null)
            {
                currentVersion.IsActive = false;
            }
        }

        // Create new version
        var newVersionNumber = await GetNextVersionNumberAsync(ruleId, cancellationToken);
        var newVersion = RuleVersionEntity.FromDomainContent(ruleId, newVersionNumber, request.Content);
        newVersion.IsActive = request.Activate;
        _context.RuleVersions.Add(newVersion);

        // Update parameters if provided
        if (request.Parameters.Count > 0)
        {
            // Remove existing parameters
            var existingParameters = await _context.RuleParameters
                .Where(p => p.RuleId == ruleId)
                .ToListAsync(cancellationToken);
            _context.RuleParameters.RemoveRange(existingParameters);

            // Add new parameters
            foreach (var parameter in request.Parameters)
            {
                var parameterEntity = RuleParameterEntity.FromDomainParameter(ruleId, parameter);
                _context.RuleParameters.Add(parameterEntity);
            }
        }

        ruleEntity.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync(cancellationToken);

        _logger.LogInformation("Created version {Version} for rule {RuleId}", newVersionNumber, ruleId);

        return await BuildRuleDefinitionAsync(ruleEntity, cancellationToken) ?? throw new InvalidOperationException("Failed to build rule definition after version creation");
    }

    /// <inheritdoc />
    public async Task<RuleDefinition> ActivateVersionAsync(string ruleId, int version, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(ruleId))
            throw new ArgumentException("Rule ID cannot be null or empty", nameof(ruleId));

        var ruleEntity = await _context.Rules.FindAsync(new object[] { ruleId }, cancellationToken);
        if (ruleEntity == null)
            throw new ArgumentException($"Rule with ID '{ruleId}' not found", nameof(ruleId));

        // Deactivate current version
        var currentVersion = await _context.RuleVersions
            .FirstOrDefaultAsync(v => v.RuleId == ruleId && v.IsActive, cancellationToken);
        if (currentVersion != null)
        {
            currentVersion.IsActive = false;
        }

        // Activate specified version
        var targetVersion = await _context.RuleVersions
            .FirstOrDefaultAsync(v => v.RuleId == ruleId && v.Version == version, cancellationToken);
        if (targetVersion == null)
            throw new ArgumentException($"Version {version} not found for rule '{ruleId}'", nameof(version));

        targetVersion.IsActive = true;
        ruleEntity.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync(cancellationToken);

        _logger.LogInformation("Activated version {Version} for rule {RuleId}", version, ruleId);

        return await BuildRuleDefinitionAsync(ruleEntity, cancellationToken) ?? throw new InvalidOperationException("Failed to build rule definition after version activation");
    }

    private async Task<RuleDefinition?> BuildRuleDefinitionAsync(RuleEntity ruleEntity, CancellationToken cancellationToken)
    {
        // Get active version
        var activeVersion = await _context.RuleVersions
            .FirstOrDefaultAsync(v => v.RuleId == ruleEntity.Id && v.IsActive, cancellationToken);

        if (activeVersion == null)
            return null;

        // Get parameters
        var parameters = await _context.RuleParameters
            .Where(p => p.RuleId == ruleEntity.Id)
            .ToDictionaryAsync(p => p.Name, p => p.ToDomainParameter().Value, cancellationToken);

        var rule = ruleEntity.ToDomainModel();
        rule.Content = activeVersion.ToDomainContent();
        rule.Parameters = parameters;
        rule.Version = activeVersion.Version;

        return rule;
    }

    private async Task<int> GetNextVersionNumberAsync(string ruleId, CancellationToken cancellationToken)
    {
        var maxVersion = await _context.RuleVersions
            .Where(v => v.RuleId == ruleId)
            .MaxAsync(v => (int?)v.Version, cancellationToken) ?? 0;

        return maxVersion + 1;
    }
}
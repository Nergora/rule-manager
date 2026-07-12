using Microsoft.EntityFrameworkCore;
using RuleEngine.Core.Abstractions;
using RuleEngine.Core.Models;
using RuleEngineDemo.Server.Data;

namespace RuleEngineDemo.Server.Repositories;

public class EfRuleRepository : IRuleRepository
{
    private readonly AppDbContext _context;

    public EfRuleRepository(AppDbContext context)
    {
        _context = context;
    }

    public async Task<RuleDefinition?> GetByIdAsync(string id, CancellationToken cancellationToken = default)
    {
        return await _context.Rules.FindAsync(new object[] { id }, cancellationToken);
    }

    public async Task<RuleDefinition?> GetActiveVersionAsync(string ruleId, CancellationToken cancellationToken = default)
    {
        return await _context.Rules
            .Where(r => r.Id == ruleId && r.Status == RuleStatus.Active)
            .OrderByDescending(r => r.Version)
            .FirstOrDefaultAsync(cancellationToken);
    }

    public async Task<IEnumerable<RuleDefinition>> GetAllAsync(CancellationToken cancellationToken = default)
    {
        return await _context.Rules.ToListAsync(cancellationToken);
    }

    public async Task<RuleDefinition> CreateAsync(CreateRuleRequest request, CancellationToken cancellationToken = default)
    {
        var rule = new RuleDefinition
        {
            Id = Guid.NewGuid().ToString("N"),
            Name = request.Name,
            Description = request.Description ?? string.Empty,
            Tags = request.Tags ?? Array.Empty<string>(),
            Status = RuleStatus.Draft,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow,
            Version = 1,
            Content = request.Content,
            Parameters = request.Parameters ?? new Dictionary<string, object>()
        };

        _context.Rules.Add(rule);
        await _context.SaveChangesAsync(cancellationToken);
        return rule;
    }

    public async Task<RuleDefinition> UpdateAsync(string id, UpdateRuleRequest request, CancellationToken cancellationToken = default)
    {
        var existing = await _context.Rules.FindAsync(new object[] { id }, cancellationToken);
        if (existing == null)
            throw new KeyNotFoundException($"Rule {id} not found");

        existing.Name = request.Name ?? existing.Name;
        existing.Description = request.Description ?? existing.Description;
        existing.Tags = request.Tags ?? existing.Tags;
        existing.Status = request.Status ?? existing.Status;
        existing.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync(cancellationToken);
        return existing;
    }

    public async Task DeleteAsync(string id, CancellationToken cancellationToken = default)
    {
        var rule = await _context.Rules.FindAsync(new object[] { id }, cancellationToken);
        if (rule != null)
        {
            _context.Rules.Remove(rule);
            await _context.SaveChangesAsync(cancellationToken);
        }
    }

    public async Task<RuleDefinition> CreateVersionAsync(string ruleId, CreateVersionRequest request, CancellationToken cancellationToken = default)
    {
        var existing = await _context.Rules.FindAsync(new object[] { ruleId }, cancellationToken);
        if (existing == null)
            throw new KeyNotFoundException($"Rule {ruleId} not found");

        // Save current state as a historical snapshot
        var snapshot = new RuleEngineDemo.Server.Models.RuleVersionSnapshot
        {
            RuleId = existing.Id,
            Version = existing.Version,
            Content = existing.Content,
            CreatedAt = DateTime.UtcNow,
            CreatedBy = "System"
        };
        _context.RuleVersions.Add(snapshot);

        existing.Version++;
        existing.Content = request.Content;
        existing.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync(cancellationToken);
        return existing;
    }

    public async Task<RuleDefinition> ActivateVersionAsync(string ruleId, int version, CancellationToken cancellationToken = default)
    {
        var rule = await _context.Rules.FindAsync(new object[] { ruleId }, cancellationToken);
        if (rule == null)
            throw new KeyNotFoundException($"Rule {ruleId} not found");

        rule.Status = RuleStatus.Active;
        rule.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync(cancellationToken);
        return rule;
    }
}

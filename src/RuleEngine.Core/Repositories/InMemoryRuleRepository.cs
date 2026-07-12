using System.Collections.Concurrent;
using RuleEngine.Core.Abstractions;
using RuleEngine.Core.Models;

namespace RuleEngine.Core.Repositories;

public sealed class InMemoryRuleRepository : IRuleRepository
{
    private readonly ConcurrentDictionary<string, RuleEntry> _rules = new ConcurrentDictionary<string, RuleEntry>();

    public Task<RuleDefinition?> GetByIdAsync(string id, CancellationToken cancellationToken = default)
    {
        return Task.FromResult(_rules.TryGetValue(id, out var entry) ? entry.BuildActiveDefinition() : null);
    }

    public Task<RuleDefinition?> GetActiveVersionAsync(string ruleId, CancellationToken cancellationToken = default)
    {
        return Task.FromResult(_rules.TryGetValue(ruleId, out var entry) ? entry.BuildActiveDefinition() : null);
    }

    public Task<IEnumerable<RuleDefinition>> GetAllAsync(CancellationToken cancellationToken = default)
    {
        var values = _rules.Values.Select(entry => entry.BuildActiveDefinition());
        return Task.FromResult(values);
    }

    public Task<RuleDefinition> CreateAsync(CreateRuleRequest request, CancellationToken cancellationToken = default)
    {
        var ruleId = Guid.NewGuid().ToString("N");
        var now = DateTime.UtcNow;

        var entry = new RuleEntry
        {
            Id = ruleId,
            Name = request.Name,
            Description = request.Description ?? string.Empty,
            Tags = request.Tags ?? Array.Empty<string>(),
            Status = RuleStatus.Draft,
            CreatedAt = now,
            UpdatedAt = now,
            Parameters = request.Parameters ?? new Dictionary<string, object>(),
            Versions = new List<RuleContent> { request.Content ?? new RuleContent() },
            ActiveVersion = 1
        };

        _rules[ruleId] = entry;
        return Task.FromResult(entry.BuildActiveDefinition());
    }

    public Task<RuleDefinition> UpdateAsync(string id, UpdateRuleRequest request, CancellationToken cancellationToken = default)
    {
        if (!_rules.TryGetValue(id, out var entry))
            throw new ArgumentException("Rule not found.", nameof(id));

        if (request.Name != null)
            entry.Name = request.Name;
        if (request.Description != null)
            entry.Description = request.Description;
        if (request.Tags != null)
            entry.Tags = request.Tags;
        if (request.Status.HasValue)
            entry.Status = request.Status.Value;
        if (request.Parameters != null)
            entry.Parameters = request.Parameters;

        if (request.Content != null)
        {
            entry.Versions.Add(request.Content);
            entry.ActiveVersion = entry.Versions.Count;
        }

        entry.UpdatedAt = DateTime.UtcNow;
        return Task.FromResult(entry.BuildActiveDefinition());
    }

    public Task DeleteAsync(string id, CancellationToken cancellationToken = default)
    {
        _rules.TryRemove(id, out _);
        return Task.CompletedTask;
    }

    public Task<RuleDefinition> CreateVersionAsync(string ruleId, CreateVersionRequest request, CancellationToken cancellationToken = default)
    {
        if (!_rules.TryGetValue(ruleId, out var entry))
            throw new ArgumentException("Rule not found.", nameof(ruleId));

        entry.Versions.Add(request.Content ?? new RuleContent());
        entry.UpdatedAt = DateTime.UtcNow;
        if (request.Parameters != null && request.Parameters.Count > 0)
            entry.Parameters = request.Parameters;

        if (request.Activate)
            entry.ActiveVersion = entry.Versions.Count;

        return Task.FromResult(entry.BuildActiveDefinition());
    }

    public Task<RuleDefinition> ActivateVersionAsync(string ruleId, int version, CancellationToken cancellationToken = default)
    {
        if (!_rules.TryGetValue(ruleId, out var entry))
            throw new ArgumentException("Rule not found.", nameof(ruleId));
        if (version < 1 || version > entry.Versions.Count)
            throw new ArgumentOutOfRangeException(nameof(version), "Version out of range.");

        entry.ActiveVersion = version;
        entry.Status = RuleStatus.Active;
        entry.UpdatedAt = DateTime.UtcNow;
        return Task.FromResult(entry.BuildActiveDefinition());
    }

    private sealed class RuleEntry
    {
        public string Id { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public string[] Tags { get; set; } = Array.Empty<string>();
        public RuleStatus Status { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }
        public Dictionary<string, object> Parameters { get; set; } = new();
        public List<RuleContent> Versions { get; set; } = new();
        public int ActiveVersion { get; set; } = 1;

        public RuleDefinition BuildActiveDefinition()
        {
            var versionIndex = Math.Max(1, ActiveVersion) - 1;
            var content = Versions.Count > versionIndex ? Versions[versionIndex] : new RuleContent();

            return new RuleDefinition
            {
                Id = Id,
                Name = Name,
                Description = Description,
                Tags = Tags,
                Status = Status == RuleStatus.Draft ? RuleStatus.Active : Status,
                CreatedAt = CreatedAt,
                UpdatedAt = UpdatedAt,
                Version = ActiveVersion,
                Content = content,
                Parameters = Parameters
            };
        }
    }
}

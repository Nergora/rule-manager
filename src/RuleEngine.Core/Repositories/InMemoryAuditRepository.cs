using System.Collections.Concurrent;
using RuleEngine.Core.Abstractions;
using RuleEngine.Core.Models;

namespace RuleEngine.Core.Repositories;

public sealed class InMemoryAuditRepository : IAuditRepository
{
    private readonly ConcurrentQueue<RuleExecutionAudit> _audits = new ConcurrentQueue<RuleExecutionAudit>();

    public Task LogExecutionAsync(RuleExecutionAudit audit)
    {
        _audits.Enqueue(audit);
        return Task.CompletedTask;
    }

    public Task<IEnumerable<RuleExecutionAudit>> GetExecutionHistoryAsync(string ruleId, int limit = 100)
    {
        var history = _audits.Where(audit => audit.RuleId == ruleId)
            .OrderByDescending(audit => audit.ExecutedAt)
            .Take(limit)
            .ToList();
        return Task.FromResult<IEnumerable<RuleExecutionAudit>>(history);
    }
}

using RuleEngine.Core.Models;

namespace RuleEngineDemoVue.Server.Models;

public class RuleVersionSnapshot
{
    public int Id { get; set; }
    public string RuleId { get; set; } = string.Empty;
    public int Version { get; set; }
    public RuleContent Content { get; set; } = new();
    public DateTime CreatedAt { get; set; }
    public string? CreatedBy { get; set; }
}

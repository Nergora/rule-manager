namespace RuleEngineDemoVue.Server.Models;

public class CampaignUsage
{
    public int Id { get; set; }
    public int CampaignId { get; set; }
    public DateTime UsedAt { get; set; }
    public string? OrderId { get; set; }
    public string? CustomerId { get; set; }
}

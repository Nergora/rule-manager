using CampaignEngine.Core.Abstractions;
using CampaignEngine.Core.Models;
using RuleEngineDemoVue.Server.Data;

namespace RuleEngineDemoVue.Server.Repositories;

public class EfCampaignRepository : ICampaignRepository
{
    private readonly AppDbContext _context;

    public EfCampaignRepository(AppDbContext context)
    {
        _context = context;
    }

    public IEnumerable<GeneralCampaign> GetCampaigns(DateTime after, int moduleId)
    {
        return _context.Campaigns
            .Where(c => c.ModulId == moduleId && c.EndDate >= after)
            .OrderByDescending(c => c.Priority)
            .ToList();
    }

    public IDictionary<string, bool> GetAllCampaigns(IDictionary<string, bool> keys)
    {
        var result = new Dictionary<string, bool>();
        var campaigns = _context.Campaigns.ToList();
        
        foreach (var key in keys)
        {
            var exists = campaigns.Any(c => c.Code == key.Key);
            result.Add(key.Key, exists);
        }
        return result;
    }

    public bool CheckCampaignQuota(int quota, int id)
    {
        var campaign = _context.Campaigns.Find(id);
        if (campaign == null) return false;
        
        if (!campaign.Quota.HasValue) return true;
        
        return campaign.Quota.Value > 0;
    }

    public void AddCampaign(GeneralCampaign campaign)
    {
        campaign.CreateDate = DateTime.UtcNow;
        _context.Campaigns.Add(campaign);
        _context.SaveChanges();
    }

    public GeneralCampaign? GetById(int id)
    {
        return _context.Campaigns.Find(id);
    }

    public bool UpdateCampaign(GeneralCampaign campaign)
    {
        var existing = _context.Campaigns.Find(campaign.Id);
        if (existing == null) return false;

        _context.Entry(existing).CurrentValues.SetValues(campaign);
        _context.SaveChanges();
        return true;
    }

    public bool DeleteCampaign(int id)
    {
        var campaign = _context.Campaigns.Find(id);
        if (campaign == null) return false;

        _context.Campaigns.Remove(campaign);
        _context.SaveChanges();
        return true;
    }
}

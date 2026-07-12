using CampaignEngine.Core.Models;

namespace CampaignEngine.Core.Abstractions;

/// <summary>
/// Repository interface for accessing campaign data.
/// </summary>
public interface ICampaignRepository
{
    IEnumerable<GeneralCampaign> GetCampaigns(System.DateTime after, int moduleId);
    IDictionary<string, bool> GetAllCampaigns(IDictionary<string, bool> keys);
    bool CheckCampaignQuota(int quota, int campaignId);
    void AddCampaign(GeneralCampaign campaign);
    GeneralCampaign? GetById(int id);
    bool UpdateCampaign(GeneralCampaign campaign);
    bool DeleteCampaign(int id);
    void RecordUsage(int campaignId, string? orderId = null, string? customerId = null);
}

/// <summary>
/// Represents a travel product that may have campaign discounts applied.
/// </summary>
public interface ITravelProduct
{
    string Key { get; set; }
    Price TotalPrice { get; set; }
    IDictionary<string, CampaignInformation> CampaignInformations { get; set; }
}
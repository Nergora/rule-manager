namespace CampaignEngine.Core.Abstractions;

/// <summary>
/// Generic cache abstraction for campaign data.
/// </summary>
public interface ICacheProvider
{
    T? Get<T>(string key);
    void Set<T>(string key, T value, System.TimeSpan expiration);
    T? GetOrCreate<T>(string key, System.Func<T> factory, System.TimeSpan expiration);
    System.Threading.Tasks.Task<T?> GetOrCreateAsync<T>(string key, System.Func<System.Threading.Tasks.Task<T>> factory, System.TimeSpan expiration);
    string GenerateKey(params object[] parts);
    void RemoveByPrefix(string prefix);
}

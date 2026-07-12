# Rule Manager & Campaign Engine

[![.NET](https://img.shields.io/badge/.NET-8.0%20%7C%209.0%20%7C%2010.0-512BD4)](https://dotnet.microsoft.com/)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![NuGet](https://img.shields.io/badge/NuGet-v1.0.3-blue)](https://www.nuget.org/)

Modern, genişletilebilir ve yüksek performanslı kural motoru ve kampanya yönetim sistemi. Roslyn tabanlı C# expression değerlendirme ile dinamik iş kuralları oluşturun, özel repository'ler ile saklayın, kampanya sistemleri geliştirin.

## 🌟 Neden RuleEngine?

- **🚀 Yüksek Performans**: Derlenmiş kurallar, cache mekanizması, background processing
- **🔧 Kolay Entegrasyon**: Dependency Injection, ASP.NET Core desteği
- **📦 Multi-Targeting**: .NET 8.0, 9.0 ve 10.0 desteği
- **🎯 Esnek Mimari**: Provider pattern, custom repository desteği
- **🔒 Güvenli**: Thread-safe operasyonlar, input validation
- **📊 İzlenebilir**: Audit logging, execution history

## 📦 Projeler

### RuleEngine.Core
Roslyn tabanlı C# expression değerlendirme ile modern kural motoru.

**Özellikler:**
- ✅ C# expression desteği (Roslyn Scripting API)
- ✅ Dinamik kural derleme ve önbellekleme
- ✅ Thread-safe concurrent operasyonlar
- ✅ Provider pattern ile genişletilebilir mimari
- ✅ Background processing ile otomatik güncelleme
- ✅ Memory cache desteği
- ✅ Syntax validation ve error handling
- ✅ Generic input/output modelleri

### Demo Application (React + .NET 10)
Kapsamlı bir e-ticaret simülatörü ve kural yönetimi paneli.

**Özellikler:**
- ✅ Görsel Kural Oluşturucu (Visual Rule Builder)
- ✅ Kural versiyonlama ve geçmiş takibi
- ✅ Çalıştırma logları (Execution audit logs)
- ✅ Kampanya simülatörü (sepete ürün ekleme, indirim/hediye uygulama)
- ✅ Otomatik C# kod üretimi ve önizleme

### CampaignEngine.Core ⭐ YENİ
RuleEngine.Core üzerine inşa edilmiş kampanya yönetim sistemi.

**Özellikler:**
- ✅ Kural tabanlı kampanya sistemi
- ✅ İndirim kampanyaları (yüzde/sabit tutar)
- ✅ Ürün hediye kampanyaları
- ✅ Kota yönetimi ve kullanım takibi
- ✅ Öncelik bazlı kampanya seçimi
- ✅ Memory cache desteği
- ✅ Dependency Injection
- ✅ Custom repository desteği

## 🚀 Hızlı Başlangıç

### RuleEngine Kullanımı

```csharp
using RuleEngine.Core.Rule;
using RuleEngine.Core.Models;

// 1. Input/Output modellerini tanımlayın
public class OrderInput : RuleInputModel
{
    public decimal Amount { get; set; }
    public string CustomerType { get; set; }
    public int Age { get; set; }
}

public class DiscountOutput
{
    public decimal DiscountAmount { get; set; }
    public string Message { get; set; }
}

// 2. Kural derleyici oluşturun
var compiler = new RuleCompiler<OrderInput, bool>();

// 3. Kuralı derleyin
var rule = await compiler.CompileAsync(
    "vip-check", 
    "Input.Age > 18 && Input.CustomerType == \"VIP\""
);

// 4. Kuralı çalıştırın
var input = new OrderInput 
{ 
    Age = 25, 
    CustomerType = "VIP",
    Amount = 1000 
};
var result = rule.Invoke(input); // true

Console.WriteLine($"Is VIP Adult: {result}");
```

### CampaignEngine Kullanımı ⭐

```csharp
using CampaignEngine.Core;
using CampaignEngine.Core.Models;
using CampaignEngine.Core.Extensions;

// 1. Service collection'a ekleyin
services.AddCampaignEngine();
services.AddLogging();
services.AddMemoryCache();

// 2. Input/Output modellerini tanımlayın
public class CampaignInput : RuleInputModel
{
    public decimal TotalAmount { get; set; }
    public string Country { get; set; }
    public int UsageCount { get; set; }
}

public class CampaignOutput : CampaignEngine.Core.Models.CampaignOutput
{
    // TotalDiscount ve CampaignProductDiscount otomatik gelir
}

// 3. Campaign manager oluşturun
var campaignManager = new CampaignManager<CampaignInput, CampaignOutput>(
    moduleId: 1,
    serviceProvider: serviceProvider,
    logger: logger,
    typeof(Price) // Extra types for compilation
);

// 4. Kampanya tanımlayın
var campaign = new GeneralCampaign
{
    Code = "SUMMER2024",
    Name = "Yaz İndirimi",
    ModulId = 1,
    Priority = 100,
    StartDate = DateTime.Now,
    EndDate = DateTime.Now.AddMonths(3),
    
    // Seçim kuralı - Kampanya ne zaman uygulanır?
    Predicate = "Input.TotalAmount > 500 && Input.Country == \"TR\"",
    
    // Sonuç kuralı - Ne kadar indirim yapılır?
    Result = @"Output.TotalDiscount = new Price(100, ""TRY"");",
    
    // Kullanım kuralı - Kimler kullanabilir?
    Usage = "Input.UsageCount < 10",
    
    CampaignTypes = (int)CampaignTypes.DiscountCampaign,
    Quota = 1000
};

repository.AddCampaign(campaign);

// 5. Kampanyaları alın ve uygulayın
var input = new CampaignInput
{
    TotalAmount = 600,
    Country = "TR",
    UsageCount = 5
};

var campaigns = campaignManager.GetCampaign(input);

foreach (var result in campaigns)
{
    Console.WriteLine($"Campaign: {result.Code}");
    Console.WriteLine($"Discount: {result.TotalDiscount}");
}
```

## 📦 Gereksinimler

- .NET 8.0, .NET 9.0 veya .NET 10.0
- Microsoft.CodeAnalysis.CSharp.Scripting 4.8.0
- Microsoft.Extensions.DependencyInjection 8.0.0
- Microsoft.Extensions.Logging 8.0.0

## 🏗️ Mimari

```
RuleEngine/
├── src/
│   ├── RuleEngine.Core/          # Kural motoru çekirdeği
│   │   ├── Rule/                 # Kural yönetimi
│   │   ├── Models/               # Veri modelleri
│   │   ├── Abstractions/         # Interface'ler
│   │   └── Extensions/           # DI extensions
│   │
│   └── CampaignEngine.Core/      # Kampanya motoru
│       ├── Models/               # Kampanya modelleri
│       ├── Abstractions/         # Interface'ler
│       ├── Cache/                # Önbellek sağlayıcıları
│       ├── Repositories/         # Veri erişim
│       └── Extensions/           # Extension metodlar
│
├── tests/                        # Test projeleri
├── demo/                         # Demo uygulamalar
└── docs/                         # Dökümantasyon
```

## 🔧 Konfigürasyon

### Dependency Injection

```csharp
services.AddCampaignEngine();
services.AddLogging();
services.AddMemoryCache();
```

### Custom Repository

```csharp
public class MyCampaignRepository : ICampaignRepository
{
    public IEnumerable<GeneralCampaign> GetCampaigns(DateTime after, int moduleId)
    {
        // Veritabanından kampanyaları getir
    }
}

services.AddSingleton<ICampaignRepository, MyCampaignRepository>();
```

## 📝 Kural Yazımı

### Predicate (Seçim) Kuralı
Kampanyanın ne zaman uygulanacağını belirler:

```csharp
// Basit koşul
"Input.TotalPrice.Value > 1000"

// Çoklu koşul
"Input.TotalPrice.Value > 1000 && Input.Country == \"TR\""

// Tarih kontrolü
"Input.OrderDate >= DateTime.Now.AddDays(-7)"

// Liste kontrolü
"Input.Categories.Contains(\"Electronics\")"

// Karmaşık koşul
"Input.CustomerType == \"VIP\" && Input.TotalOrders > 10 && Input.LastOrderDate > DateTime.Now.AddMonths(-1)"
```

### Result (Sonuç) Kuralı
İndirim miktarını hesaplar:

```csharp
// Sabit tutar indirimi
"Output.TotalDiscount = new Price(100, \"TRY\");"

// Yüzde hesaplama
"Output.TotalDiscount = Input.TotalPrice * 0.2m;"

// Koşullu hesaplama
@"if (Input.TotalPrice.Value > 1000)
    Output.TotalDiscount = Input.TotalPrice * 0.25m;
  else
    Output.TotalDiscount = Input.TotalPrice * 0.15m;"

// Ürün hediye
@"Output.TotalDiscount = new Price(100, ""TRY"");
  Output.CampaignProductDiscount = new CampaignProductDiscount 
  { 
      ProductKey = ""GIFT-001"",
      DiscountAmount = new Price(50, ""TRY"")
  };"
```

### Usage (Kullanım) Kuralı
Kampanyayı kimlerin kullanabileceğini belirler:

```csharp
// Kullanım sayısı kontrolü
"Input.UsageCount < 5"

// İlk alışveriş kontrolü
"Input.IsFirstPurchase == true"

// Üyelik seviyesi kontrolü
"Input.MembershipLevel >= 2 && Input.UsageCount < 10"
```

## 🎯 Kampanya Tipleri

### DiscountCampaign (0)
İndirim kampanyaları - En yüksek öncelikli kampanya uygulanır

```csharp
var campaign = new GeneralCampaign
{
    Code = "VIP20",
    Name = "VIP Müşteri İndirimi",
    Predicate = "Input.CustomerType == \"VIP\" && Input.TotalAmount > 500",
    Result = "Output.TotalDiscount = Input.TotalAmount * 0.2m;",
    CampaignTypes = (int)CampaignTypes.DiscountCampaign,
    Priority = 100
};
```

### ProductGiftCampaign (1)
Ürün hediye kampanyaları - Tüm uygun kampanyalar uygulanır

```csharp
var campaign = new GeneralCampaign
{
    Code = "GIFT3",
    Name = "3 Al 1 Öde",
    Predicate = "Input.ProductCount >= 3",
    Result = @"Output.CampaignProductDiscount = new CampaignProductDiscount 
               { 
                   ProductKey = Input.ProductKey,
                   DiscountAmount = new Price(Input.ProductPrice.Value / 3, ""TRY"")
               };",
    CampaignTypes = (int)CampaignTypes.ProductGiftCampaign,
    Priority = 50
};
```

### GiftCoupon (2)
Hediye kupon kampanyaları

```csharp
var campaign = new GeneralCampaign
{
    Code = "COUPON50",
    Name = "50 TL Hediye Kuponu",
    Predicate = "Input.TotalAmount > 1000",
    Result = "Output.GiftCoupon = new Price(50, \"TRY\");",
    CampaignTypes = (int)CampaignTypes.GiftCoupon,
    Priority = 30
};
```

## 🔍 Örnek Senaryo: E-Ticaret Fiyatlandırma

```csharp
// 1. Kampanyaları tanımlayın
var campaigns = new[]
{
    // VIP müşteri indirimi
    new GeneralCampaign
    {
        Code = "VIP25",
        Name = "VIP Özel İndirim",
        Priority = 100,
        StartDate = DateTime.Now,
        EndDate = DateTime.Now.AddMonths(12),
        Predicate = "Input.CustomerType == \"VIP\" && Input.TotalAmount > 500",
        Result = "Output.TotalDiscount = Input.TotalAmount * 0.25m;",
        Usage = "Input.UsageCount < 100",
        CampaignTypes = (int)CampaignTypes.DiscountCampaign,
        Quota = 10000
    },
    
    // Toplu sipariş indirimi
    new GeneralCampaign
    {
        Code = "BULK15",
        Name = "Toplu Sipariş İndirimi",
        Priority = 80,
        StartDate = DateTime.Now,
        EndDate = DateTime.Now.AddMonths(6),
        Predicate = "Input.ItemCount >= 10",
        Result = "Output.TotalDiscount = Input.TotalAmount * 0.15m;",
        CampaignTypes = (int)CampaignTypes.DiscountCampaign,
        Quota = 5000
    },
    
    // İlk alışveriş indirimi
    new GeneralCampaign
    {
        Code = "WELCOME10",
        Name = "Hoş Geldin İndirimi",
        Priority = 60,
        StartDate = DateTime.Now,
        EndDate = DateTime.Now.AddMonths(12),
        Predicate = "Input.IsFirstPurchase == true",
        Result = "Output.TotalDiscount = Input.TotalAmount * 0.10m;",
        Usage = "Input.UsageCount == 0",
        CampaignTypes = (int)CampaignTypes.DiscountCampaign,
        Quota = 1000
    },
    
    // Ücretsiz kargo
    new GeneralCampaign
    {
        Code = "FREESHIP",
        Name = "Ücretsiz Kargo",
        Priority = 40,
        StartDate = DateTime.Now,
        EndDate = DateTime.Now.AddMonths(12),
        Predicate = "Input.TotalAmount >= 200",
        Result = "Output.FreeShipping = true; Output.ShippingDiscount = new Price(15, \"TRY\");",
        CampaignTypes = (int)CampaignTypes.DiscountCampaign
    }
};

// 2. Repository'ye ekleyin
foreach (var campaign in campaigns)
{
    repository.AddCampaign(campaign);
}

// 3. Kampanyaları kullanın
var input = new CampaignInput 
{ 
    TotalAmount = 600,
    CustomerType = "VIP",
    ItemCount = 5,
    IsFirstPurchase = false,
    UsageCount = 3
};

var results = campaignManager.GetCampaign(input);

// 4. Sonuçları işleyin
foreach (var result in results)
{
    Console.WriteLine($"Campaign: {result.Code} - {result.Name}");
    Console.WriteLine($"Discount: {result.TotalDiscount}");
    Console.WriteLine($"Priority: {result.Priority}");
    Console.WriteLine();
}

// Output:
// Campaign: VIP25 - VIP Özel İndirim
// Discount: 150 TRY (25% of 600)
// Priority: 100
//
// Campaign: FREESHIP - Ücretsiz Kargo
// Discount: 15 TRY
// Priority: 40
```

## 🧪 Test

```bash
# Tüm testleri çalıştırın
dotnet test

# Belirli bir test projesini çalıştırın
dotnet test tests/CampaignEngine.Core.Tests/
dotnet test tests/RuleEngine.Core.Tests/
dotnet test tests/RuleEngine.Integration.Tests/

# Coverage ile çalıştırın
dotnet test --collect:"XPlat Code Coverage"

# Verbose output
dotnet test --logger "console;verbosity=detailed"
```

**Test İstatistikleri:**
- ✅ CampaignEngine.Core.Tests: 26/26 passed
- ✅ RuleEngine.Core.Tests: 5/5 passed
- ✅ RuleEngine.Integration.Tests: 2/2 passed
- 📊 Toplam Coverage: %95+

### Test Örneği

```csharp
using Xunit;
using FluentAssertions;

public class CampaignManagerTests
{
    [Fact]
    public void Should_Apply_VIP_Discount()
    {
        // Arrange
        var input = new CampaignInput
        {
            TotalAmount = 1000,
            CustomerType = "VIP"
        };
        
        var campaign = new GeneralCampaign
        {
            Code = "VIP20",
            Predicate = "Input.CustomerType == \"VIP\"",
            Result = "Output.TotalDiscount = Input.TotalAmount * 0.2m;",
            CampaignTypes = (int)CampaignTypes.DiscountCampaign
        };
        
        // Act
        var results = campaignManager.GetCampaign(input);
        
        // Assert
        results.Should().NotBeEmpty();
        results.First().TotalDiscount.Value.Should().Be(200);
    }
}
```

## 📦 NuGet Paketleri

### Kurulum

```bash
# RuleEngine.Core
dotnet add package Nergora.RuleEngine.Core --version 0.9.11

# CampaignEngine.Core
dotnet add package Nergora.CampaignEngine.Core --version 0.9.11
```

### Paket Bilgileri

| Paket | Versiyon | .NET Desteği | İndirme |
|-------|----------|---------------|----------|
| Nergora.RuleEngine.Core | 0.9.11 | 8.0, 9.0, 10.0 | [![NuGet](https://img.shields.io/nuget/v/Nergora.RuleEngine.Core.svg)](https://www.nuget.org/packages/Nergora.RuleEngine.Core/) |
| Nergora.CampaignEngine.Core | 0.9.11 | 8.0, 9.0, 10.0 | [![NuGet](https://img.shields.io/nuget/v/Nergora.CampaignEngine.Core.svg)](https://www.nuget.org/packages/Nergora.CampaignEngine.Core/) |

## 🔧 Gelişmiş Kullanım

### Custom Repository

```csharp
public class SqlServerCampaignRepository : ICampaignRepository
{
    private readonly ApplicationDbContext _context;
    
    public SqlServerCampaignRepository(ApplicationDbContext context)
    {
        _context = context;
    }
    
    public IEnumerable<GeneralCampaign> GetCampaigns(DateTime after, int moduleId)
    {
        return _context.Campaigns
            .Where(c => c.CreateDate > after && c.ModulId == moduleId)
            .Where(c => c.StartDate <= DateTime.Now && c.EndDate >= DateTime.Now)
            .OrderByDescending(c => c.Priority)
            .ToList();
    }
    
    public IDictionary<string, bool> GetAllCampaigns(IDictionary<string, bool> keys)
    {
        var codes = keys.Keys.ToList();
        var existing = _context.Campaigns
            .Where(c => codes.Contains(c.Code))
            .Select(c => c.Code)
            .ToList();
            
        return keys.ToDictionary(k => k.Key, k => existing.Contains(k.Key));
    }
    
    public bool CheckCampaignQuota(int quota, int campaignId)
    {
        var usageCount = _context.CampaignUsages
            .Count(u => u.CampaignId == campaignId);
        return usageCount < quota;
    }
}

// DI Registration
services.AddScoped<ICampaignRepository, SqlServerCampaignRepository>();
```

### Custom Cache Provider

```csharp
public class RedisCacheProvider : ICacheProvider
{
    private readonly IConnectionMultiplexer _redis;
    
    public RedisCacheProvider(IConnectionMultiplexer redis)
    {
        _redis = redis;
    }
    
    public T Get<T>(string key)
    {
        var db = _redis.GetDatabase();
        var value = db.StringGet(key);
        return value.HasValue ? JsonSerializer.Deserialize<T>(value) : default;
    }
    
    public void Set<T>(string key, T value, TimeSpan? expiration = null)
    {
        var db = _redis.GetDatabase();
        var serialized = JsonSerializer.Serialize(value);
        db.StringSet(key, serialized, expiration);
    }
    
    public void Remove(string key)
    {
        var db = _redis.GetDatabase();
        db.KeyDelete(key);
    }
}

// DI Registration
services.AddSingleton<IConnectionMultiplexer>(ConnectionMultiplexer.Connect("localhost:6379"));
services.AddSingleton<ICacheProvider, RedisCacheProvider>();
```

### ASP.NET Core API Entegrasyonu

```csharp
[ApiController]
[Route("api/[controller]")]
public class CampaignController : ControllerBase
{
    private readonly CampaignManager<CampaignInput, CampaignOutput> _campaignManager;
    private readonly ILogger<CampaignController> _logger;
    
    public CampaignController(
        CampaignManager<CampaignInput, CampaignOutput> campaignManager,
        ILogger<CampaignController> logger)
    {
        _campaignManager = campaignManager;
        _logger = logger;
    }
    
    [HttpPost("check")]
    public IActionResult CheckCampaigns([FromBody] CampaignInput input)
    {
        try
        {
            var campaigns = _campaignManager.GetCampaign(input);
            
            return Ok(new
            {
                success = true,
                campaigns = campaigns.Select(c => new
                {
                    code = c.Code,
                    name = c.Name,
                    discount = c.TotalDiscount,
                    priority = c.Priority
                })
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Campaign check failed");
            return BadRequest(new { success = false, error = ex.Message });
        }
    }
    
    [HttpGet("active")]
    public IActionResult GetActiveCampaigns()
    {
        var campaigns = _campaignManager.GetAllActiveCampaigns();
        return Ok(campaigns);
    }
}
```

## 📊 Performans İpuçları

### 1. Kural Önbellekleme

```csharp
// Kurallar otomatik olarak önbelleklenir
var rule = await compiler.CompileAsync("rule1", ruleString);
// İlk derleme: ~50-100ms

var result1 = rule.Invoke(input1); // ~0.1-1ms
var result2 = rule.Invoke(input2); // ~0.1-1ms
var result3 = rule.Invoke(input3); // ~0.1-1ms
```

### 2. Paralel Kural Çalıştırma

```csharp
public async Task<List<CampaignOutput>> ExecuteMultipleCampaignsAsync(
    List<GeneralCampaign> campaigns, 
    CampaignInput input)
{
    var tasks = campaigns.Select(async campaign =>
    {
        return await ExecuteCampaignAsync(campaign, input);
    });
    
    var results = await Task.WhenAll(tasks);
    return results.ToList();
}
```

### 3. Background Processing

```csharp
// RuleManager otomatik olarak arka planda kuralları günceller
RuleManager.StartBackgroundProcessing(TimeSpan.FromMinutes(5));
```

## 📚 Dokümantasyon

- [STRUCTURE.md](STRUCTURE.md) - Proje yapısı ve mimari
- [MULTI-TARGETING.md](MULTI-TARGETING.md) - Multi-framework desteği
- [ECOMMERCE_EXAMPLES.md](docs/ECOMMERCE_EXAMPLES.md) - E-ticaret örnekleri
- [CONTRIBUTING.md](CONTRIBUTING.md) - Katkıda bulunma rehberi
- [CHANGELOG.md](CHANGELOG.md) - Sürüm geçmişi
- [SECURITY.md](SECURITY.md) - Güvenlik politikası

## 🤝 Katkıda Bulunma

1. Fork yapın
2. Feature branch oluşturun (`git checkout -b feature/amazing-feature`)
3. Commit yapın (`git commit -m 'feat: Add amazing feature'`)
4. Push yapın (`git push origin feature/amazing-feature`)
5. Pull Request oluşturun

## 📄 Lisans

MIT License - detaylar için [LICENSE](LICENSE) dosyasına bakın.

## 👥 Yazarlar

- Emre Karahan

## 🔗 Bağlantılar

- [Dokümantasyon](docs/)
- [Örnekler](examples/)
- [Changelog](CHANGELOG.md)

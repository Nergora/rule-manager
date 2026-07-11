# Multi-Targeting Support

All NuGet packages now support .NET 8.0, .NET 9.0, and .NET 10.0.

## 📦 Supported Frameworks

| Package | .NET 8.0 | .NET 9.0 | .NET 10.0 | Version |
|---------|----------|----------|-----------|---------|
| **Nergora.RuleEngine.Core** | ✅ | ✅ | ✅ | v1.0.3 |
| **Nergora.RuleEngine.Sqlite** | ✅ | ✅ | ✅ | v1.0.3 |
| **Nergora.CampaignEngine.Core** | ✅ | ✅ | ✅ | v1.0.2 |

## 🚀 Usage

### .NET 8.0 Project
```xml
<Project Sdk="Microsoft.NET.Sdk">
  <PropertyGroup>
    <TargetFramework>net8.0</TargetFramework>
  </PropertyGroup>
  <ItemGroup>
    <PackageReference Include="Nergora.RuleEngine.Core" Version="1.0.3" />
    <PackageReference Include="Nergora.CampaignEngine.Core" Version="1.0.2" />
  </ItemGroup>
</Project>
```

### .NET 9.0 Project
```xml
<Project Sdk="Microsoft.NET.Sdk">
  <PropertyGroup>
    <TargetFramework>net9.0</TargetFramework>
  </PropertyGroup>
  <ItemGroup>
    <PackageReference Include="Nergora.RuleEngine.Core" Version="1.0.3" />
    <PackageReference Include="Nergora.CampaignEngine.Core" Version="1.0.2" />
  </ItemGroup>
</Project>
```

### .NET 10.0 Project
```xml
<Project Sdk="Microsoft.NET.Sdk">
  <PropertyGroup>
    <TargetFramework>net10.0</TargetFramework>
  </PropertyGroup>
  <ItemGroup>
    <PackageReference Include="Nergora.RuleEngine.Core" Version="1.0.3" />
    <PackageReference Include="Nergora.CampaignEngine.Core" Version="1.0.2" />
  </ItemGroup>
</Project>
```

## 📊 NuGet Package Contents

### Nergora.RuleEngine.Core v1.0.3
```
lib/
├── net8.0/
│   └── RuleEngine.Core.dll
├── net9.0/
│   └── RuleEngine.Core.dll
└── net10.0/
    └── RuleEngine.Core.dll
```

### Nergora.CampaignEngine.Core v1.0.2
```
lib/
├── net8.0/
│   └── CampaignEngine.Core.dll
├── net9.0/
│   └── CampaignEngine.Core.dll
└── net10.0/
    └── CampaignEngine.Core.dll
```

### Nergora.RuleEngine.Sqlite v1.0.3
```
lib/
├── net8.0/
│   └── RuleEngine.Sqlite.dll
├── net9.0/
│   └── RuleEngine.Sqlite.dll
└── net10.0/
    └── RuleEngine.Sqlite.dll
```

## ✅ Test Results

All tests pass on .NET 8.0, 9.0, and 10.0:

```
✅ RuleEngine.Core.Tests: 5/5 passed
✅ RuleEngine.Integration.Tests: 2/2 passed
✅ CampaignEngine.Core.Tests: 26/26 passed
```

## 🔧 Build

```bash
# Build for all frameworks
dotnet build --configuration Release

# Build for specific framework
dotnet build --configuration Release --framework net8.0
dotnet build --configuration Release --framework net9.0
dotnet build --configuration Release --framework net10.0
```

## 📦 NuGet Pack

```bash
# Packages are automatically created
dotnet build --configuration Release

# Manual pack
dotnet pack --configuration Release
```

## 🎯 Advantages

- ✅ Single package, multiple framework support
- ✅ Backward compatibility (.NET 8.0)
- ✅ Forward compatibility (.NET 9.0 & 10.0)
- ✅ Automatic framework selection
- ✅ Same API, different runtimes

## 📝 Notes

- ✅ .NET 10.0 support added!
- All packages use the same API
- No framework-specific code
- All features work on all three frameworks

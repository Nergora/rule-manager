using System.Text.Json;
using CampaignEngine.Core.Models;
using Microsoft.EntityFrameworkCore;
using RuleEngine.Core.Models;
using RuleEngineDemo.Server.Models;

namespace RuleEngineDemo.Server.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options)
    {
    }

    public DbSet<GeneralCampaign> Campaigns { get; set; } = null!;
    public DbSet<RuleDefinition> Rules { get; set; } = null!;
    public DbSet<CampaignUsage> CampaignUsages { get; set; } = null!;
    public DbSet<RuleVersionSnapshot> RuleVersions { get; set; } = null!;

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<GeneralCampaign>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).ValueGeneratedOnAdd();
        });

        modelBuilder.Entity<RuleDefinition>(entity =>
        {
            entity.HasKey(e => e.Id);
            
            entity.Property(e => e.Tags)
                .HasConversion(
                    v => JsonSerializer.Serialize(v, (JsonSerializerOptions)null),
                    v => JsonSerializer.Deserialize<string[]>(v, (JsonSerializerOptions)null) ?? Array.Empty<string>()
                );

            entity.Property(e => e.Content)
                .HasConversion(
                    v => JsonSerializer.Serialize(v, (JsonSerializerOptions)null),
                    v => JsonSerializer.Deserialize<RuleContent>(v, (JsonSerializerOptions)null) ?? new RuleContent()
                );

            entity.Property(e => e.Parameters)
                .HasConversion(
                    v => JsonSerializer.Serialize(v, (JsonSerializerOptions)null),
                    v => JsonSerializer.Deserialize<Dictionary<string, object>>(v, (JsonSerializerOptions)null) ?? new Dictionary<string, object>()
                );
        });

        modelBuilder.Entity<RuleVersionSnapshot>(entity =>
        {
            entity.HasKey(e => e.Id);

            entity.Property(e => e.Content)
                .HasConversion(
                    v => JsonSerializer.Serialize(v, (JsonSerializerOptions)null),
                    v => JsonSerializer.Deserialize<RuleContent>(v, (JsonSerializerOptions)null) ?? new RuleContent()
                );
        });
    }
}

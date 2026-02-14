namespace MapleStoryMGuide.Models;

public class PackageItem
{
    public string Name { get; set; } = string.Empty;
    public decimal Price { get; set; }
    public string Currency { get; set; } = string.Empty;
    public List<RewardItem> Rewards { get; set; } = new();
    public decimal TotalValue { get; set; }
    public decimal ValueRatio { get; set; }
    public string Recommendation { get; set; } = string.Empty;
}

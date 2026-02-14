using MapleStoryMGuide.Models;

namespace MapleStoryMGuide.Services;

public class CalculatorService : ICalculatorService
{
    public decimal CalculateValueRatio(PackageItem package)
    {
        if (package.Price == 0) return 0;
        
        // Ensure total value is calculated if not already set
        if (package.TotalValue == 0 && package.Rewards != null)
        {
            package.TotalValue = package.Rewards.Sum(r => r.Value * r.Quantity);
        }
        
        return package.TotalValue / package.Price;
    }
    
    public decimal CalculateShopItemRatio(ShopItem item)
    {
        // Already calculated in most docs, but could add dynamic logic here
        return item.Ratio;
    }

    public decimal CalculateEventScore(EventInfo eventInfo)
    {
        if (eventInfo.TimeInvestment == 0) return 0;
        // Simple ROI calculation: Total Reward Value / Time (minutes)
        decimal totalRewardValue = eventInfo.Rewards.Sum(r => r.Value * r.Quantity);
        return totalRewardValue / eventInfo.TimeInvestment;
    }

    public List<ShopItem> GetShopRecommendations(List<ShopItem> items, string userType)
    {
        var recommendations = items.Where(i => i.Tier == "T0").ToList();

        if (userType == "挂机党")
        {
            recommendations.AddRange(items.Where(i => i.Name.Contains("自动战斗") && i.Tier != "T0"));
        }
        else if (userType == "提升党")
        {
             recommendations.AddRange(items.Where(i => (i.Name.Contains("催化剂") || i.Name.Contains("卷轴")) && i.Tier != "T0"));
        }

        return recommendations.Distinct().OrderByDescending(i => i.Ratio).ToList();
    }
}

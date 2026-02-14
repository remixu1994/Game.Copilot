using MapleStoryMGuide.Models;

namespace MapleStoryMGuide.Services;

public interface ICalculatorService
{
    decimal CalculateValueRatio(PackageItem package);
    decimal CalculateShopItemRatio(ShopItem item);
    decimal CalculateEventScore(EventInfo eventInfo);
    List<ShopItem> GetShopRecommendations(List<ShopItem> items, string userType);
}

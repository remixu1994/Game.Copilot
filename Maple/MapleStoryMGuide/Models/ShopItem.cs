namespace MapleStoryMGuide.Models;

public class ShopItem
{
    public string Name { get; set; } = string.Empty;
    public decimal Price { get; set; }
    public string Currency { get; set; } = string.Empty;
    public decimal Value { get; set; }
    public string ValueCurrency { get; set; } = string.Empty;
    public decimal Ratio { get; set; }
    public string Tier { get; set; } = string.Empty;
    public string Notes { get; set; } = string.Empty;
}

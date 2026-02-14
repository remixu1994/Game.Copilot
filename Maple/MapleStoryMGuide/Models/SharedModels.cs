namespace MapleStoryMGuide.Models;

public class RewardItem
{
    public string Name { get; set; } = string.Empty;
    public int Quantity { get; set; }
    public decimal Value { get; set; }
    public string Icon { get; set; } = string.Empty;
}

public class MaterialItem
{
    public string Name { get; set; } = string.Empty;
    public int Quantity { get; set; }
    public string Source { get; set; } = string.Empty;
}

namespace MapleStoryMGuide.Models;

public class EquipmentGuide
{
    public string Title { get; set; } = string.Empty;
    public string Category { get; set; } = string.Empty;
    public string Difficulty { get; set; } = string.Empty;
    public List<string> Requirements { get; set; } = new();
    public List<MaterialItem> Materials { get; set; } = new();
    public decimal SuccessRate { get; set; }
    public string Content { get; set; } = string.Empty;
}

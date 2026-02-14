namespace MapleStoryMGuide.Models;

public class EventInfo
{
    public string Name { get; set; } = string.Empty;
    public DateTime StartDate { get; set; }
    public DateTime EndDate { get; set; }
    public string EventType { get; set; } = string.Empty;
    public List<RewardItem> Rewards { get; set; } = new();
    public decimal TimeInvestment { get; set; }
    public decimal ValueScore { get; set; }
    public string Recommendation { get; set; } = string.Empty;
}

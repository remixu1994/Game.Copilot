namespace MapleStoryMGuide.Models;

public static class CurrencyRates
{
    // 基准汇率 (相对于红钻)
    public const decimal RedDiamond = 1.0m;
    public const decimal BlueDiamond = 0.5m;    // 1红钻 = 2蓝钻
    public const decimal MoonlightShard = 30.0m; // 1月华碎片 ≈ 30红钻
    public const decimal MapleCoin = 0.01m;     // 估算汇率
    public const decimal GoldMushroom = 1.0m;   // 1金蘑菇 = 1红钻
}

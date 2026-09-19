export type ShopItem = {
  name: string;
  eventCoins: number;
  crystalPrice?: number;
  crystalQuantity?: number;
  crystalCurrency?: 'red' | 'blue' | 'mixed';
  crystalNote?: string;
  crystalComparable?: boolean;
  privatePrice?: number;
  privateQuantity?: number;
  icon: string;
  image?: string;
};

export const EVENT_SHOP_VERSION = '2026-09-19';
export const DEFAULT_EVENT_SHOP_RATIO = { redDiamonds: 450, eventCoins: 1500 } as const;

export const eventShopItems: ShopItem[] = [
  { name: '圣物碎片自选礼盒', eventCoins: 85, icon: '圣' },
  { name: '暗淡的超越石自选礼盒', eventCoins: 1700, icon: '越' },
  { name: '暗淡的超越尝试次数消减卷轴', eventCoins: 850, icon: '卷' },
  {
    name: '神器装备图纸',
    eventCoins: 170,
    crystalPrice: 450,
    crystalQuantity: 20,
    icon: '图',
  },
  {
    name: '宝石成长秘药',
    eventCoins: 100,
    crystalPrice: 175,
    crystalQuantity: 5,
    crystalNote: '折后价；原价 194 红钻',
    icon: '药',
  },
  {
    name: '怪物乐园入场券',
    eventCoins: 50,
    crystalPrice: 33,
    privatePrice: 33,
    icon: '券',
  },
  { name: '超级属性金币抵用券（1000万）', eventCoins: 70, icon: '金' },
  { name: '金币抵用积分卡（2千万）', eventCoins: 140, icon: '金' },
  {
    name: '涅槃之火（神器）',
    eventCoins: 900,
    crystalPrice: 350,
    crystalNote: '神器级；传说级参考价 904 红钻',
    icon: '火',
  },
  { name: '超越尝试次数消减卷轴', eventCoins: 1800, icon: '卷' },
  {
    name: '超越催化剂',
    eventCoins: 900,
    crystalPrice: 483,
    crystalQuantity: 2,
    icon: '催',
  },
  {
    name: '传说装备图纸',
    eventCoins: 1650,
    crystalPrice: 391,
    crystalNote: '折后价；原价 552 红钻',
    icon: '图',
  },
  { name: '神器宝石选择礼盒', eventCoins: 1800, icon: '宝' },
  { name: '淘金系统入场券', eventCoins: 270, icon: '券' },
  {
    name: '潜能变更金币抵用积分卡（5千万）',
    eventCoins: 300,
    crystalPrice: 90,
    crystalNote: '折后价；原价 189 红钻',
    icon: '潜',
  },
  {
    name: '金币抵用积分卡（5,000万）',
    eventCoins: 400,
    crystalPrice: 140,
    crystalNote: '折后价；原价 189 红钻',
    icon: '金',
  },
  {
    name: '传说宝石自选礼盒',
    eventCoins: 5000,
    crystalPrice: 1134,
    icon: '宝',
  },
  {
    name: '顶级宝石成长秘药',
    eventCoins: 700,
    crystalPrice: 415,
    crystalQuantity: 2,
    icon: '药',
  },
  { name: '潜能变更金币抵用积分卡（1亿）', eventCoins: 450, icon: '潜' },
  {
    name: '超级属性金币抵用券（5,000万）',
    eventCoins: 150,
    crystalPrice: 140,
    crystalNote: '折后价；原价 189 红钻',
    icon: '金',
  },
  {
    name: '铭文痕迹',
    eventCoins: 7000,
    crystalPrice: 5503,
    crystalCurrency: 'blue',
    icon: '铭',
  },
  { name: '神话-混沌终极还原卷轴', eventCoins: 10000, icon: '卷' },
  {
    name: '月曜圣物超越之息',
    eventCoins: 5500,
    crystalPrice: 1200,
    crystalNote: '当前价；原价 4,000 红钻',
    icon: '月',
  },
  { name: '万能副属性加工工具', eventCoins: 8000, icon: '工' },
];

export type ShopSortMode = 'difference-efficiency' | 'original';

export type ShopItemMetrics = {
  item: ShopItem;
  originalIndex: number;
  redValue: number;
  quantity: number;
  currency: 'red' | 'blue' | 'mixed';
  crystalUnitPrice: number | null;
  privateUnitPrice: number | null;
  difference: number | null;
  differenceEfficiency: number | null;
};

export function differenceDescription(differenceEfficiency: number | null) {
  if (differenceEfficiency === null) return null;
  if (differenceEfficiency < 0) {
    return { label: '比水晶商店贵', percent: Math.abs(differenceEfficiency) * 100 };
  }
  return { label: '节省', percent: differenceEfficiency * 100 };
}

export function calculateShopItemMetrics(
  item: ShopItem,
  ratio: number,
  originalIndex = 0,
): ShopItemMetrics {
  const quantity = item.crystalQuantity ?? 1;
  const currency = item.crystalCurrency ?? 'red';
  const redValue = item.eventCoins * ratio;
  const crystalUnitPrice = item.crystalPrice === undefined ? null : item.crystalPrice / quantity;
  const privateUnitPrice =
    item.privatePrice === undefined ? null : item.privatePrice / (item.privateQuantity ?? 1);
  const comparable =
    crystalUnitPrice !== null && item.crystalComparable !== false && currency === 'red';
  const difference = comparable ? crystalUnitPrice - redValue : null;
  const differenceEfficiency = difference === null || redValue <= 0 ? null : difference / redValue;

  return {
    item,
    originalIndex,
    redValue,
    quantity,
    currency,
    crystalUnitPrice,
    privateUnitPrice,
    difference,
    differenceEfficiency,
  };
}

export function prepareShopItems(
  items: ShopItem[],
  ratio: number,
  sortMode: ShopSortMode,
): ShopItemMetrics[] {
  const metrics = items.map((item, index) => calculateShopItemMetrics(item, ratio, index));
  if (sortMode === 'original') return metrics;

  return [...metrics].sort((left, right) => {
    if (left.differenceEfficiency === null)
      return right.differenceEfficiency === null ? left.originalIndex - right.originalIndex : 1;
    if (right.differenceEfficiency === null) return -1;
    return (
      right.differenceEfficiency - left.differenceEfficiency ||
      (right.difference ?? 0) - (left.difference ?? 0) ||
      left.originalIndex - right.originalIndex
    );
  });
}

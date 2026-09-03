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

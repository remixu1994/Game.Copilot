import { describe, expect, it } from 'vitest';
import {
  calculateShopItemMetrics,
  differenceDescription,
  prepareShopItems,
  type ShopItem,
} from './currencyShop';

const items: ShopItem[] = [
  { name: '普通商品', eventCoins: 100, crystalPrice: 40, icon: '普' },
  { name: '高性价比商品', eventCoins: 100, crystalPrice: 60, icon: '高' },
  { name: '蓝钻商品', eventCoins: 100, crystalPrice: 200, crystalCurrency: 'blue', icon: '蓝' },
];

describe('currency shop ranking', () => {
  it('normalizes quantity before calculating the difference efficiency', () => {
    const metrics = calculateShopItemMetrics(
      { name: '多件商品', eventCoins: 100, crystalPrice: 100, crystalQuantity: 2, icon: '多' },
      0.25,
    );

    expect(metrics.crystalUnitPrice).toBe(50);
    expect(metrics.difference).toBe(25);
    expect(metrics.differenceEfficiency).toBe(1);
  });

  it('sorts comparable items by difference efficiency and puts incomparable items last', () => {
    const ranked = prepareShopItems(items, 0.25, 'difference-efficiency');

    expect(ranked.map(({ item }) => item.name)).toEqual(['高性价比商品', '普通商品', '蓝钻商品']);
  });

  it('can retain the source order', () => {
    const original = prepareShopItems(items, 0.25, 'original');

    expect(original.map(({ item }) => item.name)).toEqual(items.map((item) => item.name));
  });

  it('describes negative differences as more expensive instead of negative savings', () => {
    expect(differenceDescription(-0.25)).toEqual({
      label: '比水晶商店贵',
      percent: 25,
    });
    expect(differenceDescription(0.25)).toEqual({ label: '节省', percent: 25 });
  });
});

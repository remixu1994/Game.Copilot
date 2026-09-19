import { describe, expect, it } from 'vitest';
import {
  calculateShopItemMetrics,
  DEFAULT_EVENT_SHOP_RATIO,
  differenceDescription,
  eventShopItems,
  prepareShopItems,
  type ShopItem,
} from './currencyShop';

const items: ShopItem[] = [
  { name: '普通商品', eventCoins: 100, crystalPrice: 40, icon: '普' },
  { name: '高性价比商品', eventCoins: 100, crystalPrice: 60, icon: '高' },
  { name: '蓝钻商品', eventCoins: 100, crystalPrice: 200, crystalCurrency: 'blue', icon: '蓝' },
];

describe('currency shop ranking', () => {
  it('contains the current 24-item event shop and latest exchange ratio', () => {
    expect(DEFAULT_EVENT_SHOP_RATIO).toEqual({ redDiamonds: 450, eventCoins: 1500 });
    expect(eventShopItems).toHaveLength(24);
    expect(
      eventShopItems.map(({ name, eventCoins }) => [name, eventCoins]),
    ).toEqual([
      ['圣物碎片自选礼盒', 85],
      ['暗淡的超越石自选礼盒', 1700],
      ['暗淡的超越尝试次数消减卷轴', 850],
      ['神器装备图纸', 170],
      ['宝石成长秘药', 100],
      ['怪物乐园入场券', 50],
      ['超级属性金币抵用券（1000万）', 70],
      ['金币抵用积分卡（2千万）', 140],
      ['涅槃之火（神器）', 900],
      ['超越尝试次数消减卷轴', 1800],
      ['超越催化剂', 900],
      ['传说装备图纸', 1650],
      ['神器宝石选择礼盒', 1800],
      ['淘金系统入场券', 270],
      ['潜能变更金币抵用积分卡（5千万）', 300],
      ['金币抵用积分卡（5,000万）', 400],
      ['传说宝石自选礼盒', 5000],
      ['顶级宝石成长秘药', 700],
      ['潜能变更金币抵用积分卡（1亿）', 450],
      ['超级属性金币抵用券（5,000万）', 150],
      ['铭文痕迹', 7000],
      ['神话-混沌终极还原卷轴', 10000],
      ['月曜圣物超越之息', 5500],
      ['万能副属性加工工具', 8000],
    ]);
  });

  it('normalizes the artifact equipment blueprint red-diamond pack to one item', () => {
    const blueprint = eventShopItems.find(({ name }) => name === '神器装备图纸')!;
    const metrics = calculateShopItemMetrics(blueprint, 450 / 1500);

    expect(blueprint.crystalPrice).toBe(450);
    expect(blueprint.crystalQuantity).toBe(20);
    expect(metrics.crystalUnitPrice).toBe(22.5);
  });

  it('stores the supplied discounted red-diamond shop prices', () => {
    const priceByName = Object.fromEntries(
      eventShopItems.map(({ name, crystalPrice, crystalQuantity }) => [
        name,
        [crystalPrice, crystalQuantity ?? 1],
      ]),
    );

    expect(priceByName['潜能变更金币抵用积分卡（5千万）']).toEqual([90, 1]);
    expect(priceByName['金币抵用积分卡（5,000万）']).toEqual([140, 1]);
    expect(priceByName['超级属性金币抵用券（5,000万）']).toEqual([140, 1]);
    expect(priceByName['月曜圣物超越之息']).toEqual([1200, 1]);
    expect(priceByName['传说装备图纸']).toEqual([391, 1]);
    expect(priceByName['宝石成长秘药']).toEqual([175, 5]);
    expect(priceByName['涅槃之火（神器）']).toEqual([350, 1]);
  });

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

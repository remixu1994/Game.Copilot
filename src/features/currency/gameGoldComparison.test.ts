import { describe, expect, it } from 'vitest';
import {
  BEST_VALUE_CRYSTAL_PACKAGE,
  calculateCurrencyBenchmark,
  DEFAULT_CURRENCY_BENCHMARK,
} from '../../shared/currency/currencyBenchmark';
import { calculateGameGoldComparisons } from './gameGoldComparison';

describe('game gold comparison', () => {
  it('normalizes every channel to the RMB cost of 100 million game gold', () => {
    const metrics = calculateCurrencyBenchmark(
      DEFAULT_CURRENCY_BENCHMARK,
      BEST_VALUE_CRYSTAL_PACKAGE,
    );
    const comparisons = calculateGameGoldComparisons(metrics);

    expect(comparisons.map((item) => item.id)).toEqual([
      'crystal-store',
      'private-shop',
      'exchange',
    ]);

    const exchange = comparisons.find((item) => item.id === 'exchange');
    const crystalStore = comparisons.find((item) => item.id === 'crystal-store');
    const privateShop = comparisons.find((item) => item.id === 'private-shop');

    expect(exchange?.totalRmb).toBeCloseTo(3_600 * metrics.rmbPerMeso, 8);
    expect(exchange?.rmbPerHundredMillion).toBeCloseTo(
      3_600 * metrics.rmbPerMeso * (100_000_000 / 63_528_000),
      8,
    );
    expect(crystalStore?.totalRmb).toBeCloseTo(140 * metrics.rmbPerRedCrystal, 8);
    expect(crystalStore?.rmbPerHundredMillion).toBeCloseTo(140 * metrics.rmbPerRedCrystal * 2, 8);
    expect(privateShop?.totalRmb).toBeCloseTo(340 * metrics.rmbPerRedCrystal, 8);
    expect(privateShop?.rmbPerHundredMillion).toBeCloseTo(340 * metrics.rmbPerRedCrystal, 8);
  });
});

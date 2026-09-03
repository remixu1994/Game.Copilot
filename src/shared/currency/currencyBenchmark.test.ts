import { describe, expect, it } from 'vitest';
import {
  BEST_VALUE_CRYSTAL_PACKAGE,
  calculateCurrencyBenchmark,
  convertMesoToRmb,
  convertRedCrystalsToRmb,
  DEFAULT_CURRENCY_BENCHMARK,
} from './currencyBenchmark';

describe('currency benchmark', () => {
  it('calculates the RMB to meso market rate', () => {
    const metrics = calculateCurrencyBenchmark(DEFAULT_CURRENCY_BENCHMARK);

    expect(metrics.mesoTransactionFee).toBe(1_024);
    expect(metrics.netMesoAmount).toBe(11_833);
    expect(metrics.mesoPerRmb).toBeCloseTo(11_833 / 15, 8);
    expect(convertMesoToRmb(11_833, metrics)).toBeCloseTo(15, 8);
  });

  it('deducts the blue crystal value from the 185 RMB package', () => {
    const metrics = calculateCurrencyBenchmark(DEFAULT_CURRENCY_BENCHMARK);

    expect(metrics.blueCrystalMesoValue).toBe(27_750);
    expect(metrics.blueCrystalRmbValue).toBeCloseTo(27_750 * (15 / 11_833), 8);
    expect(metrics.effectiveRedCrystalCost).toBeCloseTo(
      BEST_VALUE_CRYSTAL_PACKAGE.priceRmb - metrics.blueCrystalRmbValue,
      8,
    );
    expect(convertRedCrystalsToRmb(8_550, metrics)).toBeCloseTo(metrics.effectiveRedCrystalCost, 8);
  });
});

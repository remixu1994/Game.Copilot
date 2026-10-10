import { describe, expect, it } from 'vitest';
import {
  BEST_VALUE_CRYSTAL_PACKAGE,
  calculateCurrencyBenchmark,
  convertMesoToRmb,
  convertRedCrystalsToRmb,
  DEFAULT_CURRENCY_BENCHMARK,
  migrateCurrencyBenchmark,
} from './currencyBenchmark';

describe('currency benchmark', () => {
  it('calculates the RMB to meso market rate', () => {
    const metrics = calculateCurrencyBenchmark(DEFAULT_CURRENCY_BENCHMARK);

    expect(DEFAULT_CURRENCY_BENCHMARK).toEqual({
      rmbAmount: 48,
      mesoAmount: 38_570,
      includeTransactionFee: false,
    });
    expect(metrics.mesoTransactionFee).toBe(0);
    expect(metrics.netMesoAmount).toBe(38_570);
    expect(metrics.mesoPerRmb).toBeCloseTo(38_570 / 48, 8);
    expect(convertMesoToRmb(38_570, metrics)).toBeCloseTo(48, 8);
  });

  it('deducts the blue crystal value from the 185 RMB package', () => {
    const metrics = calculateCurrencyBenchmark(DEFAULT_CURRENCY_BENCHMARK);

    expect(metrics.blueCrystalMesoValue).toBe(27_750);
    expect(metrics.blueCrystalRmbValue).toBeCloseTo(27_750 * (48 / 38_570), 8);
    expect(metrics.effectiveRedCrystalCost).toBeCloseTo(
      BEST_VALUE_CRYSTAL_PACKAGE.priceRmb - metrics.blueCrystalRmbValue,
      8,
    );
    expect(convertRedCrystalsToRmb(8_550, metrics)).toBeCloseTo(metrics.effectiveRedCrystalCost, 8);
  });

  it('migrates only the previous untouched default benchmark', () => {
    expect(
      migrateCurrencyBenchmark({
        rmbAmount: 15,
        mesoAmount: 12_857,
        includeTransactionFee: true,
      }),
    ).toEqual(DEFAULT_CURRENCY_BENCHMARK);

    expect(
      migrateCurrencyBenchmark({
        rmbAmount: 20,
        mesoAmount: 12_857,
        includeTransactionFee: true,
      }),
    ).toEqual({
      rmbAmount: 20,
      mesoAmount: 12_857,
      includeTransactionFee: true,
    });
  });
});

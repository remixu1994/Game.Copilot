import { useEffect, useState } from 'react';
import {
  BEST_VALUE_CRYSTAL_PACKAGE,
  DEFAULT_CURRENCY_BENCHMARK,
  type CrystalPackage,
  type CurrencyBenchmarkInput,
} from './currencyBenchmark';

type CurrencyPriceSystemState = {
  benchmark: CurrencyBenchmarkInput;
  crystalPackage: CrystalPackage;
};

const STORAGE_KEY = 'maple-lab.currency-price-system.v1';

const DEFAULT_STATE: CurrencyPriceSystemState = {
  benchmark: DEFAULT_CURRENCY_BENCHMARK,
  crystalPackage: BEST_VALUE_CRYSTAL_PACKAGE,
};

function readStoredState(): CurrencyPriceSystemState {
  if (typeof window === 'undefined') return DEFAULT_STATE;

  try {
    const stored = JSON.parse(
      window.localStorage.getItem(STORAGE_KEY) ?? '{}',
    ) as Partial<CurrencyPriceSystemState>;
    return {
      benchmark: { ...DEFAULT_STATE.benchmark, ...stored.benchmark },
      crystalPackage: { ...DEFAULT_STATE.crystalPackage, ...stored.crystalPackage },
    };
  } catch {
    return DEFAULT_STATE;
  }
}

export function useCurrencyPriceSystem() {
  const [state, setState] = useState<CurrencyPriceSystemState>(readStoredState);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  const setBenchmark = (benchmark: CurrencyBenchmarkInput) => {
    setState((current) => ({ ...current, benchmark }));
  };

  const setCrystalPackage = (crystalPackage: CrystalPackage) => {
    setState((current) => ({ ...current, crystalPackage }));
  };

  return {
    ...state,
    setBenchmark,
    setCrystalPackage,
  };
}

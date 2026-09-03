export type CurrencyBenchmarkInput = {
  rmbAmount: number;
  mesoAmount: number;
  includeTransactionFee: boolean;
};

export type CrystalPackage = {
  name: string;
  priceRmb: number;
  blueCrystals: number;
  redCrystals: number;
  mesoPerBlueCrystal: number;
};

export type CurrencyBenchmarkMetrics = {
  mesoTransactionFee: number;
  netMesoAmount: number;
  mesoPerRmb: number;
  rmbPerMeso: number;
  blueCrystalMesoValue: number;
  blueCrystalRmbValue: number;
  effectiveRedCrystalCost: number;
  redCrystalsPerRmb: number;
  rmbPerRedCrystal: number;
  rawRedCrystalsPerRmb: number;
};

export const DEFAULT_CURRENCY_BENCHMARK: CurrencyBenchmarkInput = {
  rmbAmount: 15,
  mesoAmount: 12_857,
  includeTransactionFee: true,
};

export function calculateMesoTransactionFee(amount: number) {
  if (amount < 2) return 0;

  let fee = 1;
  let nextTier = 20;
  while (amount >= nextTier) {
    fee *= 2;
    nextTier *= 2;
  }

  return fee;
}

export const BEST_VALUE_CRYSTAL_PACKAGE: CrystalPackage = {
  name: '185 元水晶礼包',
  priceRmb: 185,
  blueCrystals: 1_850,
  redCrystals: 8_550,
  mesoPerBlueCrystal: 15,
};

export function calculateCurrencyBenchmark(
  input: CurrencyBenchmarkInput,
  crystalPackage: CrystalPackage = BEST_VALUE_CRYSTAL_PACKAGE,
): CurrencyBenchmarkMetrics {
  const safeRmb = Math.max(0.01, input.rmbAmount);
  const safeMeso = Math.max(0.01, input.mesoAmount);
  const mesoTransactionFee = input.includeTransactionFee
    ? calculateMesoTransactionFee(safeMeso)
    : 0;
  const netMesoAmount = Math.max(0.01, safeMeso - mesoTransactionFee);
  const mesoPerRmb = netMesoAmount / safeRmb;
  const rmbPerMeso = safeRmb / netMesoAmount;
  const blueCrystalMesoValue = crystalPackage.blueCrystals * crystalPackage.mesoPerBlueCrystal;
  const blueCrystalRmbValue = blueCrystalMesoValue * rmbPerMeso;
  const effectiveRedCrystalCost = Math.max(0.01, crystalPackage.priceRmb - blueCrystalRmbValue);
  const redCrystalsPerRmb = crystalPackage.redCrystals / effectiveRedCrystalCost;

  return {
    mesoTransactionFee,
    netMesoAmount,
    mesoPerRmb,
    rmbPerMeso,
    blueCrystalMesoValue,
    blueCrystalRmbValue,
    effectiveRedCrystalCost,
    redCrystalsPerRmb,
    rmbPerRedCrystal: 1 / redCrystalsPerRmb,
    rawRedCrystalsPerRmb: crystalPackage.redCrystals / crystalPackage.priceRmb,
  };
}

export function convertMesoToRmb(meso: number, metrics: CurrencyBenchmarkMetrics) {
  return meso * metrics.rmbPerMeso;
}

export function convertRedCrystalsToRmb(redCrystals: number, metrics: CurrencyBenchmarkMetrics) {
  return redCrystals * metrics.rmbPerRedCrystal;
}

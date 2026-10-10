import type { CurrencyBenchmarkMetrics } from '../../shared/currency/currencyBenchmark';

type GameGoldPayment = {
  amount: number;
  currency: 'meso' | 'red';
};

type GameGoldChannel = {
  id: string;
  name: string;
  gameGold: number;
  payment: GameGoldPayment;
};

export type GameGoldComparison = GameGoldChannel & {
  totalRmb: number;
  rmbPerHundredMillion: number;
};

const GAME_GOLD_CHANNELS: GameGoldChannel[] = [
  {
    id: 'exchange',
    name: '兑换所',
    gameGold: 63_528_000,
    payment: { amount: 3_600, currency: 'meso' },
  },
  {
    id: 'crystal-store',
    name: '水晶商店',
    gameGold: 50_000_000,
    payment: { amount: 140, currency: 'red' },
  },
  {
    id: 'private-shop',
    name: '私人商店',
    gameGold: 100_000_000,
    payment: { amount: 340, currency: 'red' },
  },
];

export function calculateGameGoldComparisons(
  metrics: CurrencyBenchmarkMetrics,
): GameGoldComparison[] {
  return GAME_GOLD_CHANNELS.map((channel) => {
    const totalRmb =
      channel.payment.currency === 'meso'
        ? channel.payment.amount * metrics.rmbPerMeso
        : channel.payment.amount * metrics.rmbPerRedCrystal;

    return {
      ...channel,
      totalRmb,
      rmbPerHundredMillion: totalRmb * (100_000_000 / channel.gameGold),
    };
  }).sort((left, right) => left.rmbPerHundredMillion - right.rmbPerHundredMillion);
}

export type SourceFrequency = 'daily' | 'weekly';

export interface TrackerSettings {
  startDate: string;
  endDate: string;
  currentLevel: number;
  currentPercent: number;
  requiredExp: number;
  levelRequirements: Record<string, number>;
  eventExtraLevels: number;
  targetLevel: number;
}

export interface ExperienceSource {
  id: string;
  name: string;
  frequency: SourceFrequency;
  exp: number;
  enabled: boolean;
  group?: 'weekly-reward' | 'weekly-dungeon';
  rewardTier?: 1 | 2 | 3;
  optionalPurchase?: {
    currency: 'gold' | 'diamond';
    cost?: number;
    rewardTier: 1 | 2 | 3;
  };
  calculation?:
    | { kind: 'per-minute'; perUnitExp: number; units: number }
    | { kind: 'per-run'; perUnitExp: number; units: number }
    | { kind: 'per-ticket'; perUnitExp: number; units: number; bonusPercent: number };
}

export interface DailyRecord {
  date: string;
  completedSourceIds: string[];
  baselineIncludedSourceIds?: string[];
  actualPercent: number | null;
}

export interface ProgressPoint {
  level: number;
  percent: number;
}

export interface DayProjection {
  date: string;
  start: ProgressPoint;
  earnedExp: number;
  trackedExp: number;
  predictedEnd: ProgressPoint;
  end: ProgressPoint;
  calibrated: boolean;
  completedSourceIds: string[];
}

export interface WeekProjection {
  key: string;
  startDate: string;
  endDate: string;
  start: ProgressPoint;
  end: ProgressPoint;
  earnedExp: number;
  trackedExp: number;
  days: DayProjection[];
}

export interface TrackerProjection {
  days: DayProjection[];
  weeks: WeekProjection[];
  final: ProgressPoint;
  totalEarnedExp: number;
  reachedTargetDate: string | null;
  targetDeltaExp: number;
}

export const EXP_PER_YI = 100_000_000;

export const defaultSources: ExperienceSource[] = [
  { id: 'auto-6h', name: '挂机6小时', frequency: 'daily', exp: 36_000_000_000, enabled: true, calculation: { kind: 'per-minute', perUnitExp: 100_000_000, units: 360 } },
  { id: 'commission', name: '委托双倍', frequency: 'daily', exp: 32_520_367_830, enabled: true, calculation: { kind: 'per-run', perUnitExp: 10_840_122_610, units: 3 } },
  { id: 'monster-park', name: '怪物乐园', frequency: 'daily', exp: 24_954_938_331, enabled: true, calculation: { kind: 'per-ticket', perUnitExp: 12_477_469_165.5, units: 2, bonusPercent: 0 } },
  { id: 'auto-task', name: '自动战斗任务', frequency: 'daily', exp: 17_760_000_000, enabled: true },
  { id: 'daily-task', name: '每日任务', frequency: 'daily', exp: 13_500_000_000, enabled: true },
  { id: 'boss-exp', name: '领主经验', frequency: 'daily', exp: 11_489_882_130, enabled: true },
  { id: 'vanishing-journey', name: '调查消亡旅途任务', frequency: 'daily', exp: 3_780_290_359, enabled: true },
  { id: 'jewel-dungeon', name: '宝石副本', frequency: 'daily', exp: 830_574_441, enabled: true, calculation: { kind: 'per-run', perUnitExp: 276_858_147, units: 3 } },
  { id: 'tangyoon', name: '唐云的料理室', frequency: 'daily', exp: 572_999_590, enabled: true },
  { id: 'marine-king', name: '海兵王', frequency: 'daily', exp: 284_903_412, enabled: true },
  { id: 'elite-dungeon', name: '精英副本', frequency: 'daily', exp: 238_019_619, enabled: true, calculation: { kind: 'per-run', perUnitExp: 79_339_873, units: 3 } },
  { id: 'special-jewel', name: '宝石特殊副本', frequency: 'daily', exp: 230_400_000, enabled: true },
  { id: 'material-dungeon', name: '材料本', frequency: 'daily', exp: 114_218_382, enabled: true, calculation: { kind: 'per-run', perUnitExp: 38_072_794, units: 3 } },
  { id: 'pyramid', name: '金字塔', frequency: 'daily', exp: 6_182_896, enabled: true, calculation: { kind: 'per-run', perUnitExp: 3_091_448, units: 2 } },
  { id: 'arcane-river-weekly', name: '神秘河周本', frequency: 'weekly', exp: 164_031_025_461, enabled: true, group: 'weekly-dungeon' },
  { id: 'weekly-reward-1', name: '每周任务奖励 1', frequency: 'weekly', exp: 175 * EXP_PER_YI, enabled: true, group: 'weekly-reward', rewardTier: 1 },
  { id: 'weekly-reward-2', name: '每周任务奖励 2', frequency: 'weekly', exp: 210 * EXP_PER_YI, enabled: true, group: 'weekly-reward', rewardTier: 2 },
  { id: 'weekly-reward-3', name: '每周任务奖励 3', frequency: 'weekly', exp: 672 * EXP_PER_YI, enabled: true, group: 'weekly-reward', rewardTier: 3 },
  { id: 'weekly-reward-1-extra', name: '额外购买 · 奖励 1', frequency: 'weekly', exp: 175 * EXP_PER_YI, enabled: true, group: 'weekly-reward', rewardTier: 1, optionalPurchase: { currency: 'gold', rewardTier: 1 } },
  { id: 'weekly-reward-2-extra', name: '额外购买 · 奖励 2', frequency: 'weekly', exp: 210 * EXP_PER_YI, enabled: true, group: 'weekly-reward', rewardTier: 2, optionalPurchase: { currency: 'diamond', cost: 200, rewardTier: 2 } },
  { id: 'weekly-reward-3-extra', name: '额外购买 · 奖励 3', frequency: 'weekly', exp: 672 * EXP_PER_YI, enabled: true, group: 'weekly-reward', rewardTier: 3, optionalPurchase: { currency: 'gold', rewardTier: 3 } },
  { id: 'gold-rush', name: '淘金系统', frequency: 'weekly', exp: 32_576_120, enabled: true, group: 'weekly-dungeon' },
];

export const defaultSettings: TrackerSettings = {
  startDate: '2026-08-25',
  endDate: '2026-09-15',
  currentLevel: 203,
  currentPercent: 0.53,
  requiredExp: 420_000_000_000,
  levelRequirements: {
    200: 3_718_527_554_105,
    203: 420_000_000_000,
  },
  eventExtraLevels: 2,
  targetLevel: 206,
};

const parseDate = (date: string) => new Date(`${date}T00:00:00Z`);
export const toDateKey = (date: Date) => date.toISOString().slice(0, 10);

export function dateRange(startDate: string, endDate: string): string[] {
  const dates: string[] = [];
  const current = parseDate(startDate);
  const end = parseDate(endDate);
  while (current <= end) {
    dates.push(toDateKey(current));
    current.setUTCDate(current.getUTCDate() + 1);
  }
  return dates;
}

export function weekKey(date: string): string {
  const value = parseDate(date);
  const day = value.getUTCDay() || 7;
  value.setUTCDate(value.getUTCDate() - day + 1);
  return toDateKey(value);
}

export function requiredExperienceForLevel(settings: TrackerSettings, level: number): number {
  return settings.levelRequirements?.[String(level)] ?? settings.requiredExp;
}

export function addExperience(point: ProgressPoint, exp: number, settings: TrackerSettings): ProgressPoint {
  let level = point.level;
  let requiredExp = requiredExperienceForLevel(settings, level);
  if (requiredExp <= 0) return point;
  let accumulatedExp = requiredExp * (point.percent / 100) + Math.max(0, exp);
  while (accumulatedExp >= requiredExp) {
    accumulatedExp -= requiredExp;
    level += settings.eventExtraLevels + 1;
    requiredExp = requiredExperienceForLevel(settings, level);
    if (requiredExp <= 0) return { level, percent: 0 };
  }
  return { level, percent: accumulatedExp / requiredExp * 100 };
}

export function sourceExperience(source: ExperienceSource): number {
  if (!source.calculation) return source.exp;
  const base = source.calculation.perUnitExp * source.calculation.units;
  return source.calculation.kind === 'per-ticket'
    ? base * (1 + source.calculation.bonusPercent / 100)
    : base;
}

export function createDefaultRecords(settings: TrackerSettings, sources: ExperienceSource[]): DailyRecord[] {
  const dailyIds = sources.filter((source) => source.frequency === 'daily').map((source) => source.id);
  const weeklyIds = sources.filter((source) => source.frequency === 'weekly').map((source) => source.id);
  const finalWeekWeeklyIds = sources.filter((source) => source.frequency === 'weekly' && !(source.group === 'weekly-reward' && (source.rewardTier ?? source.optionalPurchase?.rewardTier ?? 0) > 1)).map((source) => source.id);
  const baselineWeeklyIds = sources.filter((source) => source.frequency === 'weekly' && !source.optionalPurchase).map((source) => source.id);
  const dates = dateRange(settings.startDate, settings.endDate);
  const firstWeek = weekKey(settings.startDate);
  const finalWeek = weekKey(settings.endDate);
  const lastDateByWeek = new Map<string, string>();
  dates.forEach((date) => lastDateByWeek.set(weekKey(date), date));
  return dates.map((date) => {
    const key = weekKey(date);
    const scheduledWeeklyIds = key === finalWeek ? finalWeekWeeklyIds : weeklyIds;
    return {
      date,
      completedSourceIds: date === settings.startDate
        ? [...dailyIds, ...weeklyIds]
        : [...dailyIds, ...(key !== firstWeek && lastDateByWeek.get(key) === date ? scheduledWeeklyIds : [])],
      baselineIncludedSourceIds: date === settings.startDate ? [...dailyIds, ...baselineWeeklyIds] : undefined,
      actualPercent: date === settings.startDate ? settings.currentPercent : null,
    };
  });
}

export function projectTracker(settings: TrackerSettings, sources: ExperienceSource[], records: DailyRecord[]): TrackerProjection {
  const enabled = new Map(sources.filter((source) => source.enabled).map((source) => [source.id, source]));
  const recordsByDate = new Map(records.map((record) => [record.date, record]));
  const days: DayProjection[] = [];
  let point: ProgressPoint = { level: settings.currentLevel, percent: settings.currentPercent };
  let reachedTargetDate: string | null = point.level >= settings.targetLevel ? settings.startDate : null;

  for (const date of dateRange(settings.startDate, settings.endDate)) {
    const record = recordsByDate.get(date) ?? { date, completedSourceIds: [], actualPercent: null };
    const start = { ...point };
    const trackedExp = record.completedSourceIds.reduce((sum, id) => {
      const source = enabled.get(id);
      return sum + (source ? sourceExperience(source) : 0);
    }, 0);
    const baselineIncluded = new Set(record.baselineIncludedSourceIds ?? (date === settings.startDate ? record.completedSourceIds : []));
    const earnedExp = date === settings.startDate
      ? record.completedSourceIds.reduce((sum, id) => {
        const source = enabled.get(id);
        return sum + (!baselineIncluded.has(id) && source ? sourceExperience(source) : 0);
      }, 0)
      : trackedExp;
    const predictedEnd = addExperience(start, earnedExp, settings);
    const calibrated = record.actualPercent !== null && date !== settings.startDate;
    point = calibrated
      ? { level: predictedEnd.level, percent: Math.max(0, Math.min(100, record.actualPercent ?? predictedEnd.percent)) }
      : predictedEnd;
    if (!reachedTargetDate && point.level >= settings.targetLevel) reachedTargetDate = date;
    days.push({ date, start, earnedExp, trackedExp, predictedEnd, end: { ...point }, calibrated, completedSourceIds: record.completedSourceIds });
  }

  const grouped = new Map<string, DayProjection[]>();
  days.forEach((day) => grouped.set(weekKey(day.date), [...(grouped.get(weekKey(day.date)) ?? []), day]));
  const weeks = [...grouped.entries()].map(([key, weekDays]) => ({
    key,
    startDate: weekDays[0].date,
    endDate: weekDays[weekDays.length - 1].date,
    start: weekDays[0].start,
    end: weekDays[weekDays.length - 1].end,
    earnedExp: weekDays.reduce((sum, day) => sum + day.earnedExp, 0),
    trackedExp: weekDays.reduce((sum, day) => sum + day.trackedExp, 0),
    days: weekDays,
  }));
  const final = days.at(-1)?.end ?? point;
  let targetDeltaExp: number;
  if (final.level >= settings.targetLevel) {
    targetDeltaExp = requiredExperienceForLevel(settings, final.level) * final.percent / 100;
  } else {
    let level = final.level;
    let percent = final.percent;
    let missingExp = 0;
    while (level < settings.targetLevel) {
      missingExp += requiredExperienceForLevel(settings, level) * (1 - percent / 100);
      level += settings.eventExtraLevels + 1;
      percent = 0;
    }
    targetDeltaExp = -missingExp;
  }
  return {
    days,
    weeks,
    final,
    totalEarnedExp: days.reduce((sum, day) => sum + day.earnedExp, 0),
    reachedTargetDate,
    targetDeltaExp,
  };
}

export function sourceTotals(sources: ExperienceSource[]) {
  const active = sources.filter((source) => source.enabled);
  return {
    daily: active.filter((source) => source.frequency === 'daily').reduce((sum, source) => sum + sourceExperience(source), 0),
    weekly: active.filter((source) => source.frequency === 'weekly').reduce((sum, source) => sum + sourceExperience(source), 0),
  };
}

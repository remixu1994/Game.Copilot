export type SourceFrequency = 'daily' | 'weekly';

export interface TrackerSettings {
  startDate: string;
  baselineTiming: 'start-of-day' | 'end-of-day';
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
  sourceExpOverrides?: Record<string, number>;
  sourceUnitOverrides?: Record<string, number>;
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
  claimedWeeklySourceIds: string[];
  completedWeeklySourceIds: string[];
  weeklyEarnedExp: number;
  weeklyTrackedExp: number;
}

export interface WeekProjection {
  key: string;
  startDate: string;
  endDate: string;
  start: ProgressPoint;
  dailyEnd: ProgressPoint;
  end: ProgressPoint;
  dailyEarnedExp: number;
  weeklyEarnedExp: number;
  weeklyTrackedExp: number;
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
  {
    id: 'auto-6h',
    name: '挂机6小时',
    frequency: 'daily',
    exp: 36_000_000_000,
    enabled: true,
    calculation: { kind: 'per-minute', perUnitExp: 100_000_000, units: 360 },
  },
  {
    id: 'commission',
    name: '委托双倍',
    frequency: 'daily',
    exp: 32_520_367_830,
    enabled: true,
    calculation: { kind: 'per-run', perUnitExp: 10_840_122_610, units: 3 },
  },
  {
    id: 'monster-park',
    name: '怪物乐园',
    frequency: 'daily',
    exp: 24_954_938_331,
    enabled: true,
    calculation: { kind: 'per-ticket', perUnitExp: 12_477_469_165.5, units: 2, bonusPercent: 0 },
  },
  { id: 'auto-task', name: '自动战斗任务', frequency: 'daily', exp: 17_760_000_000, enabled: true },
  { id: 'daily-task', name: '每日任务', frequency: 'daily', exp: 13_500_000_000, enabled: true },
  { id: 'boss-exp', name: '领主经验', frequency: 'daily', exp: 11_489_882_130, enabled: true },
  {
    id: 'vanishing-journey',
    name: '调查消亡旅途任务',
    frequency: 'daily',
    exp: 3_780_290_359,
    enabled: true,
  },
  {
    id: 'jewel-dungeon',
    name: '宝石副本',
    frequency: 'daily',
    exp: 830_574_441,
    enabled: true,
    calculation: { kind: 'per-run', perUnitExp: 276_858_147, units: 3 },
  },
  { id: 'tangyoon', name: '唐云的料理室', frequency: 'daily', exp: 572_999_590, enabled: true },
  { id: 'marine-king', name: '海兵王', frequency: 'daily', exp: 284_903_412, enabled: true },
  {
    id: 'elite-dungeon',
    name: '精英副本',
    frequency: 'daily',
    exp: 238_019_619,
    enabled: true,
    calculation: { kind: 'per-run', perUnitExp: 79_339_873, units: 3 },
  },
  {
    id: 'special-jewel',
    name: '宝石特殊副本',
    frequency: 'daily',
    exp: 230_400_000,
    enabled: true,
  },
  {
    id: 'material-dungeon',
    name: '材料本',
    frequency: 'daily',
    exp: 114_218_382,
    enabled: true,
    calculation: { kind: 'per-run', perUnitExp: 38_072_794, units: 3 },
  },
  {
    id: 'pyramid',
    name: '金字塔',
    frequency: 'daily',
    exp: 6_182_896,
    enabled: true,
    calculation: { kind: 'per-run', perUnitExp: 3_091_448, units: 2 },
  },
  {
    id: 'arcane-river-weekly',
    name: '神秘河周本',
    frequency: 'weekly',
    exp: 164_031_025_461,
    enabled: true,
    group: 'weekly-dungeon',
  },
  {
    id: 'weekly-reward-1',
    name: '每周任务奖励 1',
    frequency: 'weekly',
    exp: 175 * EXP_PER_YI,
    enabled: true,
    group: 'weekly-reward',
    rewardTier: 1,
  },
  {
    id: 'weekly-reward-2',
    name: '每周任务奖励 2',
    frequency: 'weekly',
    exp: 210 * EXP_PER_YI,
    enabled: true,
    group: 'weekly-reward',
    rewardTier: 2,
  },
  {
    id: 'weekly-reward-3',
    name: '每周任务奖励 3',
    frequency: 'weekly',
    exp: 672 * EXP_PER_YI,
    enabled: true,
    group: 'weekly-reward',
    rewardTier: 3,
  },
  {
    id: 'weekly-reward-1-extra',
    name: '额外购买 · 奖励 1',
    frequency: 'weekly',
    exp: 175 * EXP_PER_YI,
    enabled: true,
    group: 'weekly-reward',
    rewardTier: 1,
    optionalPurchase: { currency: 'gold', rewardTier: 1 },
  },
  {
    id: 'weekly-reward-2-extra',
    name: '额外购买 · 奖励 2',
    frequency: 'weekly',
    exp: 210 * EXP_PER_YI,
    enabled: true,
    group: 'weekly-reward',
    rewardTier: 2,
    optionalPurchase: { currency: 'diamond', cost: 200, rewardTier: 2 },
  },
  {
    id: 'weekly-reward-3-extra',
    name: '额外购买 · 奖励 3',
    frequency: 'weekly',
    exp: 672 * EXP_PER_YI,
    enabled: true,
    group: 'weekly-reward',
    rewardTier: 3,
    optionalPurchase: { currency: 'gold', rewardTier: 3 },
  },
  {
    id: 'gold-rush',
    name: '淘金系统',
    frequency: 'weekly',
    exp: 32_576_120,
    enabled: true,
    group: 'weekly-dungeon',
  },
];

export const defaultSettings: TrackerSettings = {
  startDate: '2026-08-25',
  baselineTiming: 'end-of-day',
  endDate: '2026-09-15',
  currentLevel: 203,
  currentPercent: 0.53,
  requiredExp: 4_302_778_389_349,
  levelRequirements: {
    200: 3_718_527_554_105,
    203: 4_000_000_000_000,
    206: 4_302_778_389_349,
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

export function baselineDateForToday(
  today: string,
  campaignStart: string,
  campaignEnd: string,
): string {
  if (today < campaignStart) return campaignStart;
  if (today > campaignEnd) return campaignEnd;
  return today;
}

export function weekKey(date: string): string {
  const value = parseDate(date);
  const day = value.getUTCDay() || 7;
  value.setUTCDate(value.getUTCDate() - day + 1);
  return toDateKey(value);
}

export function resolveWeeklyScheduleDate(
  settings: TrackerSettings,
  sources: ExperienceSource[],
  records: DailyRecord[],
  targetWeek: string,
  preferredDate: string,
): string {
  const weeklyIds = new Set(
    sources
      .filter((source) => source.enabled && source.frequency === 'weekly')
      .map((source) => source.id),
  );
  const weekRecords = records.filter((record) => weekKey(record.date) === targetWeek);
  if (targetWeek === weekKey(settings.startDate)) return settings.startDate;
  const existingWeeklyRecord = weekRecords.find((record) =>
    record.completedSourceIds.some((id) => weeklyIds.has(id)),
  );

  if (existingWeeklyRecord) return existingWeeklyRecord.date;
  return (
    weekRecords.find((record) => record.date === preferredDate)?.date ??
    weekRecords.at(-1)?.date ??
    preferredDate
  );
}

export function requiredExperienceForLevel(settings: TrackerSettings, level: number): number {
  const exact = settings.levelRequirements?.[String(level)];
  if (exact) return exact;
  const nearestLevel = Object.keys(settings.levelRequirements ?? {})
    .map(Number)
    .filter((configuredLevel) => configuredLevel <= level)
    .sort((a, b) => b - a)[0];
  return nearestLevel === undefined
    ? settings.requiredExp
    : settings.levelRequirements[String(nearestLevel)];
}

export function extrapolateLevel206Requirement(
  level200Required: number,
  level203Required: number,
): number {
  if (level200Required <= 0 || level203Required <= 0) return 1;
  return Math.round(level203Required * (level203Required / level200Required));
}

export function addExperience(
  point: ProgressPoint,
  exp: number,
  settings: TrackerSettings,
): ProgressPoint {
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
  return { level, percent: (accumulatedExp / requiredExp) * 100 };
}

export function sourceExperience(source: ExperienceSource): number {
  if (!source.calculation) return source.exp;
  const base = source.calculation.perUnitExp * source.calculation.units;
  return source.calculation.kind === 'per-ticket'
    ? base * (1 + source.calculation.bonusPercent / 100)
    : base;
}

export function createDefaultRecords(
  settings: TrackerSettings,
  sources: ExperienceSource[],
): DailyRecord[] {
  const dailyIds = sources
    .filter((source) => source.frequency === 'daily')
    .map((source) => source.id);
  const weeklyIds = sources
    .filter((source) => source.frequency === 'weekly')
    .map((source) => source.id);
  const firstWeekBaselineWeeklyIds = sources
    .filter(
      (source) =>
        source.frequency === 'weekly' &&
        (source.group === 'weekly-dungeon' ||
          (source.rewardTier ?? source.optionalPurchase?.rewardTier) === 1),
    )
    .map((source) => source.id);
  const firstWeekSelectedWeeklyIds = sources
    .filter(
      (source) =>
        source.frequency === 'weekly' &&
        (source.group === 'weekly-dungeon' ||
          source.rewardTier === 1 ||
          (source.rewardTier === 2 && !source.optionalPurchase) ||
          source.optionalPurchase?.rewardTier === 1),
    )
    .map((source) => source.id);
  const finalWeekWeeklyIds = sources
    .filter(
      (source) =>
        source.frequency === 'weekly' &&
        !(
          source.group === 'weekly-reward' &&
          (source.rewardTier ?? source.optionalPurchase?.rewardTier ?? 0) > 1
        ),
    )
    .map((source) => source.id);
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
      completedSourceIds:
        date === settings.startDate
          ? [...dailyIds, ...firstWeekBaselineWeeklyIds]
          : [
              ...dailyIds,
              ...(lastDateByWeek.get(key) === date
                ? key === firstWeek
                  ? firstWeekSelectedWeeklyIds.filter(
                      (id) => !firstWeekBaselineWeeklyIds.includes(id),
                    )
                  : scheduledWeeklyIds
                : []),
            ],
      baselineIncludedSourceIds:
        date === settings.startDate
          ? settings.baselineTiming === 'end-of-day'
            ? [...dailyIds, ...firstWeekBaselineWeeklyIds]
            : []
          : undefined,
      actualPercent: date === settings.startDate ? settings.currentPercent : null,
    };
  });
}

export function projectTracker(
  settings: TrackerSettings,
  sources: ExperienceSource[],
  records: DailyRecord[],
): TrackerProjection {
  const enabled = new Map(
    sources.filter((source) => source.enabled).map((source) => [source.id, source]),
  );
  const recordsByDate = new Map(records.map((record) => [record.date, record]));
  const dates = dateRange(settings.startDate, settings.endDate);
  const lastDateByWeek = new Map<string, string>();
  dates.forEach((date) => lastDateByWeek.set(weekKey(date), date));
  const days: DayProjection[] = [];
  const weeklyBaselineIds = new Map<string, Set<string>>();
  records.forEach((record) => {
    const key = weekKey(record.date);
    const baseline = weeklyBaselineIds.get(key) ?? new Set<string>();
    for (const id of record.baselineIncludedSourceIds ?? []) baseline.add(id);
    weeklyBaselineIds.set(key, baseline);
  });
  const completedWeeklyIds = new Map<string, Set<string>>();
  let point: ProgressPoint = { level: settings.currentLevel, percent: settings.currentPercent };
  let reachedTargetDate: string | null =
    point.level >= settings.targetLevel ? settings.startDate : null;

  for (const date of dates) {
    const record = recordsByDate.get(date) ?? { date, completedSourceIds: [], actualPercent: null };
    const start = { ...point };
    const recordSourceExperience = (source: ExperienceSource) => {
      const unitOverride = record.sourceUnitOverrides?.[source.id];
      if (unitOverride !== undefined && source.calculation) {
        return sourceExperience({
          ...source,
          calculation: { ...source.calculation, units: Math.max(0, unitOverride) },
        });
      }
      return record.sourceExpOverrides?.[source.id] ?? sourceExperience(source);
    };
    const trackedExp = record.completedSourceIds.reduce((sum, id) => {
      const source = enabled.get(id);
      if (source?.frequency !== 'daily') return sum;
      return sum + Math.max(0, recordSourceExperience(source));
    }, 0);
    const baselineIncluded = new Set(
      record.baselineIncludedSourceIds ??
        (date === settings.startDate && settings.baselineTiming === 'end-of-day'
          ? record.completedSourceIds
          : []),
    );
    const earnedExp =
      date === settings.startDate
        ? record.completedSourceIds.reduce((sum, id) => {
            const source = enabled.get(id);
            if (source?.frequency !== 'daily') return sum;
            return (
              sum + (!baselineIncluded.has(id) ? Math.max(0, recordSourceExperience(source)) : 0)
            );
          }, 0)
        : trackedExp;
    const key = weekKey(date);
    const completedInWeek = completedWeeklyIds.get(key) ?? new Set<string>();
    const claimedWeeklySourceIds = [...new Set(record.completedSourceIds)].filter(
      (id) => enabled.get(id)?.frequency === 'weekly' && !completedInWeek.has(id),
    );
    const weeklyTrackedExp = claimedWeeklySourceIds.reduce(
      (sum, id) => sum + sourceExperience(enabled.get(id)!),
      0,
    );
    const baselineIncludedIds = weeklyBaselineIds.get(key) ?? new Set<string>();
    const weeklyEarnedExp = claimedWeeklySourceIds.reduce(
      (sum, id) => sum + (baselineIncludedIds.has(id) ? 0 : sourceExperience(enabled.get(id)!)),
      0,
    );
    claimedWeeklySourceIds.forEach((id) => completedInWeek.add(id));
    completedWeeklyIds.set(key, completedInWeek);
    const predictedEnd = addExperience(start, earnedExp + weeklyEarnedExp, settings);
    const calibrated = record.actualPercent !== null && date !== settings.startDate;
    point = calibrated
      ? {
          level: predictedEnd.level,
          percent: Math.max(0, Math.min(100, record.actualPercent ?? predictedEnd.percent)),
        }
      : predictedEnd;
    if (!reachedTargetDate && point.level >= settings.targetLevel) reachedTargetDate = date;
    days.push({
      date,
      start,
      earnedExp,
      trackedExp,
      predictedEnd,
      end: { ...point },
      calibrated,
      completedSourceIds: record.completedSourceIds,
      claimedWeeklySourceIds,
      completedWeeklySourceIds: [...completedInWeek],
      weeklyEarnedExp,
      weeklyTrackedExp,
    });
  }

  const grouped = new Map<string, DayProjection[]>();
  days.forEach((day) =>
    grouped.set(weekKey(day.date), [...(grouped.get(weekKey(day.date)) ?? []), day]),
  );
  const weeks = [...grouped.entries()].map(([key, weekDays]) => {
    const dailyEarnedExp = weekDays.reduce((sum, day) => sum + day.earnedExp, 0);
    const dailyTrackedExp = weekDays.reduce((sum, day) => sum + day.trackedExp, 0);
    const weeklyEarnedExp = weekDays.reduce((sum, day) => sum + day.weeklyEarnedExp, 0);
    const weeklyTrackedExp = weekDays.reduce((sum, day) => sum + day.weeklyTrackedExp, 0);
    return {
      key,
      startDate: weekDays[0].date,
      endDate: weekDays[weekDays.length - 1].date,
      start: weekDays[0].start,
      dailyEnd: weekDays[weekDays.length - 1].end,
      end: weekDays[weekDays.length - 1].end,
      dailyEarnedExp,
      weeklyEarnedExp,
      weeklyTrackedExp,
      earnedExp: dailyEarnedExp + weeklyEarnedExp,
      trackedExp: dailyTrackedExp + weeklyTrackedExp,
      days: weekDays,
    };
  });
  const final = days.at(-1)?.end ?? point;
  let targetDeltaExp: number;
  if (final.level >= settings.targetLevel) {
    targetDeltaExp = (requiredExperienceForLevel(settings, final.level) * final.percent) / 100;
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
    totalEarnedExp: weeks.reduce((sum, week) => sum + week.earnedExp, 0),
    reachedTargetDate,
    targetDeltaExp,
  };
}

export function sourceTotals(sources: ExperienceSource[]) {
  const active = sources.filter((source) => source.enabled);
  return {
    daily: active
      .filter((source) => source.frequency === 'daily')
      .reduce((sum, source) => sum + sourceExperience(source), 0),
    weekly: active
      .filter((source) => source.frequency === 'weekly')
      .reduce((sum, source) => sum + sourceExperience(source), 0),
  };
}

import { describe, expect, it } from 'vitest';
import {
  addExperience,
  baselineDateForToday,
  createDefaultRecords,
  defaultSettings,
  defaultSources,
  EXP_PER_YI,
  extrapolateLevel206Requirement,
  projectTracker,
  requiredExperienceForLevel,
  resolveWeeklyScheduleDate,
  sourceExperience,
  sourceTotals,
  weekKey,
  type ExperienceSource,
} from './levelTrackerCalculator';

describe('level tracker calculator', () => {
  it('matches the supplied daily and weekly totals', () => {
    const totals = sourceTotals(defaultSources);
    expect(totals.daily / EXP_PER_YI).toBeCloseTo(1422.8277699, 6);
    expect(totals.weekly / EXP_PER_YI).toBeCloseTo(3754.636, 3);
  });

  it('derives挂机 and monster park experience from their input parameters', () => {
    const idle = defaultSources.find((source) => source.id === 'auto-6h')!;
    const monsterPark = defaultSources.find((source) => source.id === 'monster-park')!;
    expect(sourceExperience(idle) / EXP_PER_YI).toBeCloseTo(360, 3);
    expect(sourceExperience(monsterPark)).toBeCloseTo(24_954_938_331, 2);
    const boosted = {
      ...monsterPark,
      calculation: {
        kind: 'per-ticket' as const,
        perUnitExp: 12_477_469_165.5,
        units: 2,
        bonusPercent: 20,
      },
    };
    expect(sourceExperience(boosted)).toBeCloseTo(29_945_925_997.2, 2);
  });

  it('derives a daily dungeon total from exact per-run experience and editable runs', () => {
    const commission = defaultSources.find((source) => source.id === 'commission')!;
    expect(sourceExperience(commission)).toBe(32_520_367_830);
    const twice = {
      ...commission,
      calculation: { kind: 'per-run' as const, perUnitExp: 10_840_122_610, units: 2 },
    };
    expect(sourceExperience(twice)).toBe(21_680_245_220);
  });

  it('does not count any completed baseline-day task again', () => {
    const records = createDefaultRecords(defaultSettings, defaultSources);
    const projection = projectTracker(defaultSettings, defaultSources, records);
    expect(projection.days[0].earnedExp).toBe(0);
    expect(projection.days[0].end).toEqual({ level: 203, percent: 0.53 });
  });

  it('starts a later baseline without projecting any earlier dates', () => {
    const settings = { ...defaultSettings, startDate: '2026-08-26' };
    const projection = projectTracker(
      settings,
      defaultSources,
      createDefaultRecords(settings, defaultSources),
    );
    expect(projection.days[0].date).toBe('2026-08-26');
    expect(projection.days.some((day) => day.date === '2026-08-25')).toBe(false);
    expect(projection.weeks[0].startDate).toBe('2026-08-26');
  });

  it('uses today as the fresh baseline while keeping it inside the campaign range', () => {
    expect(baselineDateForToday('2026-08-26', '2026-08-25', '2026-09-15')).toBe('2026-08-26');
    expect(baselineDateForToday('2026-08-01', '2026-08-25', '2026-09-15')).toBe('2026-08-25');
    expect(baselineDateForToday('2026-10-01', '2026-08-25', '2026-09-15')).toBe('2026-09-15');
  });

  it('counts baseline-day tasks only when the baseline is at the start of day', () => {
    const endOfDay = {
      ...defaultSettings,
      startDate: '2026-08-26',
      baselineTiming: 'end-of-day' as const,
    };
    const startOfDay = { ...endOfDay, baselineTiming: 'start-of-day' as const };
    const endProjection = projectTracker(
      endOfDay,
      defaultSources,
      createDefaultRecords(endOfDay, defaultSources),
    );
    const startProjection = projectTracker(
      startOfDay,
      defaultSources,
      createDefaultRecords(startOfDay, defaultSources),
    );
    expect(endProjection.days[0].earnedExp).toBe(0);
    expect(startProjection.days[0].earnedExp).toBeGreaterThan(endProjection.days[0].earnedExp);
    expect(startProjection.totalEarnedExp).toBeGreaterThan(endProjection.totalEarnedExp);
    expect(
      startProjection.final.level > endProjection.final.level ||
        (startProjection.final.level === endProjection.final.level &&
          startProjection.final.percent > endProjection.final.percent),
    ).toBe(true);
  });

  it('keeps overflow and grants two event levels on a natural level-up', () => {
    const level203Required = defaultSettings.levelRequirements['203'];
    const level206Required = defaultSettings.levelRequirements['206'];
    const result = addExperience(
      { level: 203, percent: 99 },
      0.02 * level203Required,
      defaultSettings,
    );
    expect(result.level).toBe(206);
    expect(result.percent).toBeCloseTo(((level203Required * 0.01) / level206Required) * 100, 6);
  });

  it('switches from the level 200 requirement to the level 203 requirement after upgrading', () => {
    const level200Required = defaultSettings.levelRequirements['200'];
    const level203Required = defaultSettings.levelRequirements['203'];
    const result = addExperience(
      { level: 200, percent: 99 },
      level200Required * 0.01 + level203Required * 0.1,
      defaultSettings,
    );
    expect(result.level).toBe(203);
    expect(result.percent).toBeCloseTo(10, 6);
  });

  it('uses 4 trillion for level 203 and extrapolates level 206 by the same growth rate', () => {
    expect(defaultSettings.levelRequirements['203']).toBe(4_000_000_000_000);
    expect(defaultSettings.levelRequirements['206']).toBe(
      extrapolateLevel206Requirement(
        defaultSettings.levelRequirements['200'],
        defaultSettings.levelRequirements['203'],
      ),
    );
    expect(defaultSettings.levelRequirements['206']).toBe(4_302_778_389_349);
    expect(requiredExperienceForLevel(defaultSettings, 209)).toBe(
      defaultSettings.levelRequirements['206'],
    );
  });

  it('recalculates after a source is edited or disabled', () => {
    const records = createDefaultRecords(defaultSettings, defaultSources);
    const baseline = projectTracker(defaultSettings, defaultSources, records);
    const edited = defaultSources.map((source) =>
      source.id === 'auto-6h' ? { ...source, enabled: false } : source,
    );
    const recalculated = projectTracker(defaultSettings, edited, records);
    expect(recalculated.totalEarnedExp).toBeLessThan(baseline.totalEarnedExp);
    expect(
      recalculated.final.level < baseline.final.level ||
        (recalculated.final.level === baseline.final.level &&
          recalculated.final.percent < baseline.final.percent),
    ).toBe(true);
  });

  it('uses an actual daily percentage as the next day baseline', () => {
    const records = createDefaultRecords(defaultSettings, defaultSources).map((record) =>
      record.date === '2026-08-26' ? { ...record, actualPercent: 10 } : record,
    );
    const projection = projectTracker(defaultSettings, defaultSources, records);
    const august27 = projection.days.find((day) => day.date === '2026-08-27');
    expect(august27?.start.percent).toBe(10);
    expect(projection.days.find((day) => day.date === '2026-08-26')?.calibrated).toBe(true);
  });

  it('uses a per-day idle experience override without changing other days', () => {
    const idle = defaultSources.find((source) => source.id === 'auto-6h')!;
    const records = createDefaultRecords(defaultSettings, defaultSources);
    const baseline = projectTracker(defaultSettings, defaultSources, records);
    const customizedRecords = records.map((record) =>
      record.date === '2026-08-26'
        ? { ...record, sourceExpOverrides: { 'auto-6h': 100 * EXP_PER_YI } }
        : record,
    );
    const customized = projectTracker(defaultSettings, defaultSources, customizedRecords);
    const august26 = customized.days.find((day) => day.date === '2026-08-26')!;
    const august27 = customized.days.find((day) => day.date === '2026-08-27')!;

    expect(august26.earnedExp).toBeCloseTo(
      baseline.days.find((day) => day.date === '2026-08-26')!.earnedExp -
        sourceExperience(idle) +
        100 * EXP_PER_YI,
      2,
    );
    expect(august27.earnedExp).toBe(
      baseline.days.find((day) => day.date === '2026-08-27')!.earnedExp,
    );
    expect(customized.totalEarnedExp).toBeCloseTo(baseline.totalEarnedExp - 260 * EXP_PER_YI, 2);
  });

  it('calculates a per-day monster park total from the overridden run count', () => {
    const monsterPark = defaultSources.find((source) => source.id === 'monster-park')!;
    const threeRuns = sourceExperience({
      ...monsterPark,
      calculation: { ...monsterPark.calculation!, units: 3 } as ExperienceSource['calculation'],
    });
    const records = createDefaultRecords(defaultSettings, defaultSources);
    const baseline = projectTracker(defaultSettings, defaultSources, records);
    const customizedRecords = records.map((record) =>
      record.date === '2026-08-26'
        ? { ...record, sourceUnitOverrides: { 'monster-park': 3 } }
        : record,
    );
    const customized = projectTracker(defaultSettings, defaultSources, customizedRecords);

    expect(customized.days.find((day) => day.date === '2026-08-26')!.earnedExp).toBeCloseTo(
      baseline.days.find((day) => day.date === '2026-08-26')!.earnedExp -
        sourceExperience(monsterPark) +
        threeRuns,
      2,
    );
    expect(customized.days.find((day) => day.date === '2026-08-27')!.earnedExp).toBe(
      baseline.days.find((day) => day.date === '2026-08-27')!.earnedExp,
    );
  });

  it('counts a weekly task only on the selected day', () => {
    const records = createDefaultRecords(defaultSettings, defaultSources);
    const weeklyId = 'arcane-river-weekly';
    const firstWeekRecords = records.filter((record) => record.date <= '2026-08-30');
    const weeklyRecord = firstWeekRecords.find((record) =>
      record.completedSourceIds.includes(weeklyId),
    );
    expect(weeklyRecord?.date).toBe(defaultSettings.startDate);
  });

  it('checks every optional weekly purchase once per week by default', () => {
    const records = createDefaultRecords(defaultSettings, defaultSources);
    const purchaseIds = defaultSources
      .filter((source) => source.optionalPurchase)
      .map((source) => source.id);
    expect(purchaseIds).toHaveLength(3);
    expect(
      records.filter((record) => record.completedSourceIds.includes('weekly-reward-1-extra')),
    ).toHaveLength(4);
    expect(
      records.filter((record) => record.completedSourceIds.includes('weekly-reward-2-extra')),
    ).toHaveLength(2);
    expect(
      records.filter((record) => record.completedSourceIds.includes('weekly-reward-3-extra')),
    ).toHaveLength(2);
    expect(
      defaultSources
        .filter((source) => !source.optionalPurchase && source.id.startsWith('weekly-reward'))
        .reduce((sum, source) => sum + sourceExperience(source), 0) / EXP_PER_YI,
    ).toBe(1057);
  });

  it('treats first-week reward two as newly earned rather than baseline experience', () => {
    const records = createDefaultRecords(defaultSettings, defaultSources);
    const baselineRecord = records.find((record) => record.date === defaultSettings.startDate)!;
    const claimRecord = records.find((record) =>
      record.completedSourceIds.includes('weekly-reward-2'),
    )!;
    const projection = projectTracker(defaultSettings, defaultSources, records);

    expect(baselineRecord.completedSourceIds).not.toContain('weekly-reward-2');
    expect(baselineRecord.baselineIncludedSourceIds).not.toContain('weekly-reward-2');
    expect(claimRecord.date).toBe('2026-08-30');
    expect(projection.weeks[0].weeklyEarnedExp / EXP_PER_YI).toBe(210);
    expect(
      projection.days.find((day) => day.date === '2026-08-26')!.earnedExp / EXP_PER_YI,
    ).toBeCloseTo(sourceTotals(defaultSources).daily / EXP_PER_YI, 6);
  });

  it('can exclude completed weekly dungeons from the baseline without changing daily experience', () => {
    const weeklyDungeonIds = new Set(
      defaultSources
        .filter((source) => source.group === 'weekly-dungeon')
        .map((source) => source.id),
    );
    const weeklyDungeonExp = defaultSources
      .filter((source) => weeklyDungeonIds.has(source.id))
      .reduce((sum, source) => sum + sourceExperience(source), 0);
    const records = createDefaultRecords(defaultSettings, defaultSources);
    const excludedRecords = records.map((record) =>
      record.date === defaultSettings.startDate
        ? {
            ...record,
            baselineIncludedSourceIds: record.baselineIncludedSourceIds?.filter(
              (id) => !weeklyDungeonIds.has(id),
            ),
          }
        : record,
    );
    const included = projectTracker(defaultSettings, defaultSources, records);
    const excluded = projectTracker(defaultSettings, defaultSources, excludedRecords);

    expect(excluded.days.find((day) => day.date === '2026-08-26')!.earnedExp).toBe(
      included.days.find((day) => day.date === '2026-08-26')!.earnedExp,
    );
    expect(excluded.weeks[0].weeklyEarnedExp - included.weeks[0].weeklyEarnedExp).toBeCloseTo(
      weeklyDungeonExp,
      2,
    );
    expect(excluded.weeks[1].start).toEqual(excluded.weeks[0].end);
  });

  it('can configure each weekly dungeon baseline status independently', () => {
    const weeklyDungeons = defaultSources.filter((source) => source.group === 'weekly-dungeon');
    const [excludedDungeon, includedDungeon] = weeklyDungeons;
    const records = createDefaultRecords(defaultSettings, defaultSources);
    const updatedRecords = records.map((record) =>
      record.date === defaultSettings.startDate
        ? {
            ...record,
            baselineIncludedSourceIds: record.baselineIncludedSourceIds?.filter(
              (id) => id !== excludedDungeon.id,
            ),
          }
        : record,
    );
    const baseline = projectTracker(defaultSettings, defaultSources, records);
    const updated = projectTracker(defaultSettings, defaultSources, updatedRecords);
    const baselineRecord = updatedRecords.find(
      (record) => record.date === defaultSettings.startDate,
    )!;

    expect(baselineRecord.baselineIncludedSourceIds).not.toContain(excludedDungeon.id);
    expect(baselineRecord.baselineIncludedSourceIds).toContain(includedDungeon.id);
    expect(updated.days.find((day) => day.date === '2026-08-26')!.earnedExp).toBe(
      baseline.days.find((day) => day.date === '2026-08-26')!.earnedExp,
    );
    expect(updated.weeks[0].weeklyEarnedExp - baseline.weeks[0].weeklyEarnedExp).toBeCloseTo(
      sourceExperience(excludedDungeon),
      2,
    );
  });

  it('defaults the partial final week to reward tier one only', () => {
    const records = createDefaultRecords(defaultSettings, defaultSources);
    const finalWeekIds = records
      .filter((record) => record.date >= '2026-09-14')
      .flatMap((record) => record.completedSourceIds);
    expect(finalWeekIds).toContain('weekly-reward-1');
    expect(finalWeekIds).toContain('weekly-reward-1-extra');
    expect(finalWeekIds).not.toContain('weekly-reward-2');
    expect(finalWeekIds).not.toContain('weekly-reward-2-extra');
    expect(finalWeekIds).not.toContain('weekly-reward-3');
    expect(finalWeekIds).not.toContain('weekly-reward-3-extra');
  });

  it('adds a selected weekly purchase exactly once', () => {
    const records = createDefaultRecords(defaultSettings, defaultSources);
    const purchase = defaultSources.find((source) => source.id === 'weekly-reward-2-extra')!;
    const targetDate = '2026-09-06';
    const withoutPurchase = records.map((record) =>
      record.date === targetDate
        ? {
            ...record,
            completedSourceIds: record.completedSourceIds.filter((id) => id !== purchase.id),
          }
        : record,
    );
    const baseline = projectTracker(defaultSettings, defaultSources, withoutPurchase);
    const updated = projectTracker(defaultSettings, defaultSources, records);

    expect(updated.totalEarnedExp - baseline.totalEarnedExp).toBeCloseTo(210 * EXP_PER_YI, 2);
  });

  it('adds a new purchase selected on the baseline day to the week-end forecast', () => {
    const records = createDefaultRecords(defaultSettings, defaultSources);
    const purchase = defaultSources.find((source) => source.id === 'weekly-reward-2-extra')!;
    const withoutPurchase = records.map((record) =>
      record.date === defaultSettings.startDate
        ? {
            ...record,
            completedSourceIds: record.completedSourceIds.filter((id) => id !== purchase.id),
            baselineIncludedSourceIds: record.baselineIncludedSourceIds?.filter(
              (id) => id !== purchase.id,
            ),
          }
        : record,
    );
    const withNewPurchase = withoutPurchase.map((record) =>
      record.date === defaultSettings.startDate
        ? { ...record, completedSourceIds: [...record.completedSourceIds, purchase.id] }
        : record,
    );
    const baseline = projectTracker(defaultSettings, defaultSources, withoutPurchase);
    const updated = projectTracker(defaultSettings, defaultSources, withNewPurchase);

    expect(updated.weeks[0].earnedExp - baseline.weeks[0].earnedExp).toBeCloseTo(
      sourceExperience(purchase),
      2,
    );
    expect(updated.weeks[0].end.percent - baseline.weeks[0].end.percent).toBeCloseTo(
      (sourceExperience(purchase) / defaultSettings.levelRequirements['203']) * 100,
      6,
    );
  });

  it('keeps a rechecked first-week task inside the end-of-day baseline', () => {
    const weeklyTask = defaultSources.find((source) => source.id === 'weekly-reward-1')!;
    const records = createDefaultRecords(defaultSettings, defaultSources).map((record) => ({
      ...record,
      completedSourceIds: record.completedSourceIds.filter((id) => id !== weeklyTask.id),
    }));
    const scheduleDate = resolveWeeklyScheduleDate(
      defaultSettings,
      defaultSources,
      records,
      weekKey(defaultSettings.startDate),
      defaultSettings.startDate,
    );
    const recheckedRecords = records.map((record) =>
      record.date === scheduleDate
        ? { ...record, completedSourceIds: [...record.completedSourceIds, weeklyTask.id] }
        : record,
    );
    const baseline = projectTracker(defaultSettings, defaultSources, records);
    const updated = projectTracker(defaultSettings, defaultSources, recheckedRecords);
    expect(scheduleDate).toBe(defaultSettings.startDate);
    expect(updated.days.find((day) => day.date === '2026-08-26')!.end).toEqual(
      baseline.days.find((day) => day.date === '2026-08-26')!.end,
    );
    expect(updated.final).toEqual(baseline.final);
  });

  it('settles a newly claimed weekly reward outside every daily experience row', () => {
    const weeklyReward = defaultSources.find((source) => source.id === 'weekly-reward-3')!;
    const records = createDefaultRecords(defaultSettings, defaultSources).map((record) =>
      weekKey(record.date) === weekKey(defaultSettings.startDate)
        ? {
            ...record,
            completedSourceIds: record.completedSourceIds.filter((id) => id !== weeklyReward.id),
            baselineIncludedSourceIds: record.baselineIncludedSourceIds?.filter(
              (id) => id !== weeklyReward.id,
            ),
          }
        : record,
    );
    const claimedRecords = records.map((record) =>
      record.date === defaultSettings.startDate
        ? { ...record, completedSourceIds: [...record.completedSourceIds, weeklyReward.id] }
        : record,
    );
    const beforeClaim = projectTracker(defaultSettings, defaultSources, records);
    const afterClaim = projectTracker(defaultSettings, defaultSources, claimedRecords);

    expect(afterClaim.days.find((day) => day.date === '2026-08-26')!.earnedExp).toBe(
      beforeClaim.days.find((day) => day.date === '2026-08-26')!.earnedExp,
    );
    expect(afterClaim.weeks[0].weeklyEarnedExp - beforeClaim.weeks[0].weeklyEarnedExp).toBeCloseTo(
      sourceExperience(weeklyReward),
      2,
    );
    expect(afterClaim.weeks[1].start).toEqual(afterClaim.weeks[0].end);
  });

  it('does not add a weekly reward again after its claim day is calibrated', () => {
    const weeklyReward = defaultSources.find((source) => source.id === 'weekly-reward-3')!;
    const claimDate = '2026-08-28';
    const actualPercent = 17.82;
    const baseRecords = createDefaultRecords(defaultSettings, defaultSources).map((record) => ({
      ...record,
      completedSourceIds: record.completedSourceIds.filter((id) => id !== weeklyReward.id),
      actualPercent: record.date === claimDate ? actualPercent : record.actualPercent,
    }));
    const claimedRecords = baseRecords.map((record) =>
      record.date === claimDate
        ? { ...record, completedSourceIds: [...record.completedSourceIds, weeklyReward.id] }
        : record,
    );
    const withoutClaim = projectTracker(defaultSettings, defaultSources, baseRecords);
    const withClaim = projectTracker(defaultSettings, defaultSources, claimedRecords);
    const claimDay = withClaim.days.find((day) => day.date === claimDate)!;
    const nextDay = withClaim.days.find((day) => day.date === '2026-08-29')!;

    expect(claimDay.weeklyEarnedExp).toBeCloseTo(sourceExperience(weeklyReward), 2);
    expect(claimDay.end.percent).toBe(actualPercent);
    expect(nextDay.completedWeeklySourceIds).toContain(weeklyReward.id);
    expect(withClaim.final).toEqual(withoutClaim.final);
  });

  it('does not subtract a historical first-week task from the current baseline', () => {
    const records = createDefaultRecords(defaultSettings, defaultSources);
    const baseline = projectTracker(defaultSettings, defaultSources, records);
    const weeklyTask = defaultSources.find((source) => source.id === 'weekly-reward-1')!;
    const withoutWeeklyTask = records.map((record) =>
      weekKey(record.date) === weekKey(defaultSettings.startDate)
        ? {
            ...record,
            completedSourceIds: record.completedSourceIds.filter((id) => id !== weeklyTask.id),
          }
        : record,
    );
    const updated = projectTracker(defaultSettings, defaultSources, withoutWeeklyTask);

    expect(baseline.weeks[0].trackedExp - updated.weeks[0].trackedExp).toBeCloseTo(
      sourceExperience(weeklyTask),
      2,
    );
    expect(updated.days.find((day) => day.date === '2026-08-26')!.end).toEqual(
      baseline.days.find((day) => day.date === '2026-08-26')!.end,
    );
    expect(updated.final).toEqual(baseline.final);
  });
});

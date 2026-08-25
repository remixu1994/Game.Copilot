import { describe, expect, it } from 'vitest';
import { addExperience, createDefaultRecords, defaultSettings, defaultSources, EXP_PER_YI, projectTracker, sourceExperience, sourceTotals } from './levelTrackerCalculator';

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
    const boosted = { ...monsterPark, calculation: { kind: 'per-ticket' as const, perUnitExp: 12_477_469_165.5, units: 2, bonusPercent: 20 } };
    expect(sourceExperience(boosted)).toBeCloseTo(29_945_925_997.2, 2);
  });

  it('derives a daily dungeon total from exact per-run experience and editable runs', () => {
    const commission = defaultSources.find((source) => source.id === 'commission')!;
    expect(sourceExperience(commission)).toBe(32_520_367_830);
    const twice = { ...commission, calculation: { kind: 'per-run' as const, perUnitExp: 10_840_122_610, units: 2 } };
    expect(sourceExperience(twice)).toBe(21_680_245_220);
  });

  it('does not count the already completed first-week base tasks again', () => {
    const records = createDefaultRecords(defaultSettings, defaultSources);
    const projection = projectTracker(defaultSettings, defaultSources, records);
    expect(projection.final.level).toBe(230);
    expect(projection.final.percent).toBeCloseTo(63.2988, 3);
    expect(projection.reachedTargetDate).toBeTruthy();
  });

  it('keeps overflow and grants two event levels on a natural level-up', () => {
    const result = addExperience({ level: 203, percent: 99 }, 0.02 * defaultSettings.requiredExp, defaultSettings);
    expect(result.level).toBe(206);
    expect(result.percent).toBeCloseTo(1, 6);
  });

  it('switches from the level 200 requirement to the level 203 requirement after upgrading', () => {
    const level200Required = defaultSettings.levelRequirements['200'];
    const level203Required = defaultSettings.levelRequirements['203'];
    const result = addExperience({ level: 200, percent: 99 }, level200Required * 0.01 + level203Required * 0.1, defaultSettings);
    expect(result.level).toBe(203);
    expect(result.percent).toBeCloseTo(10, 6);
  });

  it('recalculates after a source is edited or disabled', () => {
    const records = createDefaultRecords(defaultSettings, defaultSources);
    const baseline = projectTracker(defaultSettings, defaultSources, records);
    const edited = defaultSources.map((source) => source.id === 'auto-6h' ? { ...source, enabled: false } : source);
    const recalculated = projectTracker(defaultSettings, edited, records);
    expect(recalculated.totalEarnedExp).toBeLessThan(baseline.totalEarnedExp);
    expect(recalculated.final.level).toBeLessThan(baseline.final.level);
  });

  it('uses an actual daily percentage as the next day baseline', () => {
    const records = createDefaultRecords(defaultSettings, defaultSources).map((record) => record.date === '2026-08-26' ? { ...record, actualPercent: 10 } : record);
    const projection = projectTracker(defaultSettings, defaultSources, records);
    const august27 = projection.days.find((day) => day.date === '2026-08-27');
    expect(august27?.start.percent).toBe(10);
    expect(projection.days.find((day) => day.date === '2026-08-26')?.calibrated).toBe(true);
  });

  it('counts a weekly task only on the selected day', () => {
    const records = createDefaultRecords(defaultSettings, defaultSources);
    const weeklyId = 'arcane-river-weekly';
    const firstWeekRecords = records.filter((record) => record.date <= '2026-08-30');
    const weeklyRecord = firstWeekRecords.find((record) => record.completedSourceIds.includes(weeklyId));
    expect(weeklyRecord?.date).toBe(defaultSettings.startDate);
  });

  it('checks every optional weekly purchase once per week by default', () => {
    const records = createDefaultRecords(defaultSettings, defaultSources);
    const purchaseIds = defaultSources.filter((source) => source.optionalPurchase).map((source) => source.id);
    expect(purchaseIds).toHaveLength(3);
    expect(records.filter((record) => record.completedSourceIds.includes('weekly-reward-1-extra'))).toHaveLength(4);
    expect(records.filter((record) => record.completedSourceIds.includes('weekly-reward-2-extra'))).toHaveLength(3);
    expect(records.filter((record) => record.completedSourceIds.includes('weekly-reward-3-extra'))).toHaveLength(3);
    expect(defaultSources.filter((source) => !source.optionalPurchase && source.id.startsWith('weekly-reward')).reduce((sum, source) => sum + sourceExperience(source), 0) / EXP_PER_YI).toBe(1057);
  });

  it('defaults the partial final week to reward tier one only', () => {
    const records = createDefaultRecords(defaultSettings, defaultSources);
    const finalWeekIds = records.filter((record) => record.date >= '2026-09-14').flatMap((record) => record.completedSourceIds);
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
    const withoutPurchase = records.map((record) => record.date === targetDate
      ? { ...record, completedSourceIds: record.completedSourceIds.filter((id) => id !== purchase.id) }
      : record);
    const baseline = projectTracker(defaultSettings, defaultSources, withoutPurchase);
    const updated = projectTracker(defaultSettings, defaultSources, records);

    expect(updated.totalEarnedExp - baseline.totalEarnedExp).toBeCloseTo(210 * EXP_PER_YI, 2);
  });

  it('adds a new purchase selected on the baseline day to the week-end forecast', () => {
    const records = createDefaultRecords(defaultSettings, defaultSources);
    const purchase = defaultSources.find((source) => source.id === 'weekly-reward-2-extra')!;
    const withoutPurchase = records.map((record) => record.date === defaultSettings.startDate
      ? { ...record, completedSourceIds: record.completedSourceIds.filter((id) => id !== purchase.id) }
      : record);
    const baseline = projectTracker(defaultSettings, defaultSources, withoutPurchase);
    const updated = projectTracker(defaultSettings, defaultSources, records);

    expect(updated.weeks[0].earnedExp - baseline.weeks[0].earnedExp).toBeCloseTo(sourceExperience(purchase), 2);
    expect(updated.weeks[0].end.percent - baseline.weeks[0].end.percent).toBeCloseTo(sourceExperience(purchase) / defaultSettings.requiredExp * 100, 6);
  });

  it('updates first-week tracked experience without double-counting the baseline', () => {
    const records = createDefaultRecords(defaultSettings, defaultSources);
    const baseline = projectTracker(defaultSettings, defaultSources, records);
    const weeklyTask = defaultSources.find((source) => source.id === 'weekly-reward-2')!;
    const withoutWeeklyTask = records.map((record) => record.date === defaultSettings.startDate
      ? { ...record, completedSourceIds: record.completedSourceIds.filter((id) => id !== weeklyTask.id) }
      : record);
    const updated = projectTracker(defaultSettings, defaultSources, withoutWeeklyTask);

    expect(baseline.weeks[0].trackedExp - updated.weeks[0].trackedExp).toBeCloseTo(sourceExperience(weeklyTask), 2);
    expect(updated.final).toEqual(baseline.final);
  });
});

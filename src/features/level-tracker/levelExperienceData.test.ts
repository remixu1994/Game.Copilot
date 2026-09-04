import { describe, expect, it } from 'vitest';
import {
  hydrateLevelRequirements,
  LEVEL_EXPERIENCE_VERSION,
  levelExperienceTable,
  referenceLevelRequirements,
} from './levelExperienceData';
import {
  addExperience,
  defaultSettings,
  requiredExperienceForLevel,
} from './levelTrackerCalculator';

describe('level experience reference data', () => {
  it('contains all 52 consecutive supplied levels with integer raw experience', () => {
    expect(levelExperienceTable).toHaveLength(52);
    levelExperienceTable.forEach((row, index) => {
      expect(row.level).toBe(199 + index);
      expect(row.nextLevel).toBe(row.level + 1);
      expect(Number.isSafeInteger(row.experience)).toBe(true);
      expect(row.experience).toBeGreaterThan(0);
    });
    expect(referenceLevelRequirements['199']).toBe(1_193_551_000_000);
    expect(referenceLevelRequirements['200']).toBe(3_718_841_000_000);
    expect(referenceLevelRequirements['220']).toBe(7_399_689_000_000);
    expect(referenceLevelRequirements['240']).toBe(18_550_466_000_000);
    expect(referenceLevelRequirements['250']).toBe(34_865_972_000_000);
    expect(referenceLevelRequirements['251']).toBeUndefined();
    expect(referenceLevelRequirements['259']).toBeUndefined();
  });

  it('looks up every imported level, even with a partially configured table', () => {
    const settings = { ...defaultSettings, levelRequirements: {} };
    for (const row of levelExperienceTable) {
      expect(requiredExperienceForLevel(settings, row.level)).toBe(row.experience);
    }
  });

  it('migrates legacy defaults to reference values and fills all missing levels', () => {
    const requirements = hydrateLevelRequirements({
      200: 3_718_527_554_105,
      203: 4_000_000_000_000,
      206: 4_302_778_389_349,
    });
    expect(requirements).toEqual(referenceLevelRequirements);
    expect(hydrateLevelRequirements()).toEqual(referenceLevelRequirements);
  });

  it('replaces older 203 defaults and their inferred 206 values', () => {
    for (const previous203 of [420_000_000_000, 4_200_000_000_000]) {
      const requirements = hydrateLevelRequirements({
        203: previous203,
        206: Math.round(previous203 * (previous203 / 3_718_527_554_105)),
      });
      expect(requirements['203']).toBe(referenceLevelRequirements['203']);
      expect(requirements['206']).toBe(referenceLevelRequirements['206']);
    }
  });

  it('preserves custom experience and does not repeatedly migrate edited values', () => {
    const custom = { 203: 3_987_654_321_000, 206: 4_400_000_000_000, 251: 40_000_000_000_000 };
    expect(hydrateLevelRequirements(custom)).toMatchObject(custom);
    const deliberatelyReverted = { 203: 4_000_000_000_000 };
    expect(hydrateLevelRequirements(deliberatelyReverted, LEVEL_EXPERIENCE_VERSION)).toMatchObject(
      deliberatelyReverted,
    );
    const migrated = hydrateLevelRequirements(custom);
    expect(hydrateLevelRequirements(migrated, LEVEL_EXPERIENCE_VERSION)).toEqual(migrated);
  });

  it('ignores invalid stored values instead of poisoning the reference data', () => {
    expect(hydrateLevelRequirements({ 200: NaN, 203: 0, 206: -5, 209: Infinity })).toEqual(
      referenceLevelRequirements,
    );
  });

  it('retains overflow through multiple event upgrades using each distinct requirement', () => {
    const exp =
      referenceLevelRequirements['200'] +
      referenceLevelRequirements['203'] +
      referenceLevelRequirements['206'] +
      referenceLevelRequirements['209'] * 0.25;
    expect(addExperience({ level: 200, percent: 0 }, exp, defaultSettings)).toEqual({
      level: 209,
      percent: 25,
    });
  });

  it('uses intermediate level requirements without the extra-level event', () => {
    const exp = referenceLevelRequirements['201'] + referenceLevelRequirements['202'] * 0.5;
    expect(
      addExperience({ level: 201, percent: 0 }, exp, { ...defaultSettings, eventExtraLevels: 0 }),
    ).toEqual({ level: 202, percent: 50 });
  });
});

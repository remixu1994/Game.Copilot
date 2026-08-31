import { describe, expect, it } from 'vitest';
import { calculateSkillDps, combineIgnoreDefense, type CombatBonuses, type PanelStats, type SkillStats } from './dpsCalculator';

const panel: PanelStats = {
  propertyAttack: 1_334_088,
  mainStat: 73_789,
  subStat: 47_937,
  baseAttack: 11_511,
  damagePercent: 47.8,
  bossDamagePercent: 68.5,
  criticalDamagePercent: 210,
  finalDamagePercent: 36.6,
  maxDamage: 124_167_624,
  ignoreDefensePercent: 81.81,
  superIgnoreDefensePercent: 36,
  bossDefensePercent: 155,
  overflowConversionPercent: 5,
};

const bonuses: CombatBonuses = {
  attackPercent: 58,
  damagePercent: 69,
  bossDamagePercent: 59,
  criticalDamagePercent: 93.6,
  finalDamagePercent: 21.5,
};

const quadStar: SkillStats = {
  name: '四连标',
  multiplierPercent: 185,
  hitCount: 3_706,
  attackPercent: 0,
  damagePercent: 100,
  bossDamagePercent: 0,
  criticalDamagePercent: 0,
  finalDamagePercent: 0,
  ignoreDefensePercent: 0,
  specialMultiplier: 1,
};

describe('DPS calculator', () => {
  it('reproduces the quad-star verification result from the reference panel', () => {
    const result = calculateSkillDps(panel, bonuses, quadStar, 120);

    expect(result.nakedAttack).toBeCloseTo(789_868.7046, 4);
    expect(result.attributeCoefficient).toBeCloseTo(68.6186, 6);
    expect(result.effectiveMainStat).toBeCloseTo(85_773.25, 6);
    expect(result.inferredAttackPercent).toBeCloseTo(68.89997, 5);
    expect(result.attackEquivalentMainStat).toBeCloseTo(7.4514, 4);
    expect(result.attackEquivalentSubStat).toBeCloseTo(29.8057, 4);
    expect(result.attackMultiplier).toBeCloseTo(2.269, 6);
    expect(result.damageMultiplier).toBeCloseTo(3.168, 6);
    expect(result.bossMultiplier).toBeCloseTo(2.275, 6);
    expect(result.criticalMultiplier).toBeCloseTo(3.186, 6);
    expect(result.finalDamageMultiplier).toBeCloseTo(1.581, 6);
    expect(result.combinedMultiplier).toBeCloseTo(82.37181824, 6);
    expect(result.defenseMultiplier).toBeCloseTo(0.718055, 6);
    expect(result.damagePerHit).toBeCloseTo(86_429_698.61, 1);
  });

  it('combines skill ignore defense multiplicatively', () => {
    expect(combineIgnoreDefense(80, 20)).toBeCloseTo(84, 8);
  });

  it('converts only the portion above the damage cap', () => {
    const result = calculateSkillDps(
      { ...panel, maxDamage: 100_000_000, bossDefensePercent: 0 },
      bonuses,
      quadStar,
      120,
    );

    expect(result.overflowDamage).toBeCloseTo((result.beforeDefenseDamage - 100_000_000) * 0.05, 4);
    expect(result.damagePerHit).toBeCloseTo(100_000_000 + result.overflowDamage, 4);
  });
});

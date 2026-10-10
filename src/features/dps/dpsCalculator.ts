export type PanelStats = {
  propertyAttack: number;
  mainStat: number;
  subStat: number;
  baseAttack: number;
  damagePercent: number;
  bossDamagePercent: number;
  criticalDamagePercent: number;
  finalDamagePercent: number;
  maxDamage: number;
  ignoreDefensePercent: number;
  superIgnoreDefensePercent: number;
  bossDefensePercent: number;
  overflowConversionPercent: number;
};

export type CombatBonuses = {
  attackPercent: number;
  damagePercent: number;
  bossDamagePercent: number;
  criticalDamagePercent: number;
  finalDamagePercent: number;
};

export type SkillStats = {
  name: string;
  multiplierPercent: number;
  hitCount: number;
  attackPercent: number;
  damagePercent: number;
  bossDamagePercent: number;
  criticalDamagePercent: number;
  finalDamagePercent: number;
  ignoreDefensePercent: number;
  specialMultiplier: number;
};

export type DpsCalculation = {
  attributeCoefficient: number;
  effectiveMainStat: number;
  nakedAttack: number;
  inferredAttackPercent: number;
  attackEquivalentMainStat: number;
  attackEquivalentSubStat: number;
  baseAttackGainPerPointPercent: number;
  mainStatGainPerPointPercent: number;
  subStatGainPerPointPercent: number;
  attackMultiplier: number;
  damageMultiplier: number;
  bossMultiplier: number;
  criticalMultiplier: number;
  finalDamageMultiplier: number;
  specialMultiplier: number;
  combinedMultiplier: number;
  beforeDefenseDamage: number;
  cappedDamage: number;
  overflowDamage: number;
  effectiveIgnoreDefensePercent: number;
  defenseMultiplier: number;
  damagePerHit: number;
  totalDamage: number;
  dps: number;
};

const ratio = (percent: number) => Math.max(0, percent) / 100;

export function analyzePanel(panel: PanelStats) {
  const attributeCoefficient = panel.mainStat / 1250 + panel.subStat / 5000;
  const effectiveMainStat = panel.mainStat + panel.subStat / 4;
  const nakedAttack = attributeCoefficient * panel.baseAttack;
  const inferredAttackPercent =
    nakedAttack > 0 ? Math.max(0, (panel.propertyAttack / nakedAttack - 1) * 100) : 0;
  const mainStatGainPerPointPercent =
    attributeCoefficient > 0 ? (1 / 1250 / attributeCoefficient) * 100 : 0;
  const subStatGainPerPointPercent =
    attributeCoefficient > 0 ? (1 / 5000 / attributeCoefficient) * 100 : 0;
  const baseAttackGainPerPointPercent = panel.baseAttack > 0 ? (1 / panel.baseAttack) * 100 : 0;
  const attackEquivalentMainStat =
    mainStatGainPerPointPercent > 0
      ? baseAttackGainPerPointPercent / mainStatGainPerPointPercent
      : 0;
  const attackEquivalentSubStat =
    subStatGainPerPointPercent > 0 ? baseAttackGainPerPointPercent / subStatGainPerPointPercent : 0;

  return {
    attributeCoefficient,
    effectiveMainStat,
    nakedAttack,
    inferredAttackPercent,
    attackEquivalentMainStat,
    attackEquivalentSubStat,
    baseAttackGainPerPointPercent,
    mainStatGainPerPointPercent,
    subStatGainPerPointPercent,
  };
}

export function combineIgnoreDefense(...percentages: number[]) {
  const remainingDefense = percentages.reduce(
    (remaining, percentage) => remaining * (1 - Math.min(1, ratio(percentage))),
    1,
  );
  return (1 - remainingDefense) * 100;
}

export function calculateSkillDps(
  panel: PanelStats,
  bonuses: CombatBonuses,
  skill: SkillStats,
  durationSeconds: number,
): DpsCalculation {
  const panelAnalysis = analyzePanel(panel);
  const { nakedAttack, inferredAttackPercent } = panelAnalysis;
  const attackMultiplier =
    1 + ratio(bonuses.attackPercent + inferredAttackPercent + skill.attackPercent);
  const damageMultiplier =
    1 + ratio(panel.damagePercent + bonuses.damagePercent + skill.damagePercent);
  const bossMultiplier =
    1 + ratio(panel.bossDamagePercent + bonuses.bossDamagePercent + skill.bossDamagePercent);
  const criticalMultiplier =
    (Math.max(
      100,
      panel.criticalDamagePercent + bonuses.criticalDamagePercent + skill.criticalDamagePercent,
    ) +
      15) /
    100;
  const finalDamageMultiplier =
    1 + ratio(panel.finalDamagePercent + bonuses.finalDamagePercent + skill.finalDamagePercent);
  const specialMultiplier = Math.max(1, skill.specialMultiplier);
  const combinedMultiplier =
    attackMultiplier *
    damageMultiplier *
    bossMultiplier *
    criticalMultiplier *
    finalDamageMultiplier *
    specialMultiplier;

  const beforeDefenseDamage = nakedAttack * ratio(skill.multiplierPercent) * combinedMultiplier;
  const maxDamage = panel.maxDamage > 0 ? panel.maxDamage : Number.POSITIVE_INFINITY;
  const cappedDamage = Math.min(beforeDefenseDamage, maxDamage);
  const overflowDamage =
    Math.max(0, beforeDefenseDamage - maxDamage) * ratio(panel.overflowConversionPercent);
  const effectiveIgnoreDefensePercent = combineIgnoreDefense(
    panel.ignoreDefensePercent,
    skill.ignoreDefensePercent,
  );
  const defenseMultiplier = Math.max(
    0,
    1 - ratio(panel.bossDefensePercent) * (1 - ratio(effectiveIgnoreDefensePercent)),
  );
  const damagePerHit = (cappedDamage + overflowDamage) * defenseMultiplier;
  const totalDamage = damagePerHit * Math.max(0, skill.hitCount);
  const dps = durationSeconds > 0 ? totalDamage / durationSeconds : 0;

  return {
    ...panelAnalysis,
    nakedAttack,
    inferredAttackPercent,
    attackMultiplier,
    damageMultiplier,
    bossMultiplier,
    criticalMultiplier,
    finalDamageMultiplier,
    specialMultiplier,
    combinedMultiplier,
    beforeDefenseDamage,
    cappedDamage,
    overflowDamage,
    effectiveIgnoreDefensePercent,
    defenseMultiplier,
    damagePerHit,
    totalDamage,
    dps,
  };
}

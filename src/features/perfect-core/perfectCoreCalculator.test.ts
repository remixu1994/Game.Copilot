import { describe, expect, it } from 'vitest';
import {
  calculatePerfectCores,
  getCombinationKey,
  getCoreKey,
  recommendNextCores,
} from './perfectCoreCalculator';
import {
  adeleSeedSkills,
  bishopSeedSkills,
  iceLightningSeedSkills,
  imageFourCoreSixProfessionIds,
  shadowerSeedSkills,
  nightLordSeedSkills,
  professionCategories,
  referenceSeedProfessionIds,
  seedSkills,
  seedProfessions,
} from './perfectCoreSeed';
import { referenceLayoutByProfessionId } from './perfectCoreRecommendations';
import { assertPerfectCoreAdmin, perfectCoreAdminEnabled } from './perfectCoreAdmin';

const skills = ['a', 'b', 'c', 'd', 'e', 'f'];

describe('perfect core calculator', () => {
  it('normalizes sub-skill order but preserves the main skill', () => {
    expect(getCoreKey({ mainSkillId: 'a', subSkillIds: ['c', 'b'] })).toBe('a|b|c');
    expect(getCoreKey({ mainSkillId: 'b', subSkillIds: ['a', 'c'] })).not.toBe('a|b|c');
  });

  it('normalizes core order for a combination', () => {
    const first = { mainSkillId: 'a', subSkillIds: ['b', 'c'] as ['b', 'c'] };
    const second = { mainSkillId: 'd', subSkillIds: ['e', 'f'] as ['e', 'f'] };
    expect(getCombinationKey([first, second])).toBe(getCombinationKey([second, first]));
  });

  it('generates valid 4 core 6 skill layouts', () => {
    const output = calculatePerfectCores({
      mode: '4CORE_6',
      selectedSkillIds: skills,
    });
    expect(output.error).toBeUndefined();
    expect(output.results.length).toBeGreaterThan(0);
    for (const result of output.results) {
      expect(result.cores).toHaveLength(4);
      expect(new Set(result.cores.map((core) => core.mainSkillId)).size).toBe(4);
      expect(Object.values(result.skillCounts)).toEqual([2, 2, 2, 2, 2, 2]);
      expect(Object.values(result.skillLevels)).toEqual([50, 50, 50, 50, 50, 50]);
    }
  });

  it('generates 3 core 4.5 layouts with one half skill', () => {
    const output = calculatePerfectCores({
      mode: '3CORE_4_5',
      selectedSkillIds: skills.slice(0, 5),
      halfSkillId: 'e',
    });
    expect(output.error).toBeUndefined();
    expect(output.results.length).toBeGreaterThan(0);
    for (const result of output.results) {
      expect(result.cores).toHaveLength(3);
      expect(result.skillCounts.e).toBe(1);
      expect(result.skillLevels.e).toBe(25);
      expect(Object.values(result.skillCounts).filter((count) => count === 2)).toHaveLength(4);
    }
  });

  it('generates 4 core 4 skill transition layouts capped at level 50', () => {
    const output = calculatePerfectCores({
      mode: '4CORE_4',
      selectedSkillIds: skills.slice(0, 4),
    });
    expect(output.error).toBeUndefined();
    expect(output.results.length).toBeGreaterThan(0);
    for (const result of output.results) {
      expect(result.cores).toHaveLength(4);
      expect(new Set(result.cores.map((core) => core.mainSkillId)).size).toBe(4);
      expect(Object.values(result.skillCounts)).toEqual([3, 3, 3, 3]);
      expect(Object.values(result.skillLevels)).toEqual([50, 50, 50, 50]);
    }
  });

  it('rejects incorrect selection counts and half skill values', () => {
    expect(
      calculatePerfectCores({
        mode: '4CORE_6',
        selectedSkillIds: skills.slice(0, 5),
      }).error,
    ).toContain('6');
    expect(
      calculatePerfectCores({
        mode: '3CORE_4_5',
        selectedSkillIds: skills.slice(0, 5),
      }).error,
    ).toContain('半强化');
    expect(
      calculatePerfectCores({
        mode: '3CORE_4_5',
        selectedSkillIds: skills.slice(0, 5),
        halfSkillId: 'z',
      }).error,
    ).toContain('属于');
  });

  it('recommends the next core only from plans containing all owned cores', () => {
    const output = calculatePerfectCores({
      mode: '4CORE_6',
      selectedSkillIds: skills,
    });
    const owned = output.results[0].cores.slice(0, 1);
    const recommendations = recommendNextCores(output.results, owned);
    expect(recommendations.length).toBeGreaterThan(0);
    expect(recommendations.every((item) => getCoreKey(item.core) !== getCoreKey(owned[0]))).toBe(
      true,
    );
    expect(recommendations[0].planCount).toBeGreaterThan(0);
  });

  it('seeds ten Night Lord skills with six recommended local icons', () => {
    expect(nightLordSeedSkills).toHaveLength(10);
    expect(nightLordSeedSkills.filter((skill) => skill.recommended)).toHaveLength(6);
    expect(
      nightLordSeedSkills.every((skill) => skill.iconUrl?.startsWith('/assets/skills/night-lord/')),
    ).toBe(true);
  });

  it('seeds ten Adele skills with the six screenshot recommendations', () => {
    expect(adeleSeedSkills).toHaveLength(10);
    expect(adeleSeedSkills.filter((skill) => skill.recommended).map((skill) => skill.name)).toEqual(
      ['夏德/出神', '缔造/御剑收鞘', '御剑追击/剑咒之印', '斩决', '剑域/触底', '盛放之剑/暴风剑狱'],
    );
    expect(
      adeleSeedSkills.every((skill) => skill.iconUrl?.startsWith('/assets/skills/adele/')),
    ).toBe(true);
  });

  it('seeds eight Bishop skills with the six 4-core recommendations', () => {
    expect(bishopSeedSkills).toHaveLength(8);
    expect(
      bishopSeedSkills.filter((skill) => skill.recommended).map((skill) => skill.name),
    ).toEqual([
      '天愈之触',
      '创世之破',
      '光芒飞箭',
      '神龙召唤',
      '天怒/胜利之羽',
      '光辉之门/天罚之泉',
    ]);
    expect(
      bishopSeedSkills.every((skill) => skill.iconUrl?.startsWith('/assets/skills/bishop/')),
    ).toBe(true);
  });

  it('seeds eleven Ice Lightning skills with the six 4-core recommendations', () => {
    expect(iceLightningSeedSkills).toHaveLength(11);
    expect(
      iceLightningSeedSkills.filter((skill) => skill.recommended).map((skill) => skill.name),
    ).toEqual(['落雷枪', '链环闪电', '落霜冰破', '寒霜爆晶', '冰破魔兽', '闪电矛']);
    expect(
      iceLightningSeedSkills.every((skill) =>
        skill.iconUrl?.startsWith('/assets/skills/ice-lightning/'),
      ),
    ).toBe(true);
  });

  it('seeds nine Shadower skills with the six 4-core recommendations', () => {
    expect(shadowerSeedSkills).toHaveLength(9);
    expect(
      shadowerSeedSkills.filter((skill) => skill.recommended).map((skill) => skill.name),
    ).toEqual(['金钱炸弹/暗影炸弹', '黑暗闪击', '暗影闪猎', '瞬影进击', '突然袭击', '潜影伏兵']);
    expect(
      shadowerSeedSkills.every((skill) => skill.iconUrl?.startsWith('/assets/skills/shadower/')),
    ).toBe(true);
  });

  it('seeds concrete professions grouped by the reference categories', () => {
    expect(seedProfessions).toHaveLength(52);
    expect(professionCategories).toHaveLength(10);
    expect(seedProfessions.some((profession) => profession.id === 'adventurer-warrior')).toBe(
      false,
    );
    expect(seedProfessions.find((profession) => profession.id === 'night-lord')).toMatchObject({
      name: '隐士',
      category: '冒险家',
    });
    expect(seedProfessions.filter((profession) => profession.iconUrl)).toHaveLength(52);
  });

  it('syncs the reference simulator profession skill catalog locally', () => {
    expect(referenceSeedProfessionIds).toHaveLength(39);
    expect(
      seedSkills.filter((skill) => referenceSeedProfessionIds.includes(skill.professionId)),
    ).toHaveLength(421);
    expect(
      seedSkills
        .filter((skill) => referenceSeedProfessionIds.includes(skill.professionId))
        .every((skill) => skill.iconUrl?.startsWith('/assets/skills/')),
    ).toBe(true);
  });

  it('marks six image-reference skills for each supported 4-core-6 profession', () => {
    for (const professionId of imageFourCoreSixProfessionIds) {
      expect(
        seedSkills.filter((skill) => skill.professionId === professionId && skill.recommended),
        professionId,
      ).toHaveLength(6);
    }
  });

  it('records the long-image recommendation layout without enabling unsupported algorithms', () => {
    expect(referenceLayoutByProfessionId.hero).toBe('4核6技');
    expect(referenceLayoutByProfessionId.bowmaster).toBe('5核8技');
    expect(referenceLayoutByProfessionId['fire-poison']).toBe('6核9技');
    expect(referenceLayoutByProfessionId.zero).toBe('7核10技');
  });

  it('disables perfect-core data mutations in the public build', () => {
    expect(perfectCoreAdminEnabled).toBe(false);
    expect(() => assertPerfectCoreAdmin()).toThrow('不允许维护');
  });
});

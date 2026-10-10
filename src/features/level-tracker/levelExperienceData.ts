// 用户提供的 2026-03-30 参考表；原图注明部分等级经验存在小误差。
// level 表示升级前的等级；空白的 251→252 及后续等级不录入。
export const LEVEL_EXPERIENCE_VERSION = '2026-03-30';

const experienceInYi: ReadonlyArray<readonly [number, number]> = [
  [199, 11935.51],
  [200, 37188.41],
  [201, 37891.99],
  [202, 38616.64],
  [203, 39363.32],
  [204, 40001.35],
  [205, 40545.58],
  [206, 42531.64],
  [207, 43185.64],
  [208, 44191.96],
  [209, 45535.37],
  [210, 46591.61],
  [211, 48784.86],
  [212, 50839.38],
  [213, 52921.93],
  [214, 55364.47],
  [215, 58798.73],
  [216, 61273.38],
  [217, 64563.58],
  [218, 67248.64],
  [219, 70609.8],
  [220, 73996.89],
  [221, 77969.52],
  [222, 81510.34],
  [223, 84800.34],
  [224, 89761.44],
  [225, 93118.78],
  [226, 98471.89],
  [227, 103333.18],
  [228, 108156.95],
  [229, 113599.51],
  [230, 120140.1],
  [231, 125594.48],
  [232, 129020.22],
  [233, 135928.39],
  [234, 144651.34],
  [235, 146617.18],
  [236, 153981.15],
  [237, 160716.52],
  [238, 167735.65],
  [239, 173339.17],
  [240, 185504.66],
  [241, 199408.08],
  [242, 200061.16],
  [243, 208851.31],
  [244, 215622.89],
  [245, 224801.76],
  [246, 234431.12],
  [247, 244524.42],
  [248, 255092.85],
  [249, 264454.05],
  [250, 348659.72],
];

export const levelExperienceTable = experienceInYi.map(([level, experienceYi]) => ({
  level,
  nextLevel: level + 1,
  experience: Math.round(experienceYi * 100) * 1_000_000,
}));

export const referenceLevelRequirements: Record<string, number> = Object.fromEntries(
  levelExperienceTable.map(({ level, experience }) => [String(level), experience]),
);

export function hydrateLevelRequirements(
  requirements: Record<string, number> = {},
  version?: string,
): Record<string, number> {
  const stored = Object.fromEntries(
    Object.entries(requirements).filter(([, value]) => Number.isFinite(value) && value > 0),
  );
  const result = { ...referenceLevelRequirements, ...stored };
  if (version === LEVEL_EXPERIENCE_VERSION) return result;

  const oldDefaults: Record<string, number[]> = {
    200: [3_718_527_554_105],
    203: [420_000_000_000, 4_200_000_000_000, 4_000_000_000_000],
    206: [4_302_778_389_349],
  };
  const oldLevel200 = stored['200'] ?? 3_718_527_554_105;
  for (const oldLevel203 of [stored['203'], 4_200_000_000_000, 4_000_000_000_000]) {
    if (oldLevel203) oldDefaults['206'].push(Math.round(oldLevel203 * (oldLevel203 / oldLevel200)));
  }
  for (const [level, values] of Object.entries(oldDefaults)) {
    if (values.includes(stored[level])) result[level] = referenceLevelRequirements[level];
  }
  return result;
}

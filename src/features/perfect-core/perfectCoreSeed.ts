import type { Profession, Skill } from './perfectCoreTypes';
import { referenceSkillSeeds } from './perfectCoreReferenceData.generated';

export const professionCategories = [
  '翼人族',
  '冒险家',
  '反抗者',
  '希纳斯骑士团',
  '冒险岛英雄',
  '诺巴族',
  '晓之阵',
  '阿尼玛',
  '星之精灵',
  '其他',
] as const;

type ProfessionSeed = [id: string, name: string, category: string, portrait?: string];

const professionCatalog: ProfessionSeed[] = [
  ['adele', '御剑骑士', '翼人族'],
  ['illium', '圣晶使徒', '翼人族'],
  ['khali', '飞刃沙士', '翼人族'],
  ['ark', '影魂异人', '翼人族'],
  ['hero', '英雄', '冒险家'],
  ['paladin', '圣骑士', '冒险家'],
  ['dark-knight', '黑骑士', '冒险家'],
  ['fire-poison', '火毒', '冒险家'],
  ['ice-lightning', '冰雷', '冒险家'],
  ['bishop', '主教', '冒险家'],
  ['bowmaster', '神射手', '冒险家'],
  ['marksman', '箭神', '冒险家'],
  ['pathfinder', '古迹猎人', '冒险家'],
  ['night-lord', '隐士', '冒险家'],
  ['shadower', '侠影', '冒险家'],
  ['dual-blade', '暗影双刀', '冒险家'],
  ['buccaneer', '冲锋队长', '冒险家'],
  ['corsair', '船长', '冒险家'],
  ['cannoneer', '火炮手', '冒险家'],
  ['blaster', '爆破手', '反抗者'],
  ['battle-mage', '唤灵斗师', '反抗者'],
  ['wild-hunter', '豹弩游侠', '反抗者'],
  ['mechanic', '机械师', '反抗者'],
  ['demon-slayer', '恶魔猎手', '反抗者'],
  ['demon-avenger', '恶魔复仇者', '反抗者'],
  ['xenon', '尖兵', '反抗者'],
  ['mihile', '米哈尔', '希纳斯骑士团'],
  ['dawn-warrior', '魂骑士', '希纳斯骑士团'],
  ['flame-wizard', '炎术士', '希纳斯骑士团'],
  ['wind-archer', '风灵使者', '希纳斯骑士团'],
  ['night-walker', '夜行者', '希纳斯骑士团'],
  ['thunder-breaker', '奇袭者', '希纳斯骑士团'],
  ['aran', '战神', '冒险岛英雄'],
  ['evan', '龙神', '冒险岛英雄'],
  ['mercedes', '双弩精灵', '冒险岛英雄'],
  ['phantom', '幻影', '冒险岛英雄'],
  ['luminous', '夜光法师', '冒险岛英雄'],
  ['shade', '隐月', '冒险岛英雄'],
  ['kaiser', '狂龙战士', '诺巴族'],
  ['kain', '炼狱黑客', '诺巴族', 'kain.png'],
  ['kadena', '魔链影士', '诺巴族'],
  ['angelic-buster', '爆莉萌天使', '诺巴族'],
  ['hayato', '剑豪', '晓之阵'],
  ['kanna', '阴阳师', '晓之阵'],
  ['lara', '元素师', '阿尼玛'],
  ['hoyoung', '虎影', '阿尼玛'],
  ['sia', '施亚', '星之精灵'],
  ['erel', '艾利尔', '星之精灵', 'erel.png'],
  ['lynn', '琳恩', '其他'],
  ['zero', '神之子', '其他'],
  ['kinesis', '超能力者', '其他'],
  ['mo-xuan', '墨玄', '其他'],
];

const skillNames: Record<string, string[]> = {
  'night-lord': [
    '猎手标记',
    '爆裂飞镖',
    '风之护符',
    '三连环光击破',
    '飞镖决战',
    '黑暗闪击',
    '四连镖',
    '突然袭击',
    '决战之巅',
    '四季飞镖',
  ],
  shadower: [
    '回旋斩',
    '刀刃之舞',
    '金钱炸弹/暗影炸弹',
    '炼狱',
    '黑暗闪击',
    '暗影闪猎',
    '瞬影进击',
    '突然袭击',
    '潜影伏兵',
  ],
  'dual-blade': ['短剑升天', '阿修罗', '暴怒刀阵', '幻影突袭', '隐身术', '终极斩'],
  hero: ['进阶斗气', '狂暴战魂', '燃烧灵魂', '无双剑舞', '终极打击', '剑之意志'],
  'dark-knight': ['黑暗穿刺', '永恒之枪', '拉曼查之枪', '灵魂助力', '黑暗力量', '恶龙附身'],
  paladin: ['圣域', '神圣冲击', '圣骑士意志', '元素冲击', '祝福护甲', '终极冲击'],
  bishop: [
    '天愈之触',
    '光明之箭',
    '光之翼',
    '创世之破',
    '光芒飞箭',
    '神龙召唤',
    '天怒/胜利之羽',
    '光辉之门/天罚之泉',
  ],
  'ice-lightning': [
    '冰椎剑',
    '雷电术',
    '寒冰迅移',
    '冰咆哮',
    '冰河壁',
    '落雷枪',
    '链环闪电',
    '落霜冰破',
    '寒霜爆晶',
    '冰破魔兽',
    '闪电矛',
  ],
  bowmaster: ['暴风箭雨', '箭雨扫射', '幻影箭舞', '风之护身', '进阶终极攻击', '集中精力'],
  marksman: ['穿透箭', '狙击', '一击要害', '必杀狙击', '无形箭', '进阶终极攻击'],
  buccaneer: ['金属风暴', '海盗船炮击', '章鱼炮台', '传说之枪', '幸运骰子', '超人变形'],
  corsair: ['召唤船员', '金属风暴', '冒险岛勇士', '急速射击', '霸王射击', '海盗精神'],
  aran: ['冰雪矛', '终极矛', '摩诃之舞', '巨熊咆哮', '战神之舞', '玛哈的领域'],
  evan: ['龙之气息', '龙之主', '风之翼', '火焰之环', '魔法爆发', '元素重置'],
  phantom: ['卡牌风暴', '玫瑰卡牌', '幻影突袭', '黑色秘术', '审判', '盗贼本能'],
  luminous: ['启示录', '绝对击杀', '光暗转换', '晨星坠落', '末日审判', '光之守护'],
  shade: ['鬼斩', '灵魂分离', '狐火', '精灵凝聚', '幻灵武器', '招魂结界'],
  'demon-slayer': ['恶魔冲击波', '恶魔血月斩', '恶魔叫声', '黑暗束缚', '变形', '恶魔之怒'],
  'demon-avenger': ['盾牌追击', '地狱之力', '血腥禁锢', '超越', '生命吸收', '永恒之约'],
  blaster: ['旋转炮击', '反冲炮击', '火山爆发', '汽缸耐久', '组合训练', '双重爆炸'],
  mechanic: ['机器人工厂', '战争机器', '磁场', '巨型机器人', '导弹罐', '机械装甲'],
  'wild-hunter': ['连射弩', '召唤美洲豹', '捕获', '狂野射击', '音爆箭', '野性本能'],
  zero: ['阿尔法斩击', '贝塔重击', '时间凝聚', '旋风斩', '影子闪避', '时之威能'],
  kaiser: ['龙烈焰', '意志之剑', '蓝焰恐惧', '终极形态', '龙之力', '剑刃突击'],
  kadena: ['链之艺术', '召唤重物', '武器变换', '链刃风暴', '弱点识破', '混沌之王'],
  'angelic-buster': ['灵魂探求者', '三位一体', '超级诺瓦', '穿刺爆炸', '灵魂共鸣', '粉色裙摆'],
  adele: [
    '本能',
    '夏德/出神',
    '剑刺',
    '十字穿叉',
    '缔造/御剑收鞘',
    '御剑穿刺/共振/标记',
    '御剑追击/剑咒之印',
    '斩决',
    '剑域/触底',
    '盛放之剑/暴风剑狱',
  ],
  illium: ['水晶之门', '水晶波动', '水晶守护', '魔法碎片', '无限棱镜', '荣耀之翼'],
  ark: ['无穷之力', '深渊突袭', '幽灵侵袭', '根源之夜', '战斗狂热', '融合技能'],
  hoyoung: ['仙技·梦游桃源', '仙技·金箍棒', '仙技·分身乱舞', '卷云', '追踪鬼火', '天地人'],
};

export const seedProfessions: Profession[] = professionCatalog.map(
  ([id, name, category, portrait], index) => ({
    id,
    name,
    category,
    iconUrl: portrait === '' ? undefined : `/assets/professions/${portrait ?? `${id}.jpg`}`,
    sortOrder: index,
    active: true,
  }),
);

const nightLordIcons: Record<string, string> = {
  猎手标记: '/assets/skills/night-lord/hunter-mark.png',
  爆裂飞镖: '/assets/skills/night-lord/explosive-stars.png',
  风之护符: '/assets/skills/night-lord/wind-talisman.png',
  三连环光击破: '/assets/skills/night-lord/triple-ring.png',
  飞镖决战: '/assets/skills/night-lord/star-showdown.png',
  黑暗闪击: '/assets/skills/night-lord/dark-flare.png',
  四连镖: '/assets/skills/night-lord/quad-star.png',
  突然袭击: '/assets/skills/night-lord/sudden-raid.png',
  决战之巅: '/assets/skills/night-lord/showdown.png',
  四季飞镖: '/assets/skills/night-lord/four-seasons.png',
};
const nightLordRecommended = new Set([
  '猎手标记',
  '黑暗闪击',
  '四连镖',
  '突然袭击',
  '决战之巅',
  '四季飞镖',
]);
const adeleIcons: Record<string, string> = {
  本能: '/assets/skills/adele/instinct.png',
  '夏德/出神': '/assets/skills/adele/shard-wonder.png',
  剑刺: '/assets/skills/adele/sword-stab.png',
  十字穿叉: '/assets/skills/adele/cross-pierce.png',
  '缔造/御剑收鞘': '/assets/skills/adele/creation-sheathe.png',
  '御剑穿刺/共振/标记': '/assets/skills/adele/aether-pierce-resonance-mark.png',
  '御剑追击/剑咒之印': '/assets/skills/adele/aether-chase-curse-mark.png',
  斩决: '/assets/skills/adele/cleave.png',
  '剑域/触底': '/assets/skills/adele/aether-domain-plummet.png',
  '盛放之剑/暴风剑狱': '/assets/skills/adele/bloom-storm-prison.png',
};
const adeleRecommended = new Set([
  '夏德/出神',
  '缔造/御剑收鞘',
  '御剑追击/剑咒之印',
  '斩决',
  '剑域/触底',
  '盛放之剑/暴风剑狱',
]);
const bishopIcons: Record<string, string> = {
  天愈之触: '/assets/skills/bishop/heavenly-touch.png',
  光明之箭: '/assets/skills/bishop/shining-arrow.png',
  光之翼: '/assets/skills/bishop/light-wing.png',
  创世之破: '/assets/skills/bishop/genesis-break.png',
  光芒飞箭: '/assets/skills/bishop/radiant-arrow.png',
  神龙召唤: '/assets/skills/bishop/dragon-summon.png',
  '天怒/胜利之羽': '/assets/skills/bishop/heaven-wrath-victory-feather.png',
  '光辉之门/天罚之泉': '/assets/skills/bishop/radiant-gate-judgment-spring.png',
};
const bishopRecommended = new Set([
  '天愈之触',
  '创世之破',
  '光芒飞箭',
  '神龙召唤',
  '天怒/胜利之羽',
  '光辉之门/天罚之泉',
]);
const iceLightningIcons: Record<string, string> = {
  冰椎剑: '/assets/skills/ice-lightning/ice-cone-sword.png',
  雷电术: '/assets/skills/ice-lightning/thunderbolt.png',
  寒冰迅移: '/assets/skills/ice-lightning/cold-teleport.png',
  冰咆哮: '/assets/skills/ice-lightning/ice-roar.png',
  冰河壁: '/assets/skills/ice-lightning/ice-wall.png',
  落雷枪: '/assets/skills/ice-lightning/falling-thunder-spear.png',
  链环闪电: '/assets/skills/ice-lightning/chain-lightning.png',
  落霜冰破: '/assets/skills/ice-lightning/frostfall-break.png',
  寒霜爆晶: '/assets/skills/ice-lightning/frost-crystal.png',
  冰破魔兽: '/assets/skills/ice-lightning/ice-demon-beast.png',
  闪电矛: '/assets/skills/ice-lightning/lightning-spear.png',
};
const iceLightningRecommended = new Set([
  '落雷枪',
  '链环闪电',
  '落霜冰破',
  '寒霜爆晶',
  '冰破魔兽',
  '闪电矛',
]);
const shadowerIcons: Record<string, string> = {
  回旋斩: '/assets/skills/shadower/spinning-slash.png',
  刀刃之舞: '/assets/skills/shadower/blade-dance.png',
  '金钱炸弹/暗影炸弹': '/assets/skills/shadower/meso-explosion-shadow-bomb.png',
  炼狱: '/assets/skills/shadower/purgatory.png',
  黑暗闪击: '/assets/skills/shadower/dark-flare.png',
  暗影闪猎: '/assets/skills/shadower/shadow-hunter.png',
  瞬影进击: '/assets/skills/shadower/instant-shadow-assault.png',
  突然袭击: '/assets/skills/shadower/sudden-raid.png',
  潜影伏兵: '/assets/skills/shadower/shadow-ambush.png',
};
const shadowerRecommended = new Set([
  '金钱炸弹/暗影炸弹',
  '黑暗闪击',
  '暗影闪猎',
  '瞬影进击',
  '突然袭击',
  '潜影伏兵',
]);

const imageFourCoreSixRecommendations: Record<string, ReadonlySet<string>> = {
  hero: new Set(['最终之击', '战士意念', '灵刃双月', '终极打击', '烈焰冲斩', '狂怒连爆']),
  paladin: new Set(['崇高裁决/崇高烙印', '巨锤挥击', '连环环破', '圣域', '巨锤重击', '毁灭']),
  'dark-knight': new Set([
    '最终之击',
    '眼魔',
    '突进/飞跃一击/冲天击',
    '黑暗穿刺',
    '永恒之枪',
    '黑暗融合',
  ]),
  'dual-blade': new Set(['奔腾之刃', '幽灵一击', '暴怒刀阵', '突然袭击', '隐形剑', '阿修罗']),
  buccaneer: new Set([
    '水龙迸发/水龙袭击',
    '贯骨击',
    '水龙爆冲/水龙袭击激怒',
    '轰炸机',
    '激怒拳',
    '诺特勒斯战舰',
  ]),
  'dawn-warrior': new Set(['猛袭', '炽日流火', '宇宙爆裂', '太阳抨击', '日月斩', '宇宙星流']),
  'flame-wizard': new Set(['轨道烈焰', '轨道爆裂', '灭绝之焰', '地狱火海', '凤凰重击', '灭顶之灾']),
  'wind-archer': new Set([
    '狂风肆虐/风暴无常',
    '精准箭',
    '天空之歌',
    '仙灵回旋',
    '暴风灭世',
    '季风',
  ]),
  'night-walker': new Set([
    '暗影蝙蝠/贪婪蝙蝠',
    '碎星镖',
    '黑暗预兆',
    '暗影缚魂',
    '五连镖',
    '黑暗领域',
  ]),
  'battle-mage': new Set(['死神召唤', '黑暗闪电', '战法突击', '致命冲击', '黑暗创世', '斗战破军']),
  mechanic: new Set([
    '进阶机枪扫射',
    '追踪导弹',
    '机甲大炮：代号7',
    '磁场',
    '机器人工厂：代号1',
    '扭曲空间',
  ]),
  'demon-slayer': new Set([
    '恶魔狂斩',
    '恶魔末日烈焰',
    '恶魔冲击',
    '恶魔嘶吼',
    '黑暗变形',
    '冥狱夺魂',
  ]),
  'demon-avenger': new Set([
    '暗影蝙蝠',
    '超越：月光斩',
    '超越：逆十字斩',
    '盾牌追击',
    '强化超越',
    '万剑瞬斩',
  ]),
  xenon: new Set([
    '精准火箭',
    '三角进攻',
    '刀锋之舞',
    '聚能脉冲炮：炮击/聚能脉冲炮：爆击/聚能脉冲炮：狙击',
    '全息力场：领域/全息力场：支援/全息力场：穿透',
    '诸天毁灭之光',
  ]),
  phantom: new Set([
    '炫目卡牌/死神卡牌',
    '蓝光连击',
    '暮光祝福',
    '卡牌风暴',
    '盗亦有道4',
    '玫瑰卡牌之终曲',
  ]),
  kaiser: new Set(['‎剑刃之壁', '扇击', '石化', '‎怒雷屠龙斩', '剑气突袭', '‎恶魔之息']),
  'angelic-buster': new Set([
    '灵魂追击者',
    '原始之吼',
    '大地冲击波',
    '灵魂共鸣',
    '三位一体',
    '超级诺巴',
  ]),
};

export const imageFourCoreSixProfessionIds = Object.keys(imageFourCoreSixRecommendations);

const recommendationNames: Record<string, ReadonlySet<string>> = {
  ...imageFourCoreSixRecommendations,
  'night-lord': nightLordRecommended,
  adele: adeleRecommended,
  bishop: bishopRecommended,
  'ice-lightning': iceLightningRecommended,
  shadower: shadowerRecommended,
};

const iconMaps: Record<string, Record<string, string>> = {
  'night-lord': nightLordIcons,
  adele: adeleIcons,
  bishop: bishopIcons,
  'ice-lightning': iceLightningIcons,
  shadower: shadowerIcons,
};

export const referenceSeedProfessionIds = Object.keys(referenceSkillSeeds);
const referenceSeedProfessionIdSet = new Set(referenceSeedProfessionIds);

const fallbackSeedSkills: Skill[] = Object.entries(skillNames)
  .filter(([professionId]) => !referenceSeedProfessionIdSet.has(professionId))
  .flatMap(([professionId, names]) =>
    names.map((name, index) => ({
      id: `${professionId}-${index + 1}`,
      professionId,
      name,
      iconUrl: iconMaps[professionId]?.[name],
      sortOrder: index,
      active: true,
      recommended: recommendationNames[professionId]?.has(name) ?? index < 4,
    })),
  );

const synchronizedSeedSkills: Skill[] = Object.entries(referenceSkillSeeds).flatMap(
  ([professionId, skills]) =>
    skills.map((skill) => ({
      id: skill.id,
      professionId,
      name: skill.name,
      iconUrl: skill.iconUrl,
      sortOrder: skill.sortOrder,
      active: true,
      recommended: recommendationNames[professionId]?.has(skill.name) ?? false,
    })),
);

export const seedSkills: Skill[] = [...fallbackSeedSkills, ...synchronizedSeedSkills];

export const nightLordSeedSkills = seedSkills.filter(
  (skill) => skill.professionId === 'night-lord',
);
export const adeleSeedSkills = seedSkills.filter((skill) => skill.professionId === 'adele');
export const bishopSeedSkills = seedSkills.filter((skill) => skill.professionId === 'bishop');
export const iceLightningSeedSkills = seedSkills.filter(
  (skill) => skill.professionId === 'ice-lightning',
);
export const shadowerSeedSkills = seedSkills.filter((skill) => skill.professionId === 'shadower');

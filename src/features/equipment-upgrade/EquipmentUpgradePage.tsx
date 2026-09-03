import { useMemo, useState } from 'react';
import CurrencyBenchmarkPanel from '../../shared/currency/CurrencyBenchmarkPanel';
import { calculateCurrencyBenchmark } from '../../shared/currency/currencyBenchmark';
import { useCurrencyPriceSystem } from '../../shared/currency/useCurrencyPriceSystem';
import { sitePath } from '../../shared/lib/sitePaths';
import './equipment-upgrade.css';
import './equipment-upgrade-sources.css';

type EquipmentType = 'weapon' | 'armor';
type MaterialTone = 'powder' | 'rare' | 'purple' | 'gold' | 'legendary';

type MaterialResult = {
  name: string;
  shortName: string;
  percent: number;
  experience: number;
  cost: number | null;
  costUnit: string;
  quantity: number;
  totalCost: number | null;
  mesoCost: number | null;
  rmbCost: number | null;
  totalRmbCost: number | null;
  experiencePerRmb: number;
  tone: MaterialTone;
};

type PowderSource = {
  id: 'weapon-stone' | 'weapon-powder' | 'weapon-artifact-powder' | 'armor-stone';
  shop: string;
  name: string;
  image: string;
  quantity: number;
  experienceEach: number | null;
  redDiamondCost: number;
  equipment: EquipmentType;
};

const powderSources: PowderSource[] = [
  {
    id: 'weapon-stone',
    shop: '水晶商店',
    name: '神秘的武器研磨石（神器）',
    image: '/items/artifact-weapon-grindstone.png',
    quantity: 3,
    experienceEach: 50000,
    redDiamondCost: 252,
    equipment: 'weapon',
  },
  {
    id: 'weapon-powder',
    shop: '私人商店',
    name: '神秘的武器炼成粉（传说）',
    image: '/items/legendary-weapon-powder.png',
    quantity: 30,
    experienceEach: 3000,
    redDiamondCost: 359,
    equipment: 'weapon',
  },
  {
    id: 'weapon-artifact-powder',
    shop: '游戏道具 · 特惠礼包',
    name: '神秘的武器炼成粉（神器）',
    image: '/items/artifact-weapon-powder-detail.png',
    quantity: 7,
    experienceEach: 1000,
    redDiamondCost: 14,
    equipment: 'weapon',
  },
  {
    id: 'armor-stone',
    shop: '水晶商店',
    name: '神秘的防具研磨石（神器）',
    image: '/items/artifact-armor-grindstone-detail.png',
    quantity: 3,
    experienceEach: 50000,
    redDiamondCost: 126,
    equipment: 'armor',
  },
];

const STEEL_PACK_QUANTITY = 10;
const LEATHER_PACK_QUANTITY = 10;
const RARE_WEAPON_STEEL_COUNT = 12;

const format = (value: number, digits = 0) =>
  new Intl.NumberFormat('zh-CN', {
    maximumFractionDigits: digits,
    minimumFractionDigits: digits,
  }).format(Number.isFinite(value) ? value : 0);

export default function EquipmentUpgradePage() {
  const { benchmark, crystalPackage, setBenchmark, setCrystalPackage } = useCurrencyPriceSystem();
  const [equipmentType, setEquipmentType] = useState<EquipmentType>('weapon');
  const targetPercent = 100;
  const powderExperience = 10000;
  const powderPercent = 3.4;
  const purplePercent = 0.767;
  const steelCount = 62;
  const [steelPackMesoPrice, setSteelPackMesoPrice] = useState(5);
  const artifactPercent = 13.7;
  const [artifactCost, setArtifactCost] = useState(136);
  const [legendaryWeaponCost, setLegendaryWeaponCost] = useState(2269);
  const [weaponStonePrice, setWeaponStonePrice] = useState(252);
  const [weaponPowderPrice, setWeaponPowderPrice] = useState(359);
  const [weaponArtifactPowderPrice, setWeaponArtifactPowderPrice] = useState(14);
  const [armorStonePrice, setArmorStonePrice] = useState(126);
  const epicHatLeatherCount = 24;
  const [leatherPackMesoPrice, setLeatherPackMesoPrice] = useState(2);

  const economy = useMemo(
    () => calculateCurrencyBenchmark(benchmark, crystalPackage),
    [benchmark, crystalPackage],
  );

  const metrics = useMemo(() => {
    const experiencePerPercent = powderPercent > 0 ? powderExperience / powderPercent : 0;
    const targetExperience = experiencePerPercent * targetPercent;
    const createMaterial = (
      name: string,
      shortName: string,
      percent: number,
      cost: number | null,
      costUnit: string,
      tone: MaterialTone,
      explicitMesoCost?: number,
      directExperience?: number,
    ): MaterialResult => {
      const quantity = percent > 0 ? targetPercent / percent : 0;
      const mesoCost = explicitMesoCost ?? (cost !== null && costUnit === '枫币' ? cost : null);
      const rmbCost = mesoCost === null ? null : mesoCost * economy.rmbPerMeso;
      const experience = directExperience ?? experiencePerPercent * percent;
      return {
        name,
        shortName,
        percent,
        experience,
        cost,
        costUnit,
        quantity,
        totalCost: cost === null ? null : quantity * cost,
        mesoCost,
        rmbCost,
        totalRmbCost: rmbCost === null ? null : quantity * rmbCost,
        experiencePerRmb: rmbCost && rmbCost > 0 ? experience / rmbCost : 0,
        tone,
      };
    };
    const epicWeaponMesoCost = (steelCount / STEEL_PACK_QUANTITY) * steelPackMesoPrice;
    const rareWeaponMesoCost = (RARE_WEAPON_STEEL_COUNT / STEEL_PACK_QUANTITY) * steelPackMesoPrice;
    const materials = [
      createMaterial(
        '稀有武器',
        '稀有',
        0,
        RARE_WEAPON_STEEL_COUNT,
        '钢铁',
        'rare',
        rareWeaponMesoCost,
        530,
      ),
      createMaterial(
        '史诗武器',
        '史诗',
        purplePercent,
        steelCount,
        '钢铁',
        'purple',
        epicWeaponMesoCost,
      ),
      createMaterial('神器武器', '神器', artifactPercent, artifactCost, '枫币', 'gold'),
      createMaterial(
        '传说武器',
        '传说',
        0,
        legendaryWeaponCost,
        '枫币',
        'legendary',
        legendaryWeaponCost,
        60400,
      ),
    ];
    const sourcePrices: Record<PowderSource['id'], number> = {
      'weapon-stone': weaponStonePrice,
      'weapon-powder': weaponPowderPrice,
      'weapon-artifact-powder': weaponArtifactPowderPrice,
      'armor-stone': armorStonePrice,
    };
    const weaponPowderSources = powderSources
      .filter((source) => source.equipment === 'weapon')
      .map((source) => {
        const redDiamondCost = sourcePrices[source.id];
        const totalExperience = (source.experienceEach ?? 0) * source.quantity;
        return {
          ...source,
          redDiamondCost,
          totalExperience,
          experiencePerDiamond: redDiamondCost > 0 ? totalExperience / redDiamondCost : 0,
          equivalentPercent: experiencePerPercent > 0 ? totalExperience / experiencePerPercent : 0,
          rmbCost: redDiamondCost * economy.rmbPerRedCrystal,
          experiencePerRmb:
            economy.rmbPerRedCrystal > 0 && redDiamondCost > 0
              ? totalExperience / (redDiamondCost * economy.rmbPerRedCrystal)
              : 0,
        };
      });
    return { experiencePerPercent, targetExperience, materials, weaponPowderSources };
  }, [
    armorStonePrice,
    artifactCost,
    artifactPercent,
    economy.rmbPerMeso,
    economy.rmbPerRedCrystal,
    legendaryWeaponCost,
    powderExperience,
    powderPercent,
    purplePercent,
    steelCount,
    steelPackMesoPrice,
    targetPercent,
    weaponArtifactPowderPrice,
    weaponPowderPrice,
    weaponStonePrice,
  ]);

  const armorMaterials = useMemo(() => {
    const createArmorMaterial = (
      name: string,
      shortName: string,
      experience: number,
      tone: MaterialTone,
      materialCost: number | null,
      costUnit: string,
      mesoCost: number | null,
    ) => {
      const rmbCost = mesoCost === null ? null : mesoCost * economy.rmbPerMeso;
      return {
        name,
        shortName,
        experience,
        tone,
        materialCost,
        costUnit,
        mesoCost,
        rmbCost,
        experiencePerRmb: rmbCost && rmbCost > 0 ? experience / rmbCost : null,
      };
    };
    const epicHatMesoCost = (epicHatLeatherCount / LEATHER_PACK_QUANTITY) * leatherPackMesoPrice;
    return [
      createArmorMaterial('神器装备', '神器', 20143, 'gold', artifactCost, '枫币', artifactCost),
      createArmorMaterial(
        '史诗帽子',
        '史诗',
        1240,
        'purple',
        epicHatLeatherCount,
        '皮革',
        epicHatMesoCost,
      ),
      createArmorMaterial('稀有装备', '稀有', 263, 'powder', null, '—', null),
      createArmorMaterial('传说粉末', '粉末', 3000, 'powder', null, '—', null),
    ];
  }, [artifactCost, economy.rmbPerMeso, epicHatLeatherCount, leatherPackMesoPrice]);

  const armorPowderSource = useMemo(() => {
    const source = powderSources.find((item) => item.id === 'armor-stone')!;
    const totalExperience = (source.experienceEach ?? 0) * source.quantity;
    const rmbCost = armorStonePrice * economy.rmbPerRedCrystal;
    return {
      ...source,
      redDiamondCost: armorStonePrice,
      totalExperience,
      rmbCost,
      experiencePerDiamond: armorStonePrice > 0 ? totalExperience / armorStonePrice : 0,
      experiencePerRmb: rmbCost > 0 ? totalExperience / rmbCost : 0,
    };
  }, [armorStonePrice, economy.rmbPerRedCrystal]);

  const updateSourcePrice = (id: PowderSource['id'], rawValue: string) => {
    const parsed = Number(rawValue);
    const value = Number.isFinite(parsed) ? Math.max(0, parsed) : 0;
    if (id === 'weapon-stone') setWeaponStonePrice(value);
    else if (id === 'weapon-powder') setWeaponPowderPrice(value);
    else if (id === 'weapon-artifact-powder') setWeaponArtifactPowderPrice(value);
    else setArmorStonePrice(value);
  };

  const upgradePowderSources = [...metrics.weaponPowderSources, armorPowderSource].filter(
    (source) => source.equipment === equipmentType,
  );
  const upgradeMaterialOrder = new Map(
    [
      ...(equipmentType === 'weapon'
        ? metrics.materials.map((item) => ({ key: item.name, value: item.experiencePerRmb }))
        : armorMaterials.map((item) => ({ key: item.name, value: item.experiencePerRmb ?? -1 }))),
      ...upgradePowderSources.map((source) => ({ key: source.id, value: source.experiencePerRmb })),
    ]
      .sort((left, right) => right.value - left.value)
      .map((item, index) => [item.key, index]),
  );

  return (
    <main className="upgrade-shell">
      <header className="upgrade-header">
        <div>
          <a className="upgrade-brand" href={sitePath('/')}>
            Maple<span>Lab</span>
          </a>
          <span>/</span>
          <strong>装备升级实验室</strong>
        </div>
        <nav>
          <a href={sitePath('/currency')}>货币工具</a>
          <a href={sitePath('/level-tracker')}>等级跟踪器</a>
        </nav>
      </header>

      <section className="upgrade-hero">
        <div>
          <p className="upgrade-eyebrow">EQUIPMENT UPGRADE LAB</p>
          <h1>
            装备升级，
            <br />
            <span>每份材料都算清。</span>
          </h1>
          <p>根据实测升级百分比，以经验粉末为基准反推每种材料的等价经验与升级成本。</p>
        </div>
        <div className="upgrade-type-panel" aria-label="装备类型">
          <small>选择装备类型</small>
          <div className="upgrade-type-switch">
            <button
              type="button"
              className={equipmentType === 'weapon' ? 'active' : ''}
              onClick={() => setEquipmentType('weapon')}
            >
              <b>剑</b>
              <span>
                武器<em>WEAPON</em>
              </span>
            </button>
            <button
              type="button"
              className={equipmentType === 'armor' ? 'active' : ''}
              onClick={() => setEquipmentType('armor')}
            >
              <b>盾</b>
              <span>
                防具<em>ARMOR</em>
              </span>
            </button>
          </div>
        </div>
      </section>

      <CurrencyBenchmarkPanel
        value={benchmark}
        metrics={economy}
        crystalPackage={crystalPackage}
        onChange={setBenchmark}
        onCrystalPackageChange={setCrystalPackage}
      />

      <section className="upgrade-materials">
        <div className="upgrade-section-heading">
          <div>
            <p className="upgrade-eyebrow">
              {equipmentType === 'weapon' ? 'WEAPON MATERIALS' : 'ARMOR MATERIALS'}
            </p>
            <h2>{equipmentType === 'weapon' ? '武器升级材料' : '防具升级材料'}</h2>
          </div>
          <span>按每元经验从高到低排列</span>
        </div>
        <div className="unified-material-grid">
          {equipmentType === 'weapon'
            ? metrics.materials.map((item) => (
                <article
                  className={`weapon-material-card ${item.tone}`}
                  key={item.name}
                  style={{ order: upgradeMaterialOrder.get(item.name) }}
                >
                  <div className="material-title">
                    <span>{item.shortName}</span>
                    <div>
                      <small>升级材料</small>
                      <h3>{item.name}</h3>
                    </div>
                  </div>
                  {item.name === '史诗武器' && (
                    <img
                      className="material-reference-image epic"
                      src="/items/epic-weapon-upgrade.png"
                      alt="史诗武器升级材料截图"
                    />
                  )}
                  {item.name === '神器武器' && (
                    <img
                      className="material-reference-image artifact"
                      src="/items/artifact-weapon.png"
                      alt="神器武器伽耶汉斗拳"
                    />
                  )}
                  <div className="experience-showcase">
                    <div>
                      <small>单件经验</small>
                      <strong>{format(item.experience)}</strong>
                      <em>经验</em>
                    </div>
                    <div className="efficiency">
                      <small>每元经验</small>
                      <strong>{format(item.experiencePerRmb)}</strong>
                      <em>经验 / 元</em>
                    </div>
                  </div>
                  <dl>
                    <div>
                      <dt>材料成本</dt>
                      <dd>{item.cost === null ? '—' : `${format(item.cost)} ${item.costUnit}`}</dd>
                    </div>
                    {(item.name === '稀有武器' || item.name === '史诗武器') && (
                      <div className="material-meso-editor steel-price-editor">
                        <dt>钢铁售价</dt>
                        <dd>
                          <select
                            aria-label="每10个钢铁售价"
                            value={steelPackMesoPrice}
                            onChange={(event) => setSteelPackMesoPrice(Number(event.target.value))}
                          >
                            {[5, 6, 7, 8].map((price) => (
                              <option value={price} key={price}>
                                {price}
                              </option>
                            ))}
                          </select>
                          <span>枫币 / 10个</span>
                        </dd>
                      </div>
                    )}
                    <div
                      className={
                        item.name === '神器武器' || item.name === '传说武器'
                          ? 'material-meso-editor'
                          : ''
                      }
                    >
                      <dt>枫币成本</dt>
                      <dd>
                        {item.name === '神器武器' ? (
                          <>
                            <select
                              aria-label="神器武器枫币成本"
                              value={artifactCost}
                              onChange={(event) => setArtifactCost(Number(event.target.value))}
                            >
                              {[136, 203, 271, 339, 475].map((price) => (
                                <option value={price} key={price}>
                                  {price}
                                </option>
                              ))}
                            </select>
                            <span>枫币</span>
                          </>
                        ) : item.name === '传说武器' ? (
                          <>
                            <input
                              aria-label="传说武器枫币成本"
                              type="number"
                              min="0"
                              step="1"
                              value={legendaryWeaponCost}
                              onChange={(event) => {
                                const value = Number(event.target.value);
                                setLegendaryWeaponCost(
                                  Number.isFinite(value) ? Math.max(0, value) : 0,
                                );
                              }}
                            />
                            <span>枫币</span>
                          </>
                        ) : (
                          `${format(item.mesoCost ?? 0, 2)} 枫币`
                        )}
                      </dd>
                    </div>
                    <div>
                      <dt>人民币成本</dt>
                      <dd>{item.rmbCost === null ? '—' : `¥ ${format(item.rmbCost, 3)}`}</dd>
                    </div>
                  </dl>
                </article>
              ))
            : armorMaterials.map((item, index) => (
                <article
                  className={`weapon-material-card armor-material-card ${item.tone}`}
                  key={item.name}
                  style={{ order: upgradeMaterialOrder.get(item.name) }}
                >
                  <div className="material-title">
                    <span>{item.shortName}</span>
                    <div>
                      <small>升级材料</small>
                      <h3>{item.name}</h3>
                    </div>
                  </div>
                  <div className="experience-showcase">
                    <div>
                      <small>单件经验</small>
                      <strong>{format(item.experience)}</strong>
                      <em>经验</em>
                    </div>
                    <div className="efficiency">
                      <small>每元经验</small>
                      <strong>
                        {item.experiencePerRmb === null ? '待补充' : format(item.experiencePerRmb)}
                      </strong>
                      {item.experiencePerRmb !== null && <em>经验 / 元</em>}
                    </div>
                  </div>
                  <dl>
                    <div>
                      <dt>计算参考</dt>
                      <dd>
                        {index === 0
                          ? '32.97 × 611'
                          : index === 1
                            ? '2.03 × 611'
                            : index === 2
                              ? '0.43 × 611'
                              : '已知经验'}
                      </dd>
                    </div>
                    <div>
                      <dt>材料成本</dt>
                      <dd>
                        {item.materialCost === null
                          ? '待补充'
                          : `${format(item.materialCost)} ${item.costUnit}`}
                      </dd>
                    </div>
                    {item.name === '神器装备' && (
                      <div className="material-meso-editor">
                        <dt>枫币售价</dt>
                        <dd>
                          <select
                            aria-label="神器装备枫币售价"
                            value={artifactCost}
                            onChange={(event) => setArtifactCost(Number(event.target.value))}
                          >
                            {[136, 203, 271, 339, 475].map((price) => (
                              <option value={price} key={price}>
                                {price}
                              </option>
                            ))}
                          </select>
                          <span>枫币</span>
                        </dd>
                      </div>
                    )}
                    {item.name === '史诗帽子' && (
                      <div className="material-meso-editor leather-price-editor">
                        <dt>皮革售价</dt>
                        <dd>
                          <input
                            aria-label="每10个皮革售价"
                            type="number"
                            min="0"
                            step="0.01"
                            value={leatherPackMesoPrice}
                            onChange={(event) => {
                              const value = Number(event.target.value);
                              setLeatherPackMesoPrice(
                                Number.isFinite(value) ? Math.max(0, value) : 0,
                              );
                            }}
                          />
                          <span>枫币 / 10个</span>
                        </dd>
                      </div>
                    )}
                    <div>
                      <dt>枫币成本</dt>
                      <dd>
                        {item.mesoCost === null ? '待补充' : `${format(item.mesoCost, 2)} 枫币`}
                      </dd>
                    </div>
                    <div>
                      <dt>人民币成本</dt>
                      <dd>{item.rmbCost === null ? '待补充' : `¥ ${format(item.rmbCost, 3)}`}</dd>
                    </div>
                  </dl>
                </article>
              ))}
          {upgradePowderSources.map((source) => (
            <article
              className="powder-source-card"
              key={source.id}
              style={{ order: upgradeMaterialOrder.get(source.id) }}
            >
              <div className="source-product">
                <img
                  className={source.id === 'armor-stone' ? 'detail-item-image' : ''}
                  src={source.image}
                  alt={`${source.name}商品图`}
                />
                <div>
                  <div className="source-heading">
                    <span>{source.shop}</span>
                    <small>升级材料</small>
                  </div>
                  <h3>
                    {source.name} ×{source.quantity}
                  </h3>
                </div>
              </div>
              <div className="experience-showcase">
                <div>
                  <small>整组总经验</small>
                  <strong>{format(source.totalExperience)}</strong>
                  <em>经验</em>
                </div>
                <div className="efficiency">
                  <small>每元经验</small>
                  <strong>{format(source.experiencePerRmb)}</strong>
                  <em>经验 / 元</em>
                </div>
              </div>
              <dl>
                <div>
                  <dt>单个经验</dt>
                  <dd>{format(source.experienceEach ?? 0)}</dd>
                </div>
                <div className="source-price-field">
                  <dt>红水晶价格</dt>
                  <dd>
                    <input
                      type="number"
                      min="0"
                      step="1"
                      value={source.redDiamondCost}
                      onChange={(event) => updateSourcePrice(source.id, event.target.value)}
                    />
                    <span>红水晶</span>
                  </dd>
                </div>
                <div>
                  <dt>每红水晶经验</dt>
                  <dd>{format(source.experiencePerDiamond, 1)}</dd>
                </div>
                <div>
                  <dt>人民币成本</dt>
                  <dd>¥ {format(source.rmbCost, 2)}</dd>
                </div>
              </dl>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}

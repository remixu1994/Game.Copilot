import { useMemo, useState } from 'react';
import { calculateSkillDps, type CombatBonuses, type PanelStats, type SkillStats } from './dpsCalculator';
import { sitePath } from './sitePaths';

const defaultPanel: PanelStats = { propertyAttack: 1_334_088, mainStat: 73_789, subStat: 47_937, baseAttack: 11_511, damagePercent: 47.8, bossDamagePercent: 68.5, criticalDamagePercent: 210, finalDamagePercent: 36.6, maxDamage: 124_167_624, ignoreDefensePercent: 81.81, superIgnoreDefensePercent: 36, bossDefensePercent: 155, overflowConversionPercent: 5 };
const defaultBonuses: CombatBonuses = { attackPercent: 58, damagePercent: 69, bossDamagePercent: 59, criticalDamagePercent: 93.6, finalDamagePercent: 21.5 };
const defaultSkill: SkillStats = { name: '四连标', multiplierPercent: 185, hitCount: 3_706, attackPercent: 0, damagePercent: 100, bossDamagePercent: 0, criticalDamagePercent: 0, finalDamagePercent: 0, ignoreDefensePercent: 0, specialMultiplier: 1 };
const formatInteger = (value: number) => Math.round(value).toLocaleString('zh-CN');
const formatDamage = (value: number) => value >= 100_000_000 ? `${(value / 100_000_000).toFixed(3)} 亿` : value >= 10_000 ? `${(value / 10_000).toFixed(2)} 万` : formatInteger(value);
const multiplier = (value: number) => `×${value.toFixed(value >= 10 ? 4 : 3)}`;

type NumberFieldProps = { label: string; value: number; suffix?: string; note?: string; onChange: (value: number) => void };
function NumberField({ label, value, suffix, note, onChange }: NumberFieldProps) {
  return <label className="dps-field"><span>{label}</span>{note && <small>{note}</small>}<span className="dps-input"><input type="number" value={value} onChange={(event) => onChange(Number(event.target.value) || 0)} />{suffix && <em>{suffix}</em>}</span></label>;
}
function FactorRow({ index, title, detail, value, muted = false }: { index: number; title: string; detail: string; value: number; muted?: boolean }) {
  return <li className={muted ? 'factor-muted' : ''}><span className="factor-index">{index}</span><div><strong>{title}</strong><small>{detail}</small></div><b>{multiplier(value)}</b></li>;
}

export default function App() {
  const [panel, setPanel] = useState(defaultPanel);
  const [bonuses, setBonuses] = useState(defaultBonuses);
  const [skill, setSkill] = useState(defaultSkill);
  const [duration, setDuration] = useState(120);
  const result = useMemo(() => calculateSkillDps(panel, bonuses, skill, duration), [panel, bonuses, skill, duration]);
  const setPanelValue = (key: keyof PanelStats, value: number) => setPanel((current) => ({ ...current, [key]: value }));
  const setBonusValue = (key: keyof CombatBonuses, value: number) => setBonuses((current) => ({ ...current, [key]: value }));
  const setSkillValue = (key: keyof SkillStats, value: number) => setSkill((current) => ({ ...current, [key]: value }));
  const damageTotal = panel.damagePercent + bonuses.damagePercent + skill.damagePercent;
  const bossTotal = panel.bossDamagePercent + bonuses.bossDamagePercent + skill.bossDamagePercent;
  const criticalTotal = panel.criticalDamagePercent + bonuses.criticalDamagePercent + skill.criticalDamagePercent;
  const finalTotal = panel.finalDamagePercent + bonuses.finalDamagePercent + skill.finalDamagePercent;
  const isCapped = result.beforeDefenseDamage > panel.maxDamage;

  return <main className="simulator-shell">
    <header className="topbar"><a className="brand-mark" href={sitePath('/')}>Maple<span>Lab</span></a><div className="topbar-title"><span className="red-dot" />伤害 DPS 模拟器</div><a className="ghost-button" href={sitePath('/')}>返回工具目录</a></header>
    <nav className="step-nav" aria-label="模拟器步骤"><span className="step active"><b>1</b>面板详情</span><span className="step-line" /><span className="step active"><b>2</b>逐技能核对</span><span className="step-line" /><span className="step active"><b>3</b>DPS 汇总</span></nav>

    <section className="panel base-panel">
      <div className="panel-heading"><div><span className="chapter">1</span><div><h1>面板详情</h1><p>按关闭临时增益后的战斗力面板填写；常驻职业加成单独列出，避免同一项重复计算。</p></div></div></div>
      <div className="dps-field-grid">
        <NumberField label="属性攻击力" value={panel.propertyAttack} onChange={(value) => setPanelValue('propertyAttack', value)} />
        <NumberField label="主属性" value={panel.mainStat} onChange={(value) => setPanelValue('mainStat', value)} />
        <NumberField label="副属性" value={panel.subStat} onChange={(value) => setPanelValue('subStat', value)} />
        <NumberField label="基础攻击力" value={panel.baseAttack} onChange={(value) => setPanelValue('baseAttack', value)} />
        <NumberField label="伤害增加" value={panel.damagePercent} suffix="%" onChange={(value) => setPanelValue('damagePercent', value)} />
        <NumberField label="领主攻击力" value={panel.bossDamagePercent} suffix="%" onChange={(value) => setPanelValue('bossDamagePercent', value)} />
        <NumberField label="暴击伤害" value={panel.criticalDamagePercent} suffix="%" onChange={(value) => setPanelValue('criticalDamagePercent', value)} />
        <NumberField label="增加最终伤害" value={panel.finalDamagePercent} suffix="%" onChange={(value) => setPanelValue('finalDamagePercent', value)} />
        <NumberField label="最大伤害" value={panel.maxDamage} onChange={(value) => setPanelValue('maxDamage', value)} />
        <NumberField label="面板无视防御率" value={panel.ignoreDefensePercent} suffix="%" onChange={(value) => setPanelValue('ignoreDefensePercent', value)} />
        <NumberField label="其中超无视" value={panel.superIgnoreDefensePercent} suffix="%" note="仅标记构成，不重复叠加" onChange={(value) => setPanelValue('superIgnoreDefensePercent', value)} />
        <NumberField label="BOSS 防御率" value={panel.bossDefensePercent} suffix="%" onChange={(value) => setPanelValue('bossDefensePercent', value)} />
        <NumberField label="溢出转化率" value={panel.overflowConversionPercent} suffix="%" onChange={(value) => setPanelValue('overflowConversionPercent', value)} />
      </div>
      <div className="research-strip">
        <div><small>有效主属性</small><strong>{result.effectiveMainStat.toLocaleString('zh-CN', { maximumFractionDigits: 2 })}</strong><span>主属性 + 副属性 ÷ 4</span></div>
        <div><small>属性系数</small><strong>{result.attributeCoefficient.toFixed(4)}</strong><span>主 ÷ 1250 + 副 ÷ 5000</span></div>
        <div><small>裸攻基础</small><strong>{result.nakedAttack.toLocaleString('zh-CN', { maximumFractionDigits: 2 })}</strong><span>属性系数 × 基础攻击力</span></div>
        <div><small>推算攻击力</small><strong>{result.inferredAttackPercent.toFixed(2)}%</strong><span>由属性攻击力反推</span></div>
      </div>
      <div className="marginal-analysis">
        <div><span>当前兑换临界线</span><strong>1 基础攻击力 ≈ {result.attackEquivalentMainStat.toFixed(2)} 主属性 ≈ {result.attackEquivalentSubStat.toFixed(2)} 副属性</strong></div>
        <table><thead><tr><th>提升方案</th><th>裸攻提升率</th></tr></thead><tbody>
          <tr><td>+10 基础攻击力</td><td>{(result.baseAttackGainPerPointPercent * 10).toFixed(5)}%</td></tr>
          <tr><td>+100 主属性</td><td>{(result.mainStatGainPerPointPercent * 100).toFixed(5)}%</td></tr>
          <tr><td>+100 副属性</td><td>{(result.subStatGainPerPointPercent * 100).toFixed(5)}%</td></tr>
          <tr><td>+1000 主属性</td><td>{(result.mainStatGainPerPointPercent * 1000).toFixed(4)}%</td></tr>
          <tr><td>+100 基础攻击力</td><td>{(result.baseAttackGainPerPointPercent * 100).toFixed(4)}%</td></tr>
        </tbody></table>
      </div>
      <details className="bonus-editor"><summary><span>隐士常驻加成</span><b>展开校正</b></summary><p>默认值用于复现截图中的乘区。若面板数值已包含其中某项，请把对应加成改为 0。</p><div className="dps-field-grid bonus-grid">
        <NumberField label="攻击力" value={bonuses.attackPercent} suffix="%" onChange={(value) => setBonusValue('attackPercent', value)} />
        <NumberField label="伤害" value={bonuses.damagePercent} suffix="%" onChange={(value) => setBonusValue('damagePercent', value)} />
        <NumberField label="领主" value={bonuses.bossDamagePercent} suffix="%" onChange={(value) => setBonusValue('bossDamagePercent', value)} />
        <NumberField label="暴击伤害" value={bonuses.criticalDamagePercent} suffix="%" onChange={(value) => setBonusValue('criticalDamagePercent', value)} />
        <NumberField label="最终伤害" value={bonuses.finalDamagePercent} suffix="%" onChange={(value) => setBonusValue('finalDamagePercent', value)} />
      </div></details>
    </section>

    <section className="panel verification-panel">
      <div className="panel-heading"><div><span className="chapter pale">2</span><div><h2>逐技能核对</h2><p>当前先核对四连标；每个乘区保留来源，方便定位重复计算。</p></div></div><strong className="live-result">{formatDamage(result.damagePerHit)}<small>实际单段</small></strong></div>
      <div className="skill-setup">
        <NumberField label="技能倍率" value={skill.multiplierPercent} suffix="%" onChange={(value) => setSkillValue('multiplierPercent', value)} />
        <NumberField label="统计段数" value={skill.hitCount} onChange={(value) => setSkillValue('hitCount', value)} />
        <NumberField label="统计时长" value={duration} suffix="秒" onChange={setDuration} />
        <NumberField label="技能伤害" value={skill.damagePercent} suffix="%" onChange={(value) => setSkillValue('damagePercent', value)} />
        <NumberField label="技能无视" value={skill.ignoreDefensePercent} suffix="%" onChange={(value) => setSkillValue('ignoreDefensePercent', value)} />
      </div>
      <div className="formula-lead"><strong>{skill.name}</strong><span>裸攻 {formatDamage(result.nakedAttack)} × 技能倍率 {skill.multiplierPercent}%</span></div>
      <ol className="factor-list">
        <FactorRow index={1} title="攻击力区" detail={`常驻 ${bonuses.attackPercent}% + 推算攻击 ${result.inferredAttackPercent.toFixed(2)}% + 技能 ${skill.attackPercent}%`} value={result.attackMultiplier} />
        <FactorRow index={2} title="伤害区" detail={`面板与常驻 ${damageTotal - skill.damagePercent}% + 技能 ${skill.damagePercent}%`} value={result.damageMultiplier} />
        <FactorRow index={3} title="领主区" detail={`面板与常驻 ${bossTotal - skill.bossDamagePercent}% + 技能 ${skill.bossDamagePercent}%`} value={result.bossMultiplier} />
        <FactorRow index={4} title="暴击均值" detail={`max(${criticalTotal}%, 100%) + 浮动中点 15%`} value={result.criticalMultiplier} />
        <FactorRow index={5} title="最终伤害区" detail={`面板与常驻 ${finalTotal - skill.finalDamagePercent}% + 技能 ${skill.finalDamagePercent}%`} value={result.finalDamageMultiplier} />
        <FactorRow index={6} title="业火分魂" detail="本技能未启用" value={result.specialMultiplier} muted />
      </ol>
      <div className="combined-factor"><span>乘区结果<small>全部乘区连乘</small></span><strong>{multiplier(result.combinedMultiplier)}</strong></div>
      <div className="verification-grid">
        <div><span>防御前单段</span><strong>{formatDamage(result.beforeDefenseDamage)}</strong><small>裸攻 × 倍率 × 全部乘区</small></div>
        <div className={isCapped ? 'is-capped' : ''}><span>大伤与溢出</span><strong>{formatDamage(result.cappedDamage + result.overflowDamage)}</strong><small>{isCapped ? `触顶，溢出折算 ${formatDamage(result.overflowDamage)}` : `低于上限 ${formatDamage(panel.maxDamage)}`}</small></div>
        <div><span>无视与防御区</span><strong>{multiplier(result.defenseMultiplier)}</strong><small>实际无视 {result.effectiveIgnoreDefensePercent.toFixed(2)}%</small></div>
      </div>
    </section>

    <section className="panel result-panel">
      <div className="panel-heading"><div><span className="chapter">3</span><div><h2>DPS 汇总</h2><p>{skill.hitCount.toLocaleString('zh-CN')} 段 / {duration} 秒，结果会随上方输入实时更新。</p></div></div><span className="status-dot">实时计算</span></div>
      <div className="result-hero"><div><small>实际单段</small><strong>{formatDamage(result.damagePerHit)}</strong></div><div className="big-dps"><small>预计平均 DPS</small><strong>{formatDamage(result.dps)}<em> / 秒</em></strong></div></div>
      <div className="result-grid"><div><small>技能总伤害</small><strong>{formatDamage(result.totalDamage)}</strong></div><div><small>防御损失</small><strong>{((1 - result.defenseMultiplier) * 100).toFixed(2)}%</strong></div><div><small>乘区总倍率</small><strong>{multiplier(result.combinedMultiplier)}</strong></div></div>
    </section>
  </main>;
}

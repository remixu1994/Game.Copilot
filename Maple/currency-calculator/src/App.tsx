import { useMemo, useState } from 'react';

type Field = { label: string; hint?: string; value: string; suffix?: string };
const baseFields: Field[] = [
  { label: '属性攻击力', hint: '110.6 万', value: '1105665' }, { label: '主属性', hint: '6.7 万', value: '66607' },
  { label: '副属性', hint: '4.3 万', value: '43173' }, { label: '基础攻击力', hint: '1.1 万', value: '10822' },
  { label: '伤害增加', value: '42.8', suffix: '%' }, { label: '领主攻击力', value: '52.4', suffix: '%' },
  { label: '暴击伤害', value: '215.3', suffix: '%' }, { label: '增加最终伤害', value: '26.7', suffix: '%' },
  { label: '推荐攻击力%', hint: '工具会帮你推的，不用填', value: '65.0', suffix: '%' },
  { label: '溢出转化率', hint: '超大伤害按技能比例折算 · 默认 100%', value: '100', suffix: '%' },
];
const skills = ['四连标', '达克鲁卷轴', '隐士标记', '飞闪起爆符', '手里剑', '四季', '闪击', '突袭', '毒爆', '毒液', '赤红', '模糊'];

function FieldRow({ field, index, onChange, onHelp }: { field: Field; index: number; onChange: (value: string) => void; onHelp: () => void }) {
  return <label className="field-row"><span className="field-number">#{index + 1}</span><span className="field-copy"><span className="field-label">{field.label}<button className="help-icon inline-help" type="button" onClick={onHelp} aria-label={`${field.label}说明`}>?</button></span>{field.hint && <small>{field.hint}</small>}</span><span className="input-wrap"><input value={field.value} onChange={(event) => onChange(event.target.value)} inputMode="decimal" />{field.suffix && <em>{field.suffix}</em>}</span></label>;
}

function App() {
  const [fields, setFields] = useState(baseFields); const [duration, setDuration] = useState('120'); const [mode, setMode] = useState<'custom' | 'preset'>('custom'); const [openSkill, setOpenSkill] = useState(0); const [helpField, setHelpField] = useState<string | null>(null);
  const dps = useMemo(() => { const attack = Number(fields[0].value.replace(/,/g, '')) || 0; const damage = Number(fields[4].value) || 0; return Math.round(attack * (1 + damage / 100) * 1.01); }, [fields]);
  const updateField = (index: number, value: string) => setFields((current) => current.map((field, fieldIndex) => fieldIndex === index ? { ...field, value } : field));
  return <main className="simulator-shell">
    <header className="topbar"><div className="brand-mark">Maple<span>Lab</span></div><div className="topbar-title"><span className="red-dot" />伤害 DPS 模拟器</div><button className="ghost-button" type="button">说明</button></header>
    <nav className="step-nav" aria-label="模拟器步骤"><span className="step active"><b>1</b>基础面板</span><span className="step-line" /><span className="step"><b>2</b>技能数据</span><span className="step-line" /><span className="step"><b>3</b>模拟结果</span></nav>
    <section className="panel base-panel"><div className="panel-heading"><div><span className="chapter">1</span><div><h1>裸装基础面板</h1><p>请整洁地写入面板属性。技能、关掉和限时 Buff，队友光环不别开；常驻被动不用管。</p></div></div><span className="help-icon">?</span></div><div className="field-list">{fields.map((field, index) => <FieldRow key={field.label} field={field} index={index} onChange={(value) => updateField(index, value)} onHelp={() => setHelpField(field.label)} />)}</div></section>
    <section className="panel skills-panel"><div className="panel-heading skills-heading"><div><span className="chapter">2</span><div><h2>技能详细数据</h2><p>输入技能等级和释放频率，计算每个技能在统计时长内的贡献。</p></div></div><div className="mode-switch"><button className={mode === 'custom' ? 'selected' : ''} onClick={() => setMode('custom')}>自定义</button><button className={mode === 'preset' ? 'selected preset' : 'preset'} onClick={() => setMode('preset')}>套用中 · 隐士⌄</button></div></div><label className="duration-row"><span><strong>统计时长</strong><small>套用模板是 120 秒，自己填就按你填的算</small></span><span className="input-wrap"><input value={duration} onChange={(event) => setDuration(event.target.value)} /><em>秒</em></span></label><p className="warning">请根据自身三台一核、核心等级和超级技能点法，填写相关技能的无视 / 终伤 / 爆伤等数值。</p><div className="skill-list">{skills.map((skill, index) => <div className={`skill-item ${openSkill === index ? 'expanded' : ''}`} key={skill}><button type="button" onClick={() => setOpenSkill(openSkill === index ? -1 : index)}><span>技能 {index + 1}</span><strong>{skill}</strong><b>⌄</b></button>{openSkill === index && <SkillDetail skill={skill} index={index} />}</div>)}</div></section>
    <section className="panel result-panel"><div className="result-head"><div><span className="chapter">3</span><div><h2>模拟结果</h2><p>根据当前面板与技能配置，实时查看爆发和常态输出。</p></div></div><span className="status-dot">实时计算中</span></div><div className="result-hero"><div><small>统计时长</small><strong>{duration || 0}<em>秒</em></strong></div><div className="big-dps"><small>预计平均 DPS</small><strong>{dps.toLocaleString('zh-CN')}<em> / 秒</em></strong></div></div><div className="result-grid"><div><small>爆发平均单段</small><strong>1.15 亿</strong></div><div><small>常态平均单段</small><strong>6480.3 万</strong></div><div><small>技能总段数</small><strong>3,706</strong></div></div></section>
    {helpField && <div className="modal-backdrop" onClick={() => setHelpField(null)}><section className="help-modal" role="dialog" aria-modal="true" aria-labelledby="help-title" onClick={(event) => event.stopPropagation()}><h2 id="help-title">{helpField}</h2><p>二属性攻击力 +（基础攻击力 ×（主属性/1250 + 副属性/3500））<br />− 1。工具替你倒推出的「攻击力%总和」，方便对比堆攻击底 / 领主底。「不用填」。</p><button type="button" onClick={() => setHelpField(null)}>知道了</button></section></div>}
  </main>;
}
function SkillDetail({ skill, index }: { skill: string; index: number }) { return <div className="skill-detail"><div className="detail-title"><span>技能与频率</span><small>决定这项技能打多少段</small></div><div className="detail-fields"><label>技能名称<span>{skill}</span></label><label>技能单段倍率<span>{index === 0 ? '185' : '100'}<em>%</em></span></label><label>触发次数<i>?</i><span>{index === 0 ? '3706' : '0'}</span></label><label>单次段数<i>?</i><span>1</span></label></div><div className="detail-title"><span>技能专属加成</span><small>只填面板里还没算进去的数值</small></div><div className="detail-fields compact"><label>技能伤害增加<span>100<em>%</em></span></label><label>技能领主攻击力<span>0<em>%</em></span></label><label>技能暴击伤害<span>0<em>%</em></span></label><label>技能最终伤害<span>0<em>%</em></span></label></div></div>; }
export default App;

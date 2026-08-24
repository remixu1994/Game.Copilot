import { useEffect, useMemo, useState } from 'react';
import './level-tracker.css';

type Source = { name: string; daily: number | null; weekly: number | null; kind: 'daily' | 'weekly' };
type WeekPlan = { id: string; period: string; label: string; target: string; dailyDays: number; dailyProgress: Array<number | null>; weeklyDone: boolean; weeklyEligible: boolean; note: string };

const sources: Source[] = [
  { name: '怪物乐园 ×3', daily: 353.26, weekly: 2472.82, kind: 'daily' },
  { name: '委托双倍 ×3', daily: 325.2, weekly: 2276.4, kind: 'daily' },
  { name: '挂机 6 小时', daily: 226.8, weekly: 1587.6, kind: 'daily' },
  { name: '自动战斗任务', daily: 177.6, weekly: 1243.2, kind: 'daily' },
  { name: '每日任务', daily: 135, weekly: 945, kind: 'daily' },
  { name: '领主经验', daily: 114.9, weekly: 804.29, kind: 'daily' },
  { name: '宝石副本 ×3', daily: 8.31, weekly: 58.14, kind: 'daily' },
  { name: '海兵王', daily: 2.849, weekly: 19.943, kind: 'daily' },
  { name: '精英副本 ×3', daily: 2.38, weekly: 16.66, kind: 'daily' },
  { name: '宝石特殊副本', daily: 2.304, weekly: 16.128, kind: 'daily' },
  { name: '材料本 ×3', daily: 1.14, weekly: 7.99, kind: 'daily' },
  { name: '金字塔 ×2', daily: 0.062, weekly: 0.434, kind: 'daily' },
  { name: '神秘河周本', daily: null, weekly: 1640.31, kind: 'weekly' },
  { name: '每周任务', daily: null, weekly: 1022, kind: 'weekly' },
];

const dailyTotal = 1731.13;
const weeklyBonus = 2662.31;
const level200Exp = 3718527554105;
const formatExp = (value: number) => `${value.toLocaleString('zh-CN', { maximumFractionDigits: 2 })} 亿`;

const initialPlans: WeekPlan[] = [
  { id: 'w1', period: '08.24 — 08.30', label: '第 1 周', target: '203 级等效', dailyDays: 7, dailyProgress: Array(7).fill(null), weeklyDone: true, weeklyEligible: true, note: '神秘河周本、08.24 相关任务已完成' },
  { id: 'w2', period: '08.31 — 09.06', label: '第 2 周', target: '205 级等效', dailyDays: 7, dailyProgress: Array(7).fill(null), weeklyDone: false, weeklyEligible: true, note: '完整执行每日 + 每周来源' },
  { id: 'w3', period: '09.07 — 09.13', label: '第 3 周', target: '206 级等效', dailyDays: 7, dailyProgress: Array(7).fill(null), weeklyDone: false, weeklyEligible: true, note: '目标周，完成后应已达到 206' },
  { id: 'w4', period: '09.14 — 09.15', label: '截止缓冲', target: '206 级等效', dailyDays: 2, dailyProgress: [null, null, null, null, null, null, null], weeklyDone: true, weeklyEligible: false, note: '保留 2 天作为补做与观察窗口' },
];

export default function LevelTrackerPage() {
  const [level, setLevel] = useState('200');
  const [progress, setProgress] = useState('87.28');
  const [plans, setPlans] = useState<WeekPlan[]>(() => {
    const saved = window.localStorage.getItem('maplelab-level-tracker-plans');
    if (!saved) return initialPlans;
    const parsed = JSON.parse(saved) as Array<Partial<WeekPlan>>;
    return parsed.map((plan) => ({ ...plan, dailyProgress: plan.dailyProgress ?? Array(7).fill(null) })) as WeekPlan[];
  });
  const [showSources, setShowSources] = useState(false);

  useEffect(() => { window.localStorage.setItem('maplelab-level-tracker-plans', JSON.stringify(plans)); }, [plans]);

  const totals = useMemo(() => {
    const plannedDaily = plans.reduce((sum, plan) => {
      const hasDailyInput = plan.dailyProgress.some((value) => value !== null);
      const dailyExp = hasDailyInput ? plan.dailyProgress.reduce<number>((daySum, value) => daySum + ((value ?? 0) / 100) * dailyTotal, 0) : plan.dailyDays * dailyTotal;
      return sum + dailyExp;
    }, 0);
    const plannedWeekly = plans.reduce((sum, plan) => sum + (plan.weeklyEligible && !plan.weeklyDone ? weeklyBonus : 0), 0);
    return { plannedDaily, plannedWeekly, total: plannedDaily + plannedWeekly };
  }, [plans]);
  const currentExp = Math.round(level200Exp * (Math.max(0, Math.min(100, Number(progress) || 0)) / 100));

  const toggleWeekly = (id: string) => setPlans((current) => current.map((plan) => plan.id === id ? { ...plan, weeklyDone: !plan.weeklyDone } : plan));
  const updateDays = (id: string, value: string) => setPlans((current) => current.map((plan) => plan.id === id ? { ...plan, dailyDays: Math.max(0, Math.min(7, Number(value) || 0)) } : plan));
  const updateDailyProgress = (id: string, dayIndex: number, value: string) => setPlans((current) => current.map((plan) => {
    if (plan.id !== id) return plan;
    const dailyProgress = [...plan.dailyProgress];
    dailyProgress[dayIndex] = value === '' ? null : Math.max(0, Math.min(100, Number(value) || 0));
    return { ...plan, dailyProgress };
  }));

  return <main className="tracker-shell">
    <header className="tracker-header">
      <a className="tracker-brand" href="/">Maple<span>Lab</span></a>
      <div className="tracker-heading"><span className="tracker-eyebrow">PROGRESSION / WEEKLY PLAN</span><h1>等级跟踪器</h1><p>把每天的经验来源变成一张可以执行、可以复盘的升级计划。</p></div>
      <a className="tracker-back" href="/">返回工具目录 ↗</a>
    </header>

    <section className="tracker-overview">
      <div className="overview-main"><span className="tracker-eyebrow">TARGET / 09.15</span><h2>在 9 月 15 日前<br /><em>到达 206 级。</em></h2><p>当前活动按“自然升级 +2 级”计算：每完成 1 个自然等级，按 3 个等级刻度追踪。</p><div className="current-inputs"><label><span>当前等级</span><input type="number" min="1" value={level} onChange={(event) => setLevel(event.target.value)} /></label><label><span>经验条</span><input type="number" min="0" max="100" step="0.01" value={progress} onChange={(event) => setProgress(event.target.value)} /><em>%</em></label></div><div className="progress-track"><span style={{ width: `${Math.min(100, Number(progress) || 0)}%` }} /></div><div className="progress-meta"><span>Lv. {level} · {progress}% · 当前约 {currentExp.toLocaleString('zh-CN')} 经验</span><b>目标 Lv. 206</b></div></div>
      <div className="overview-stats"><div><span>计划周期</span><strong>4 个</strong><small>08.24 — 09.15</small></div><div><span>预计可获得</span><strong>{(totals.total / 10000).toFixed(2)} 万亿</strong><small>每日来源 + 周本</small></div><div><span>200 级升级经验</span><strong>{(level200Exp / 1e12).toFixed(3)} 万亿</strong><small>{level200Exp.toLocaleString('zh-CN')} 经验</small></div></div>
    </section>

      <section className="tracker-plan"><div className="section-intro"><div><span className="tracker-eyebrow">01 / EXECUTION PLAN</span><h2>按周执行</h2></div><p>先完成每日来源，再在周末确认周本。每天可填实际经验条，按 100% = {formatExp(dailyTotal)} 折算。</p></div><div className="plan-table"><div className="plan-row plan-head"><span>周期</span><span>目标</span><span>每日来源</span><span>周本</span><span>预计经验</span><span>状态</span></div>{plans.map((plan) => { const hasDailyInput = plan.dailyProgress.some((value) => value !== null); const dailyExp = hasDailyInput ? plan.dailyProgress.reduce<number>((sum, value) => sum + ((value ?? 0) / 100) * dailyTotal, 0) : plan.dailyDays * dailyTotal; const exp = dailyExp + (plan.weeklyEligible && !plan.weeklyDone ? weeklyBonus : 0); const done = plan.weeklyDone && plan.weeklyEligible; return <div className={`plan-block ${plan.weeklyDone ? 'has-done' : ''}`} key={plan.id}><div className="plan-row"><div className="plan-period"><small>{plan.label}</small><strong>{plan.period}</strong><em>{plan.note}</em></div><strong className="plan-target">{plan.target}</strong><label className="day-input"><input type="number" min="0" max="7" value={plan.dailyDays} onChange={(event) => updateDays(plan.id, event.target.value)} /><span>/ 7 天</span></label>{plan.weeklyEligible ? <button className={`check-button ${plan.weeklyDone ? 'checked' : ''}`} type="button" onClick={() => toggleWeekly(plan.id)} aria-label={`${plan.label}周本${plan.weeklyDone ? '已完成' : '未完成'}`}>{plan.weeklyDone ? '✓ 已完成' : '○ 待完成'}</button> : <span className="check-button not-applicable">— 不适用</span>}<strong className="plan-exp">{formatExp(exp)}</strong><span className={`plan-status ${done ? 'complete' : ''}`}>{plan.weeklyEligible ? (done ? '完成' : '待执行') : '缓冲'}</span></div><div className="daily-log"><span className="daily-log-title">每日经验条 <small>{hasDailyInput ? '按实际输入计算' : '未填写时使用计划值'}</small></span>{plan.dailyProgress.map((value, dayIndex) => <label key={`${plan.id}-${dayIndex}`}><span>{plan.period.slice(0, 5)} +{dayIndex + 1}日</span><input type="number" min="0" max="100" step="0.01" placeholder="—" value={value ?? ''} onChange={(event) => updateDailyProgress(plan.id, dayIndex, event.target.value)} /><em>%</em></label>)}</div></div>; })}</div></section>

    <section className="tracker-totals"><div><span>每日完整执行</span><strong>{formatExp(dailyTotal)}</strong><small>× 7 = {formatExp(dailyTotal * 7)} / 周</small></div><div><span>每周额外来源</span><strong>{formatExp(weeklyBonus)}</strong><small>神秘河周本 + 每周任务</small></div><div><span>当前计划余量</span><strong className="red-number">{formatExp(totals.total)}</strong><small>根据上方勾选动态更新</small></div></section>

    <section className="source-section"><button className="source-toggle" type="button" onClick={() => setShowSources(!showSources)}><span><span className="tracker-eyebrow">02 / EXPERIENCE SOURCES</span><strong>每日经验来源明细</strong></span><b>{showSources ? '收起 ↑' : '展开 ↓'}</b></button>{showSources && <div className="source-table"><div className="source-row source-head"><span>排名</span><span>来源</span><span>每日经验</span><span>周经验参考</span></div>{sources.map((source, index) => <div className={`source-row ${source.kind === 'weekly' ? 'weekly-source' : ''}`} key={source.name}><span className="source-rank">{index + 1}</span><strong>{source.name}</strong><span>{source.daily === null ? '—' : formatExp(source.daily)}</span><span>{source.weekly === null ? '—' : formatExp(source.weekly)}</span></div>)}<div className="source-row source-total"><span>Σ</span><strong>全部来源</strong><strong>{formatExp(dailyTotal)} / 天</strong><strong>{formatExp(dailyTotal * 7 + weeklyBonus)} / 完整周</strong></div></div>}</section>
    <footer className="tracker-footer"><span>LAST UPDATED / 2026.08.24</span><span>经验单位：亿 · 计划为估算值</span></footer>
  </main>;
}

import { useEffect, useMemo, useState } from 'react';
import { sitePath } from './sitePaths';
import {
  createDefaultRecords,
  defaultSettings,
  defaultSources,
  EXP_PER_YI,
  extrapolateLevel206Requirement,
  projectTracker,
  sourceExperience,
  sourceTotals,
  weekKey,
  type DailyRecord,
  type ExperienceSource,
  type ProgressPoint,
  type TrackerSettings,
} from './levelTrackerCalculator';
import './level-tracker.css';

interface StoredTracker {
  settings: TrackerSettings;
  sources: ExperienceSource[];
  records: DailyRecord[];
}

const STORAGE_KEY = 'maplelab-level-tracker-v9';
const LEGACY_STORAGE_KEY = 'maplelab-level-tracker-v8';
const OLDER_STORAGE_KEY = 'maplelab-level-tracker-v7';
const WEEKLY_REWARD_IDS = ['weekly-reward-1', 'weekly-reward-2', 'weekly-reward-3'];
const cloneDefaults = (): StoredTracker => {
  const settings = { ...defaultSettings, levelRequirements: { ...defaultSettings.levelRequirements } };
  const sources = defaultSources.map((source) => ({ ...source }));
  return { settings, sources, records: createDefaultRecords(settings, sources) };
};
const hydrateSettings = (settings: TrackerSettings): TrackerSettings => ({
  ...defaultSettings,
  ...settings,
  requiredExp: defaultSettings.requiredExp,
  levelRequirements: hydrateLevelRequirements(settings.levelRequirements),
});
const hydrateLevelRequirements = (requirements?: Record<string, number>) => {
  const stored = requirements ?? {};
  const level200 = stored['200'] ?? defaultSettings.levelRequirements['200'];
  const level203 = !stored['203'] || stored['203'] === 420_000_000_000
    ? defaultSettings.levelRequirements['203']
    : stored['203'];
  return {
    ...defaultSettings.levelRequirements,
    ...stored,
    200: level200,
    203: level203,
    206: stored['206'] ?? extrapolateLevel206Requirement(level200, level203),
  };
};
const hydrateSources = (storedSources: ExperienceSource[]) => {
  const stored = new Map(storedSources.map((source) => [source.id, source]));
  return defaultSources.map((source) => stored.has(source.id) ? { ...source, ...stored.get(source.id) } : { ...source });
};
const migrateLegacySources = (storedSources: ExperienceSource[]) => {
  const stored = new Map(storedSources.map((source) => [source.id, source]));
  return defaultSources.map((source) => ({ ...source, enabled: stored.get(source.id)?.enabled ?? source.enabled }));
};
const hydrateRecords = (settings: TrackerSettings, sources: ExperienceSource[], records: DailyRecord[]) => {
  const baselineIds = sources.filter((source) => !source.optionalPurchase).map((source) => source.id);
  return records.map((record) => record.date === settings.startDate && !record.baselineIncludedSourceIds
    ? { ...record, baselineIncludedSourceIds: baselineIds }
    : record);
};
const addDefaultWeeklyPurchases = (settings: TrackerSettings, sources: ExperienceSource[], records: DailyRecord[]) => {
  const purchaseIds = sources.filter((source) => source.optionalPurchase).map((source) => source.id);
  const finalWeek = weekKey(settings.endDate);
  const unavailableFinalWeekIds = new Set(sources.filter((source) => source.group === 'weekly-reward' && (source.rewardTier ?? source.optionalPurchase?.rewardTier ?? 0) > 1).map((source) => source.id));
  const lastDateByWeek = new Map<string, string>();
  records.forEach((record) => lastDateByWeek.set(weekKey(record.date), record.date));
  const firstWeek = weekKey(settings.startDate);
  return records.map((record) => {
    const key = weekKey(record.date);
    const isPurchaseDate = key === firstWeek ? record.date === settings.startDate : lastDateByWeek.get(key) === record.date;
    const completedSourceIds = key === finalWeek ? record.completedSourceIds.filter((id) => !unavailableFinalWeekIds.has(id)) : record.completedSourceIds;
    if (!isPurchaseDate) return completedSourceIds === record.completedSourceIds ? record : { ...record, completedSourceIds };
    const availablePurchases = key === finalWeek ? purchaseIds.filter((id) => !unavailableFinalWeekIds.has(id)) : purchaseIds;
    return { ...record, completedSourceIds: [...new Set([...completedSourceIds, ...availablePurchases])] };
  });
};

function loadTracker(): StoredTracker {
  try {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved) as StoredTracker;
      if (parsed.settings && Array.isArray(parsed.sources) && Array.isArray(parsed.records)) {
        const sources = hydrateSources(parsed.sources);
        const settings = hydrateSettings(parsed.settings);
        return { ...parsed, settings, sources, records: hydrateRecords(settings, sources, parsed.records) };
      }
    }
    const legacySaved = window.localStorage.getItem(LEGACY_STORAGE_KEY) ?? window.localStorage.getItem(OLDER_STORAGE_KEY);
    if (!legacySaved) return cloneDefaults();
    const legacy = JSON.parse(legacySaved) as StoredTracker;
    if (!legacy.settings || !Array.isArray(legacy.sources) || !Array.isArray(legacy.records)) return cloneDefaults();
    const settings = hydrateSettings(legacy.settings);
    const sources = migrateLegacySources(legacy.sources);
    const records = legacy.records.map((record) => ({
      ...record,
      completedSourceIds: record.completedSourceIds.includes('weekly-task')
        ? [...record.completedSourceIds.filter((id) => id !== 'weekly-task'), ...WEEKLY_REWARD_IDS]
        : record.completedSourceIds,
    }));
    const hydratedRecords = hydrateRecords(settings, sources, records);
    return { settings, sources, records: addDefaultWeeklyPurchases(settings, sources, hydratedRecords) };
  } catch {
    return cloneDefaults();
  }
}

const formatDate = (date: string) => {
  const [, month, day] = date.split('-');
  return `${Number(month)}月${Number(day)}日`;
};
const formatShortDate = (date: string) => date.slice(5).replace('-', '.');
const formatProgress = (point: ProgressPoint) => `Lv.${point.level} · ${point.percent.toFixed(2)}%`;
const formatExp = (exp: number) => exp >= 1_000_000_000_000
  ? `${(exp / 1_000_000_000_000).toFixed(3)} 万亿`
  : `${(exp / EXP_PER_YI).toLocaleString('zh-CN', { maximumFractionDigits: 3 })} 亿`;
const formatYiExp = (exp: number) => `${(exp / EXP_PER_YI).toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} 亿`;
const sourceDisplayName = (source: ExperienceSource) => source.calculation?.kind === 'per-run' || source.calculation?.kind === 'per-ticket'
  ? `${source.name} ×${source.calculation.units}`
  : source.name;
const purchaseLabel = (source: ExperienceSource) => source.optionalPurchase
  ? source.optionalPurchase.currency === 'diamond'
    ? `${source.optionalPurchase.cost ?? 200} 钻石购买`
    : '金币购买'
  : null;

function TaskCheck({ source, checked, onToggle }: { source: ExperienceSource; checked: boolean; onToggle: () => void }) {
  return <label className={source.frequency === 'weekly' ? 'weekly-check' : ''}>
    <input type="checkbox" checked={checked} onChange={onToggle} />
    <span><strong>{sourceDisplayName(source)}</strong><small>{formatExp(sourceExperience(source))} · {source.frequency === 'weekly' ? '每周' : '每日'}</small></span>
  </label>;
}

function DailyTaskList({ sources, completedIds, onToggle }: { sources: ExperienceSource[]; completedIds: string[]; onToggle: (source: ExperienceSource) => void }) {
  const daily = sources.filter((source) => source.frequency === 'daily');
  const isChecked = (source: ExperienceSource) => completedIds.includes(source.id);

  return <section className="task-group daily-task-group">
    <header><span><b>01</b><strong>日常任务</strong></span><small>{daily.filter(isChecked).length} / {daily.length} 项完成</small></header>
    <div className="task-check-grid">{daily.map((source) => <TaskCheck key={source.id} source={source} checked={isChecked(source)} onToggle={() => onToggle(source)} />)}</div>
  </section>;
}

function WeekTaskPanel({ sources, completedIds, onToggle }: { sources: ExperienceSource[]; completedIds: string[]; onToggle: (source: ExperienceSource) => void }) {
  const weeklyDungeons = sources.filter((source) => source.group === 'weekly-dungeon');
  const weeklyRewards = sources.filter((source) => source.group === 'weekly-reward' && !source.optionalPurchase).sort((a, b) => (a.rewardTier ?? 0) - (b.rewardTier ?? 0));
  const isChecked = (source: ExperienceSource) => completedIds.includes(source.id);
  const completedCount = [...weeklyDungeons, ...weeklyRewards].filter(isChecked).length;
  const selectedWeeklyExp = sources.filter(isChecked).reduce((sum, source) => sum + sourceExperience(source), 0);

  return <div className="week-task-panel">
    <div className="week-task-panel-head"><span><b>WEEKLY</b><strong>本周周常汇总</strong></span><small>基础 {completedCount} / {weeklyDungeons.length + weeklyRewards.length} · 已选 {formatExp(selectedWeeklyExp)}</small></div>
    <div className="week-task-panel-grid">
      <section className="task-group weekly-dungeon-group">
        <header><span><b>01</b><strong>周副本</strong></span><small>{weeklyDungeons.filter(isChecked).length} / {weeklyDungeons.length}</small></header>
        <div className="task-check-grid weekly-dungeon-grid">{weeklyDungeons.map((source) => <TaskCheck key={source.id} source={source} checked={isChecked(source)} onToggle={() => onToggle(source)} />)}</div>
      </section>
      <section className="task-group weekly-reward-group">
        <header><span><b>02</b><strong>每周任务奖励</strong></span><small>基础领取 + 可选购买</small></header>
      <div className="weekly-reward-table">{weeklyRewards.map((base) => {
        const purchase = sources.find((source) => source.optionalPurchase?.rewardTier === base.rewardTier);
        return <div className="weekly-reward-row" key={base.id}>
          <span className="reward-tier"><small>奖励 {base.rewardTier}</small><strong>{formatExp(sourceExperience(base))}</strong></span>
          <label className="reward-choice base-reward"><input type="checkbox" checked={isChecked(base)} onChange={() => onToggle(base)} /><span><strong>基础领取</strong><small>每周任务完成奖励</small></span></label>
          {purchase && <label className="reward-choice purchase-reward"><input type="checkbox" checked={isChecked(purchase)} onChange={() => onToggle(purchase)} /><span><strong>额外购买一次</strong><small>{purchaseLabel(purchase)} · +{formatExp(sourceExperience(purchase))}</small></span></label>}
        </div>;
      })}</div>
      </section>
    </div>
  </div>;
}

function SourceParameterEditor({ source, onChange }: { source: ExperienceSource; onChange: (patch: Partial<ExperienceSource>) => void }) {
  if (source.calculation?.kind === 'per-minute') {
    return <div className="formula-inputs minute-formula"><label><span>每分钟经验</span><input aria-label={`${source.name}每分钟经验`} type="number" min="0" step="1" value={source.calculation.perUnitExp} onChange={(event) => onChange({ calculation: { ...source.calculation!, perUnitExp: Math.max(0, Number(event.target.value) || 0) } as ExperienceSource['calculation'] })} /></label><b>× {source.calculation.units} 分钟</b></div>;
  }
  if (source.calculation?.kind === 'per-ticket') {
    return <div className="formula-inputs ticket-formula"><label><span>单票经验</span><input aria-label={`${source.name}单票经验`} type="number" min="0" step="1" value={source.calculation.perUnitExp} onChange={(event) => onChange({ calculation: { ...source.calculation!, perUnitExp: Math.max(0, Number(event.target.value) || 0) } as ExperienceSource['calculation'] })} /></label><label className="small-formula"><span>每日票数</span><input aria-label={`${source.name}每日票数`} type="number" min="0" max="99" step="1" value={source.calculation.units} onChange={(event) => onChange({ calculation: { ...source.calculation!, units: Math.max(0, Number(event.target.value) || 0) } as ExperienceSource['calculation'] })} /></label><label className="small-formula"><span>装备加成</span><input aria-label={`${source.name}装备经验加成`} type="number" min="0" max="20" step="1" value={source.calculation.bonusPercent} onChange={(event) => onChange({ calculation: { ...source.calculation!, bonusPercent: Math.max(0, Math.min(20, Number(event.target.value) || 0)) } as ExperienceSource['calculation'] })} /><em>%</em></label></div>;
  }
  if (source.calculation?.kind === 'per-run') {
    return <div className="formula-inputs run-formula"><label><span>单次经验</span><input aria-label={`${source.name}单次经验`} type="number" min="0" step="1" value={source.calculation.perUnitExp} onChange={(event) => onChange({ calculation: { ...source.calculation!, perUnitExp: Math.max(0, Number(event.target.value) || 0) } as ExperienceSource['calculation'] })} /></label><label className="small-formula"><span>每日次数</span><input aria-label={`${source.name}每日次数`} type="number" min="0" max="99" step="1" value={source.calculation.units} onChange={(event) => onChange({ calculation: { ...source.calculation!, units: Math.max(0, Number(event.target.value) || 0) } as ExperienceSource['calculation'] })} /></label></div>;
  }
  return <label className="source-exp-input"><span>每次经验</span><input aria-label={`${source.name}经验`} type="number" min="0" step="1" value={source.exp} onChange={(event) => onChange({ exp: Math.max(0, Number(event.target.value) || 0) })} /></label>;
}

export default function LevelTrackerPage() {
  const [tracker, setTracker] = useState<StoredTracker>(loadTracker);
  const [draftSources, setDraftSources] = useState<ExperienceSource[]>(() => tracker.sources.map((source) => ({ ...source })));
  const [sourcesDirty, setSourcesDirty] = useState(false);
  const [openWeek, setOpenWeek] = useState<string | null>('2026-08-24');
  const [openDay, setOpenDay] = useState<string | null>('2026-08-25');
  const [sourcesOpen, setSourcesOpen] = useState(false);
  const { settings, sources, records } = tracker;

  useEffect(() => { window.localStorage.setItem(STORAGE_KEY, JSON.stringify(tracker)); }, [tracker]);

  const projection = useMemo(() => projectTracker(settings, sources, records), [settings, sources, records]);
  const totals = useMemo(() => sourceTotals(sources), [sources]);
  const draftTotals = useMemo(() => sourceTotals(draftSources), [draftSources]);
  const enabledIds = useMemo(() => new Set(sources.filter((source) => source.enabled).map((source) => source.id)), [sources]);
  const targetReached = projection.final.level >= settings.targetLevel;

  const updateSetting = <K extends keyof TrackerSettings>(key: K, value: TrackerSettings[K]) => {
    setTracker((current) => ({ ...current, settings: { ...current.settings, [key]: value } }));
  };
  const updateLevelRequirement = (level: 200 | 203 | 206, value: string) => {
    setTracker((current) => ({
      ...current,
      settings: {
        ...current.settings,
        levelRequirements: (() => {
          const previous = current.settings.levelRequirements;
          const next: Record<string, number> = { ...previous, [level]: Math.max(1, Number(value) || 1) };
          const previousSuggested206 = extrapolateLevel206Requirement(previous['200'], previous['203']);
          if (level !== 206 && previous['206'] === previousSuggested206) {
            next['206'] = extrapolateLevel206Requirement(next['200'], next['203']);
          }
          return next;
        })(),
      },
    }));
  };

  const updateSource = (id: string, patch: Partial<ExperienceSource>) => {
    setDraftSources((current) => current.map((source) => source.id === id ? { ...source, ...patch } : source));
    setSourcesDirty(true);
  };

  const syncSourcesToPlan = () => {
    setTracker((current) => ({ ...current, sources: draftSources.map((source) => ({ ...source })) }));
    setSourcesDirty(false);
  };

  const toggleTask = (date: string, source: ExperienceSource) => {
    setTracker((current) => {
      const targetWeek = weekKey(date);
      const selected = source.frequency === 'weekly'
        ? current.records.some((record) => weekKey(record.date) === targetWeek && record.completedSourceIds.includes(source.id))
        : current.records.find((record) => record.date === date)?.completedSourceIds.includes(source.id) ?? false;
      const nextRecords = current.records.map((record) => {
        let completedSourceIds = record.completedSourceIds;
        if (source.frequency === 'weekly' && weekKey(record.date) === targetWeek) completedSourceIds = completedSourceIds.filter((id) => id !== source.id);
        if (record.date === date && !selected) completedSourceIds = [...completedSourceIds, source.id];
        if (record.date === date && selected && source.frequency === 'daily') completedSourceIds = completedSourceIds.filter((id) => id !== source.id);
        return completedSourceIds === record.completedSourceIds ? record : { ...record, completedSourceIds };
      });
      return { ...current, records: nextRecords };
    });
  };

  const updateActualPercent = (date: string, value: string) => {
    setTracker((current) => ({
      ...current,
      records: current.records.map((record) => record.date === date
        ? { ...record, actualPercent: value === '' ? null : Math.max(0, Math.min(100, Number(value) || 0)) }
        : record),
    }));
  };

  const resetTracker = () => {
    const defaults = cloneDefaults();
    setTracker(defaults);
    setDraftSources(defaults.sources.map((source) => ({ ...source })));
    setSourcesDirty(false);
    window.localStorage.removeItem(STORAGE_KEY);
    setOpenWeek('2026-08-24');
    setOpenDay('2026-08-25');
  };
  const sourceEditorGroups = [
    { key: 'daily', label: '日常任务', note: '单次经验 × 每日次数', items: draftSources.filter((source) => source.frequency === 'daily') },
    { key: 'weekly-dungeon', label: '周副本', note: '每周完成一次', items: draftSources.filter((source) => source.group === 'weekly-dungeon') },
    { key: 'weekly-reward', label: '每周任务奖励', note: '基础奖励与额外购买', items: draftSources.filter((source) => source.group === 'weekly-reward') },
  ];

  return <main className="tracker-shell">
    <header className="tracker-header">
      <a className="tracker-brand" href={sitePath('/')}>Maple<span>Lab</span></a>
      <div className="tracker-heading"><span className="tracker-eyebrow">PROGRESSION / DAILY FORECAST</span><h1>等级跟踪器</h1><p>从今天的经验条出发，逐日计算到 9 月 15 日。</p></div>
      <a className="tracker-back" href={sitePath('/')}>返回工具目录 ↗</a>
    </header>

    <section className="tracker-command">
      <div className="command-copy"><span className="tracker-eyebrow">CURRENT BASELINE / 08.25 END OF DAY</span><h2>{formatProgress({ level: settings.currentLevel, percent: settings.currentPercent })}</h2><p>8月25日日常和第一周周本均已完成，经验已包含在当前基准中。</p></div>
      <div className="settings-line">
        <label><span>当前等级</span><input type="number" min="1" value={settings.currentLevel} onChange={(event) => updateSetting('currentLevel', Math.max(1, Number(event.target.value) || 1))} /></label>
        <label><span>当前经验</span><span className="suffix-input"><input type="number" min="0" max="100" step="0.01" value={settings.currentPercent} onChange={(event) => updateSetting('currentPercent', Math.max(0, Math.min(100, Number(event.target.value) || 0)))} /><em>%</em></span></label>
        {[200, 203, 206].map((level) => <label className="requirement-field" key={level}><span>{level}级升级经验</span><input type="number" min="1" step="1" value={settings.levelRequirements[String(level)]} onChange={(event) => updateLevelRequirement(level as 200 | 203 | 206, event.target.value)} /><small>{formatYiExp(settings.levelRequirements[String(level)])}{level === 206 ? ' · 按前段涨幅推算' : ''}</small></label>)}
        <label><span>升级活动</span><strong>自然升级 +{settings.eventExtraLevels}级 · 共{settings.eventExtraLevels + 1}级</strong></label>
      </div>
      <div className="command-progress"><span style={{ width: `${Math.min(100, settings.currentPercent)}%` }} /></div>
    </section>

    <section className={`final-forecast ${targetReached ? 'reached' : 'short'}`}>
      <div><span className="tracker-eyebrow">FINAL / 2026.09.15</span><h2>{formatProgress(projection.final)}</h2><p>{targetReached ? `预计 ${formatDate(projection.reachedTargetDate ?? settings.endDate)} 达到 Lv.${settings.targetLevel}` : `按当前计划尚未达到 Lv.${settings.targetLevel}`}</p></div>
      <dl><div><dt>计划总经验</dt><dd>{formatExp(projection.totalEarnedExp)}</dd></div><div><dt>{targetReached ? '206级经验余量' : '距离升级缺口'}</dt><dd>{formatExp(Math.abs(projection.targetDeltaExp))}</dd></div><div><dt>日常 / 周常</dt><dd>{formatExp(totals.daily)} / {formatExp(totals.weekly)}</dd></div></dl>
    </section>

    <section className="weekly-workspace">
      <div className="section-intro"><div><span className="tracker-eyebrow">01 / WEEKLY TRACKING</span><h2>按周执行与校准</h2></div><p>未来日期默认按全部启用任务完成计算；填入某天实际经验后，后续预测会从实际值继续。</p></div>
      <div className="week-list">{projection.weeks.map((week, weekIndex) => {
        const expanded = openWeek === week.key;
        const weekCompletedIds = [...new Set(week.days.flatMap((day) => day.completedSourceIds))];
        const weeklyScheduleDate = week.key === weekKey(settings.startDate) ? settings.startDate : week.endDate;
        return <article className={`week-section ${expanded ? 'expanded' : ''}`} key={week.key}>
          <button className="week-summary" type="button" onClick={() => setOpenWeek(expanded ? null : week.key)}>
            <span className="week-number">0{weekIndex + 1}</span><span className="week-period"><small>{formatShortDate(week.startDate)} — {formatShortDate(week.endDate)}</small><strong>第 {weekIndex + 1} 周</strong></span><span><small>期初</small><strong>{formatProgress(week.start)}</strong></span><span><small>本周任务经验</small><strong>{formatExp(week.trackedExp)}</strong></span><span><small>周末预测</small><strong className="forecast-value">{formatProgress(week.end)}</strong></span><b>{expanded ? '−' : '+'}</b>
          </button>
          {expanded && <div className="week-days"><WeekTaskPanel sources={sources.filter((source) => source.enabled && source.frequency === 'weekly')} completedIds={weekCompletedIds} onToggle={(source) => toggleTask(weeklyScheduleDate, source)} /><div className="day-row day-head"><span>日期</span><span>日常任务</span><span>获得经验</span><span>预测结果</span><span>实际经验</span><span /></div>{week.days.map((day) => {
            const record = records.find((item) => item.date === day.date)!;
            const activeCompleted = record.completedSourceIds.filter((id) => enabledIds.has(id) && sources.some((source) => source.id === id && source.frequency === 'daily'));
            const dayExpanded = openDay === day.date;
            return <div className={`day-block ${day.calibrated ? 'calibrated' : ''}`} key={day.date}><div className="day-row"><button className="date-button" type="button" onClick={() => setOpenDay(dayExpanded ? null : day.date)}><small>{new Intl.DateTimeFormat('zh-CN', { weekday: 'short' }).format(new Date(`${day.date}T00:00:00`))}</small><strong>{formatShortDate(day.date)}</strong></button><span className="task-count"><b>{activeCompleted.length}</b> 项</span><strong>{day.date === settings.startDate ? (day.earnedExp > 0 ? `新增 ${formatExp(day.earnedExp)}` : '基准日') : formatExp(day.earnedExp)}</strong><span className="day-result"><small>{formatProgress(day.start)}</small><b>→ {formatProgress(day.predictedEnd)}</b></span>{day.date === settings.startDate ? <span className="baseline-label">{day.earnedExp > 0 ? '基准 + 新增' : '当前基准'}</span> : <label className="actual-input"><input type="number" min="0" max="100" step="0.01" placeholder="未填写" value={record.actualPercent ?? ''} onChange={(event) => updateActualPercent(day.date, event.target.value)} /><em>%</em></label>}<button className="expand-day" type="button" onClick={() => setOpenDay(dayExpanded ? null : day.date)}>{dayExpanded ? '收起' : '日常'}</button></div>{dayExpanded && <div className="day-tasks"><div className="day-task-note"><strong>{formatDate(day.date)}</strong><span>{day.date === settings.startDate ? '已完成日常计入当前基准。' : '取消勾选会立即从当日及后续预测中扣除。'}</span></div><DailyTaskList sources={sources.filter((source) => source.enabled)} completedIds={record.completedSourceIds} onToggle={(source) => toggleTask(day.date, source)} /></div>}</div>;
          })}</div>}
        </article>;
      })}</div>
    </section>

    <section className="source-editor">
      <button className="source-editor-toggle" type="button" onClick={() => setSourcesOpen(!sourcesOpen)}><span><span className="tracker-eyebrow">02 / EXPERIENCE SOURCES</span><strong>任务经验设置</strong><small>完成修改后，点击刷新同步至每日与每周计划</small></span><b>{sourcesOpen ? '收起 ↑' : '展开编辑 ↓'}</b></button>
      {sourcesOpen && <div className="source-editor-body"><div className="source-editor-head"><span>启用</span><span>任务来源</span><span>单次参数</span><span>每日 / 每次总经验</span><span>周经验参考</span></div>{sourceEditorGroups.map((group) => <div className="source-editor-group" key={group.key}><div className="source-group-title"><span>{group.label}</span><small>{group.note}</small></div>{group.items.map((source) => { const index = draftSources.findIndex((item) => item.id === source.id); const effectiveExp = sourceExperience(source); const purchase = purchaseLabel(source); return <div className={`source-edit-row ${!source.enabled ? 'disabled' : ''} ${source.optionalPurchase ? 'purchase-source' : ''}`} key={source.id}><label className="source-switch"><input type="checkbox" checked={source.enabled} onChange={(event) => updateSource(source.id, { enabled: event.target.checked })} /><i /></label><span className="source-name"><small>{String(index + 1).padStart(2, '0')}</small><span><strong>{source.name}</strong>{purchase && <em>{purchase} · 每周限 1 次</em>}</span></span><SourceParameterEditor source={source} onChange={(patch) => updateSource(source.id, patch)} /><strong className="calculated-exp">{formatYiExp(effectiveExp)}</strong><strong>{source.frequency === 'daily' ? formatYiExp(effectiveExp * 7) : `${formatYiExp(effectiveExp)} / 次`}</strong></div>; })}</div>)}<div className={`source-editor-total ${sourcesDirty ? 'has-changes' : ''}`}><span>草稿汇总<small>{sourcesDirty ? '有未同步修改' : '已同步至周计划'}</small></span><strong>{formatYiExp(draftTotals.daily)} / 天</strong><strong>{formatYiExp(draftTotals.daily * 7)} + {formatYiExp(draftTotals.weekly)} / 完整周</strong><button type="button" onClick={syncSourcesToPlan} disabled={!sourcesDirty}>{sourcesDirty ? '刷新并同步周计划 ↻' : '已同步 ✓'}</button></div></div>}
    </section>

    <footer className="tracker-footer"><span>LAST UPDATED / 2026.08.25</span><button type="button" onClick={resetTracker}>恢复默认数据</button><span>经验单位：亿 / 万亿 · 数据保存在当前浏览器</span></footer>
  </main>;
}

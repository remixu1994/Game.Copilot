import { useEffect, useMemo, useState } from 'react';
import { sitePath } from '../../shared/lib/sitePaths';
import {
  baselineDateForToday,
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

const STORAGE_KEY = 'maplelab-level-tracker-v11';
const PREVIOUS_STORAGE_KEY = 'maplelab-level-tracker-v10';
const BASELINE_STORAGE_KEY = 'maplelab-level-tracker-v9';
const LEGACY_STORAGE_KEY = 'maplelab-level-tracker-v8';
const OLDER_STORAGE_KEY = 'maplelab-level-tracker-v7';
const WEEKLY_REWARD_IDS = ['weekly-reward-1', 'weekly-reward-2', 'weekly-reward-3'];
const localTodayKey = () => {
  const today = new Date();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${today.getFullYear()}-${month}-${day}`;
};
const defaultBaseline = () => {
  const startDate = baselineDateForToday(
    localTodayKey(),
    defaultSettings.startDate,
    defaultSettings.endDate,
  );
  return {
    startDate,
    baselineTiming:
      startDate === defaultSettings.startDate
        ? defaultSettings.baselineTiming
        : ('start-of-day' as const),
  };
};
const cloneDefaults = (): StoredTracker => {
  const settings = {
    ...defaultSettings,
    ...defaultBaseline(),
    levelRequirements: { ...defaultSettings.levelRequirements },
  };
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
  const previousLevel203 = 4_200_000_000_000;
  const shouldMigrateLevel203 =
    !stored['203'] || stored['203'] === 420_000_000_000 || stored['203'] === previousLevel203;
  const level203 = shouldMigrateLevel203 ? defaultSettings.levelRequirements['203'] : stored['203'];
  const previousSuggested206 = extrapolateLevel206Requirement(level200, previousLevel203);
  const level206 =
    !stored['206'] || (shouldMigrateLevel203 && stored['206'] === previousSuggested206)
      ? extrapolateLevel206Requirement(level200, level203)
      : stored['206'];
  return {
    ...defaultSettings.levelRequirements,
    ...stored,
    200: level200,
    203: level203,
    206: level206,
  };
};
const hydrateSources = (storedSources: ExperienceSource[]) => {
  const stored = new Map(storedSources.map((source) => [source.id, source]));
  return defaultSources.map((source) =>
    stored.has(source.id) ? { ...source, ...stored.get(source.id) } : { ...source },
  );
};
const migrateLegacySources = (storedSources: ExperienceSource[]) => {
  const stored = new Map(storedSources.map((source) => [source.id, source]));
  return defaultSources.map((source) => ({
    ...source,
    enabled: stored.get(source.id)?.enabled ?? source.enabled,
  }));
};
const hydrateRecords = (
  settings: TrackerSettings,
  sources: ExperienceSource[],
  records: DailyRecord[],
  migrateWeeklySettlementDates = false,
) => {
  const weeklyIds = new Set(
    sources.filter((source) => source.frequency === 'weekly').map((source) => source.id),
  );
  const baselineEligibleWeeklyIds = new Set(
    sources
      .filter(
        (source) =>
          source.frequency === 'weekly' &&
          (source.group === 'weekly-dungeon' ||
            (source.rewardTier ?? source.optionalPurchase?.rewardTier) === 1),
      )
      .map((source) => source.id),
  );
  const monsterPark = sources.find(
    (source) => source.id === 'monster-park' && source.calculation?.kind === 'per-ticket',
  );
  const monsterParkPerRunExp =
    monsterPark?.calculation?.kind === 'per-ticket'
      ? monsterPark.calculation.perUnitExp * (1 + monsterPark.calculation.bonusPercent / 100)
      : 0;
  const firstWeek = weekKey(settings.startDate);
  const firstWeekRecords = records.filter((record) => weekKey(record.date) === firstWeek);
  const firstWeekLastDate = firstWeekRecords.at(-1)?.date ?? settings.startDate;
  const baselineRecord = records.find((record) => record.date === settings.startDate);
  const baselineWeeklyIds = new Set(
    (baselineRecord?.baselineIncludedSourceIds ?? []).filter(
      (id) => weeklyIds.has(id) && baselineEligibleWeeklyIds.has(id),
    ),
  );
  const selectedFirstWeekIds = new Set(
    records
      .filter((record) => weekKey(record.date) === firstWeek)
      .flatMap((record) => record.completedSourceIds)
      .filter((id) => weeklyIds.has(id)),
  );

  return records.map((record) => {
    let completedSourceIds = record.completedSourceIds;
    let baselineIncludedSourceIds = record.baselineIncludedSourceIds;
    let sourceExpOverrides = record.sourceExpOverrides;
    let sourceUnitOverrides = record.sourceUnitOverrides;
    if (
      sourceExpOverrides?.['monster-park'] !== undefined &&
      sourceUnitOverrides?.['monster-park'] === undefined &&
      monsterParkPerRunExp > 0
    ) {
      sourceUnitOverrides = {
        ...sourceUnitOverrides,
        'monster-park': Math.max(
          0,
          Math.round(sourceExpOverrides['monster-park'] / monsterParkPerRunExp),
        ),
      };
      sourceExpOverrides = { ...sourceExpOverrides };
      delete sourceExpOverrides['monster-park'];
    }
    if (
      migrateWeeklySettlementDates &&
      settings.baselineTiming === 'end-of-day' &&
      weekKey(record.date) === firstWeek
    ) {
      const dailyIds = completedSourceIds.filter((id) => !weeklyIds.has(id));
      const weeklyIdsForDate = completedSourceIds.filter((id) => weeklyIds.has(id));
      if (record.date === settings.startDate) {
        completedSourceIds = [...dailyIds, ...baselineWeeklyIds];
        if (baselineIncludedSourceIds) {
          baselineIncludedSourceIds = baselineIncludedSourceIds.filter(
            (id) => !weeklyIds.has(id) || baselineEligibleWeeklyIds.has(id),
          );
        } else {
          baselineIncludedSourceIds = [...new Set([...dailyIds, ...baselineWeeklyIds])];
        }
      } else if (record.date === firstWeekLastDate) {
        const scheduledIds = [...selectedFirstWeekIds].filter((id) => !baselineWeeklyIds.has(id));
        completedSourceIds = [...dailyIds, ...new Set([...weeklyIdsForDate, ...scheduledIds])];
      } else {
        completedSourceIds = [
          ...dailyIds,
          ...weeklyIdsForDate.filter((id) => !baselineWeeklyIds.has(id)),
        ];
      }
    } else if (record.date === settings.startDate) {
      baselineIncludedSourceIds = baselineIncludedSourceIds
        ? baselineIncludedSourceIds.filter(
            (id) => !weeklyIds.has(id) || baselineEligibleWeeklyIds.has(id),
          )
        : settings.baselineTiming === 'end-of-day'
          ? [...completedSourceIds]
          : [];
    }
    return {
      ...record,
      completedSourceIds,
      baselineIncludedSourceIds,
      sourceExpOverrides,
      sourceUnitOverrides,
    };
  });
};
const migratePreviousBaseline = (settings: TrackerSettings, records: DailyRecord[]) =>
  records.map((record) =>
    record.date === settings.startDate
      ? {
          ...record,
          baselineIncludedSourceIds:
            settings.baselineTiming === 'end-of-day' ? [...record.completedSourceIds] : [],
        }
      : record,
  );

const rebaseRecords = (
  settings: TrackerSettings,
  sources: ExperienceSource[],
  records: DailyRecord[],
  startDate: string,
  baselineTiming: TrackerSettings['baselineTiming'],
) => {
  const nextSettings = { ...settings, startDate, baselineTiming };
  const defaults = createDefaultRecords(nextSettings, sources);
  const existingByDate = new Map(records.map((record) => [record.date, record]));
  const previousWeeklyIds = new Set(
    records
      .filter((record) => weekKey(record.date) === weekKey(startDate))
      .flatMap((record) => record.completedSourceIds)
      .filter((id) => sources.some((source) => source.id === id && source.frequency === 'weekly')),
  );
  const hasPreviousWeek = records.some((record) => weekKey(record.date) === weekKey(startDate));

  const rebased = defaults.map((record) => {
    const existing = existingByDate.get(record.date);
    if (record.date === startDate) {
      if (!hasPreviousWeek)
        return existing
          ? {
              ...record,
              sourceExpOverrides: existing.sourceExpOverrides,
              sourceUnitOverrides: existing.sourceUnitOverrides,
            }
          : record;
      const dailyIds = record.completedSourceIds.filter((id) =>
        sources.some((source) => source.id === id && source.frequency === 'daily'),
      );
      const completedSourceIds = [...dailyIds, ...previousWeeklyIds];
      const baselineIncludedSourceIds =
        baselineTiming === 'end-of-day' ? [...completedSourceIds] : [];
      return {
        ...record,
        completedSourceIds,
        baselineIncludedSourceIds,
        sourceExpOverrides: existing?.sourceExpOverrides,
        sourceUnitOverrides: existing?.sourceUnitOverrides,
      };
    }
    return existing
      ? {
          ...record,
          completedSourceIds: existing.completedSourceIds,
          actualPercent: existing.actualPercent,
          sourceExpOverrides: existing.sourceExpOverrides,
          sourceUnitOverrides: existing.sourceUnitOverrides,
        }
      : record;
  });
  return hydrateRecords(nextSettings, sources, rebased);
};
const addDefaultWeeklyPurchases = (
  settings: TrackerSettings,
  sources: ExperienceSource[],
  records: DailyRecord[],
) => {
  const purchaseIds = sources
    .filter((source) => source.optionalPurchase)
    .map((source) => source.id);
  const finalWeek = weekKey(settings.endDate);
  const unavailableFinalWeekIds = new Set(
    sources
      .filter(
        (source) =>
          source.group === 'weekly-reward' &&
          (source.rewardTier ?? source.optionalPurchase?.rewardTier ?? 0) > 1,
      )
      .map((source) => source.id),
  );
  const lastDateByWeek = new Map<string, string>();
  records.forEach((record) => lastDateByWeek.set(weekKey(record.date), record.date));
  const firstWeek = weekKey(settings.startDate);
  return records.map((record) => {
    const key = weekKey(record.date);
    const isPurchaseDate =
      key === firstWeek
        ? record.date === settings.startDate
        : lastDateByWeek.get(key) === record.date;
    const completedSourceIds =
      key === finalWeek
        ? record.completedSourceIds.filter((id) => !unavailableFinalWeekIds.has(id))
        : record.completedSourceIds;
    if (!isPurchaseDate)
      return completedSourceIds === record.completedSourceIds
        ? record
        : { ...record, completedSourceIds };
    const availablePurchases =
      key === finalWeek
        ? purchaseIds.filter((id) => !unavailableFinalWeekIds.has(id))
        : purchaseIds;
    return {
      ...record,
      completedSourceIds: [...new Set([...completedSourceIds, ...availablePurchases])],
    };
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
        return {
          ...parsed,
          settings,
          sources,
          records: hydrateRecords(settings, sources, parsed.records),
        };
      }
    }
    const previousSaved = window.localStorage.getItem(PREVIOUS_STORAGE_KEY);
    if (previousSaved) {
      const parsed = JSON.parse(previousSaved) as StoredTracker;
      if (parsed.settings && Array.isArray(parsed.sources) && Array.isArray(parsed.records)) {
        const sources = hydrateSources(parsed.sources);
        const settings = hydrateSettings(parsed.settings);
        return {
          ...parsed,
          settings,
          sources,
          records: hydrateRecords(settings, sources, parsed.records, true),
        };
      }
    }
    const baselineSaved = window.localStorage.getItem(BASELINE_STORAGE_KEY);
    if (baselineSaved) {
      const parsed = JSON.parse(baselineSaved) as StoredTracker;
      if (parsed.settings && Array.isArray(parsed.sources) && Array.isArray(parsed.records)) {
        const sources = hydrateSources(parsed.sources);
        const settings = hydrateSettings(parsed.settings);
        return {
          ...parsed,
          settings,
          sources,
          records: hydrateRecords(
            settings,
            sources,
            migratePreviousBaseline(settings, parsed.records),
            true,
          ),
        };
      }
    }
    const legacySaved =
      window.localStorage.getItem(LEGACY_STORAGE_KEY) ??
      window.localStorage.getItem(OLDER_STORAGE_KEY);
    if (!legacySaved) return cloneDefaults();
    const legacy = JSON.parse(legacySaved) as StoredTracker;
    if (!legacy.settings || !Array.isArray(legacy.sources) || !Array.isArray(legacy.records))
      return cloneDefaults();
    const settings = hydrateSettings(legacy.settings);
    const sources = migrateLegacySources(legacy.sources);
    const records = legacy.records.map((record) => ({
      ...record,
      completedSourceIds: record.completedSourceIds.includes('weekly-task')
        ? [...record.completedSourceIds.filter((id) => id !== 'weekly-task'), ...WEEKLY_REWARD_IDS]
        : record.completedSourceIds,
    }));
    const recordsWithPurchases = addDefaultWeeklyPurchases(settings, sources, records);
    return { settings, sources, records: hydrateRecords(settings, sources, recordsWithPurchases) };
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
const formatExp = (exp: number) =>
  exp >= 1_000_000_000_000
    ? `${(exp / 1_000_000_000_000).toFixed(3)} 万亿`
    : `${(exp / EXP_PER_YI).toLocaleString('zh-CN', { maximumFractionDigits: 3 })} 亿`;
const formatYiExp = (exp: number) =>
  `${(exp / EXP_PER_YI).toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} 亿`;
const sourceDisplayName = (source: ExperienceSource) =>
  source.calculation?.kind === 'per-run' || source.calculation?.kind === 'per-ticket'
    ? `${source.name} ×${source.calculation.units}`
    : source.name;
const purchaseLabel = (source: ExperienceSource) =>
  source.optionalPurchase
    ? source.optionalPurchase.currency === 'diamond'
      ? `${source.optionalPurchase.cost ?? 200} 钻石购买`
      : '金币购买'
    : null;

function TaskCheck({
  source,
  checked,
  disabled = false,
  statusText,
  onToggle,
}: {
  source: ExperienceSource;
  checked: boolean;
  disabled?: boolean;
  statusText?: string;
  onToggle: () => void;
}) {
  return (
    <label
      className={`${source.frequency === 'weekly' ? 'weekly-check' : ''} ${disabled ? 'baseline-locked' : ''}`}
    >
      <input type="checkbox" checked={checked} disabled={disabled} onChange={onToggle} />
      <span>
        <strong>{sourceDisplayName(source)}</strong>
        <small>
          {formatExp(sourceExperience(source))} ·{' '}
          {statusText ?? (source.frequency === 'weekly' ? '每周' : '每日')}
        </small>
      </span>
    </label>
  );
}

function DailyTaskList({
  sources,
  completedIds,
  expOverrides,
  unitOverrides,
  allowExpOverride,
  onToggle,
  onExpOverride,
  onUnitOverride,
}: {
  sources: ExperienceSource[];
  completedIds: string[];
  expOverrides?: Record<string, number>;
  unitOverrides?: Record<string, number>;
  allowExpOverride: boolean;
  onToggle: (source: ExperienceSource) => void;
  onExpOverride: (source: ExperienceSource, value: string) => void;
  onUnitOverride: (source: ExperienceSource, value: string) => void;
}) {
  const daily = sources.filter((source) => source.frequency === 'daily');
  const isChecked = (source: ExperienceSource) => completedIds.includes(source.id);
  return (
    <section className="task-group daily-task-group">
      <header>
        <span>
          <b>01</b>
          <strong>日常任务</strong>
        </span>
        <small>
          {daily.filter(isChecked).length} / {daily.length} 项完成
        </small>
      </header>
      <div className="task-check-grid">
        {daily.map((source) => {
          if (source.id === 'monster-park' && source.calculation?.kind === 'per-ticket') {
            const units = unitOverrides?.[source.id] ?? source.calculation.units;
            const dailySource = { ...source, calculation: { ...source.calculation, units } };
            const calculatedExp = sourceExperience(dailySource);
            return (
              <div
                className={`daily-exp-override ${unitOverrides?.[source.id] !== undefined ? 'customized' : ''}`}
                key={source.id}
              >
                <TaskCheck
                  source={dailySource}
                  checked={isChecked(source)}
                  onToggle={() => onToggle(source)}
                />
                <span className="today-exp-input monster-run-input">
                  <small>
                    {allowExpOverride ? `今日 ${formatExp(calculatedExp)}` : '已计入基准'}
                  </small>
                  <span>
                    <input
                      aria-label="今日怪物乐园次数"
                      type="number"
                      min="0"
                      step="1"
                      disabled={!isChecked(source) || !allowExpOverride}
                      value={units}
                      onChange={(event) => onUnitOverride(source, event.target.value)}
                    />
                    <em>次</em>
                  </span>
                </span>
              </div>
            );
          }
          return source.id === 'auto-6h' ? (
            <div
              className={`daily-exp-override ${expOverrides?.[source.id] !== undefined ? 'customized' : ''}`}
              key={source.id}
            >
              <TaskCheck
                source={source}
                checked={isChecked(source)}
                onToggle={() => onToggle(source)}
              />
              <span className="today-exp-input">
                <small>{allowExpOverride ? '今日挂机经验' : '已计入基准'}</small>
                <span>
                  <input
                    aria-label="今日挂机经验"
                    type="number"
                    min="0"
                    step="0.01"
                    disabled={!isChecked(source) || !allowExpOverride}
                    value={(expOverrides?.[source.id] ?? sourceExperience(source)) / EXP_PER_YI}
                    onChange={(event) => onExpOverride(source, event.target.value)}
                  />
                  <em>亿</em>
                </span>
              </span>
            </div>
          ) : (
            <TaskCheck
              key={source.id}
              source={source}
              checked={isChecked(source)}
              onToggle={() => onToggle(source)}
            />
          );
        })}
      </div>
    </section>
  );
}

function WeekTaskPanel({
  sources,
  completedIds,
  baselineIncludedIds,
  completionDates,
  weekDates,
  showDungeonBaselineControl,
  onToggle,
  onCompletionDateChange,
  onDungeonBaselineChange,
}: {
  sources: ExperienceSource[];
  completedIds: string[];
  baselineIncludedIds: string[];
  completionDates: Record<string, string>;
  weekDates: string[];
  showDungeonBaselineControl: boolean;
  onToggle: (source: ExperienceSource) => void;
  onCompletionDateChange: (source: ExperienceSource, date: string) => void;
  onDungeonBaselineChange: (source: ExperienceSource, included: boolean) => void;
}) {
  const weeklyDungeons = sources.filter((source) => source.group === 'weekly-dungeon');
  const weeklyRewards = sources
    .filter((source) => source.group === 'weekly-reward' && !source.optionalPurchase)
    .sort((a, b) => (a.rewardTier ?? 0) - (b.rewardTier ?? 0));
  const isChecked = (source: ExperienceSource) => completedIds.includes(source.id);
  const baselineIncluded = new Set(baselineIncludedIds);
  const completedCount = [...weeklyDungeons, ...weeklyRewards].filter(isChecked).length;
  const baselineExp = sources
    .filter((source) => isChecked(source) && baselineIncluded.has(source.id))
    .reduce((sum, source) => sum + sourceExperience(source), 0);
  const newWeeklyExp = sources
    .filter((source) => isChecked(source) && !baselineIncluded.has(source.id))
    .reduce((sum, source) => sum + sourceExperience(source), 0);
  const claimDateSelect = (source: ExperienceSource) => {
    if (!isChecked(source)) return null;
    if (baselineIncluded.has(source.id))
      return <span className="weekly-claim-baseline">基准日</span>;
    return (
      <label className="weekly-claim-date">
        <span>领取日</span>
        <select
          aria-label={`${source.name}领取日期`}
          value={completionDates[source.id] ?? weekDates.at(-1)}
          onChange={(event) => onCompletionDateChange(source, event.target.value)}
        >
          {weekDates.map((date) => (
            <option value={date} key={date}>
              {formatShortDate(date)}
            </option>
          ))}
        </select>
      </label>
    );
  };

  return (
    <div className={`week-task-panel ${baselineExp > 0 ? 'baseline-included' : ''}`}>
      <div className="week-task-panel-head">
        <span>
          <b>WEEKLY</b>
          <strong>本周周常汇总</strong>
        </span>
        <small>
          基础 {completedCount} / {weeklyDungeons.length + weeklyRewards.length} · 基准已含{' '}
          {formatExp(baselineExp)} · 本周新增 {formatExp(newWeeklyExp)}
        </small>
      </div>
      <div className="week-task-panel-grid">
        <section className="task-group weekly-dungeon-group">
          <header>
            <span>
              <b>01</b>
              <strong>周副本</strong>
            </span>
            <small>
              {weeklyDungeons.filter(isChecked).length} / {weeklyDungeons.length}
            </small>
          </header>
          <div className="task-check-grid weekly-dungeon-grid">
            {weeklyDungeons.map((source) => {
              const checked = isChecked(source);
              const included = baselineIncluded.has(source.id);
              return (
                <div
                  className={`weekly-dungeon-item ${included ? 'baseline-item' : ''} ${showDungeonBaselineControl ? 'has-baseline-control' : ''}`}
                  key={source.id}
                >
                  <TaskCheck
                    source={source}
                    checked={checked}
                    statusText={included ? '已计入当前基准' : '本周新增'}
                    onToggle={() => onToggle(source)}
                  />
                  {claimDateSelect(source)}
                  {showDungeonBaselineControl && (
                    <label className="baseline-toggle item-baseline-toggle">
                      <input
                        type="checkbox"
                        checked={checked && included}
                        disabled={!checked}
                        onChange={(event) => onDungeonBaselineChange(source, event.target.checked)}
                      />
                      <span>纳入基准</span>
                    </label>
                  )}
                </div>
              );
            })}
          </div>
        </section>
        <section className="task-group weekly-reward-group">
          <header>
            <span>
              <b>02</b>
              <strong>每周任务奖励</strong>
            </span>
            <small>基础领取 + 可选购买</small>
          </header>
          <div className="weekly-reward-table">
            {weeklyRewards.map((base) => {
              const purchase = sources.find(
                (source) => source.optionalPurchase?.rewardTier === base.rewardTier,
              );
              return (
                <div className="weekly-reward-row" key={base.id}>
                  <span className="reward-tier">
                    <small>奖励 {base.rewardTier}</small>
                    <strong>{formatExp(sourceExperience(base))}</strong>
                  </span>
                  <div className="reward-choice-cell base-reward">
                    <label className="reward-choice">
                      <input
                        type="checkbox"
                        checked={isChecked(base)}
                        onChange={() => onToggle(base)}
                      />
                      <span>
                        <strong>基础领取</strong>
                        <small>
                          {baselineIncluded.has(base.id) ? '已计入当前基准' : '领取后计入本周'}
                        </small>
                      </span>
                    </label>
                    {claimDateSelect(base)}
                  </div>
                  {purchase && (
                    <div className="reward-choice-cell purchase-reward">
                      <label className="reward-choice">
                        <input
                          type="checkbox"
                          checked={isChecked(purchase)}
                          onChange={() => onToggle(purchase)}
                        />
                        <span>
                          <strong>额外购买一次</strong>
                          <small>
                            {baselineIncluded.has(purchase.id)
                              ? '已计入当前基准'
                              : `${purchaseLabel(purchase)} · +${formatExp(sourceExperience(purchase))}`}
                          </small>
                        </span>
                      </label>
                      {claimDateSelect(purchase)}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
}

function SourceParameterEditor({
  source,
  onChange,
}: {
  source: ExperienceSource;
  onChange: (patch: Partial<ExperienceSource>) => void;
}) {
  if (source.calculation?.kind === 'per-minute') {
    return (
      <div className="formula-inputs minute-formula">
        <label>
          <span>每分钟经验</span>
          <input
            aria-label={`${source.name}每分钟经验`}
            type="number"
            min="0"
            step="1"
            value={source.calculation.perUnitExp}
            onChange={(event) =>
              onChange({
                calculation: {
                  ...source.calculation!,
                  perUnitExp: Math.max(0, Number(event.target.value) || 0),
                } as ExperienceSource['calculation'],
              })
            }
          />
        </label>
        <b>× {source.calculation.units} 分钟</b>
      </div>
    );
  }
  if (source.calculation?.kind === 'per-ticket') {
    return (
      <div className="formula-inputs ticket-formula">
        <label>
          <span>单票经验</span>
          <input
            aria-label={`${source.name}单票经验`}
            type="number"
            min="0"
            step="1"
            value={source.calculation.perUnitExp}
            onChange={(event) =>
              onChange({
                calculation: {
                  ...source.calculation!,
                  perUnitExp: Math.max(0, Number(event.target.value) || 0),
                } as ExperienceSource['calculation'],
              })
            }
          />
        </label>
        <label className="small-formula">
          <span>每日票数</span>
          <input
            aria-label={`${source.name}每日票数`}
            type="number"
            min="0"
            max="99"
            step="1"
            value={source.calculation.units}
            onChange={(event) =>
              onChange({
                calculation: {
                  ...source.calculation!,
                  units: Math.max(0, Number(event.target.value) || 0),
                } as ExperienceSource['calculation'],
              })
            }
          />
        </label>
        <label className="small-formula">
          <span>装备加成</span>
          <input
            aria-label={`${source.name}装备经验加成`}
            type="number"
            min="0"
            max="20"
            step="1"
            value={source.calculation.bonusPercent}
            onChange={(event) =>
              onChange({
                calculation: {
                  ...source.calculation!,
                  bonusPercent: Math.max(0, Math.min(20, Number(event.target.value) || 0)),
                } as ExperienceSource['calculation'],
              })
            }
          />
          <em>%</em>
        </label>
      </div>
    );
  }
  if (source.calculation?.kind === 'per-run') {
    return (
      <div className="formula-inputs run-formula">
        <label>
          <span>单次经验</span>
          <input
            aria-label={`${source.name}单次经验`}
            type="number"
            min="0"
            step="1"
            value={source.calculation.perUnitExp}
            onChange={(event) =>
              onChange({
                calculation: {
                  ...source.calculation!,
                  perUnitExp: Math.max(0, Number(event.target.value) || 0),
                } as ExperienceSource['calculation'],
              })
            }
          />
        </label>
        <label className="small-formula">
          <span>每日次数</span>
          <input
            aria-label={`${source.name}每日次数`}
            type="number"
            min="0"
            max="99"
            step="1"
            value={source.calculation.units}
            onChange={(event) =>
              onChange({
                calculation: {
                  ...source.calculation!,
                  units: Math.max(0, Number(event.target.value) || 0),
                } as ExperienceSource['calculation'],
              })
            }
          />
        </label>
      </div>
    );
  }
  return (
    <label className="source-exp-input">
      <span>每次经验</span>
      <input
        aria-label={`${source.name}经验`}
        type="number"
        min="0"
        step="1"
        value={source.exp}
        onChange={(event) => onChange({ exp: Math.max(0, Number(event.target.value) || 0) })}
      />
    </label>
  );
}

export default function LevelTrackerPage() {
  const [tracker, setTracker] = useState<StoredTracker>(loadTracker);
  const [draftSources, setDraftSources] = useState<ExperienceSource[]>(() =>
    tracker.sources.map((source) => ({ ...source })),
  );
  const [sourcesDirty, setSourcesDirty] = useState(false);
  const [openWeek, setOpenWeek] = useState<string | null>(() =>
    weekKey(tracker.settings.startDate),
  );
  const [openDay, setOpenDay] = useState<string | null>(() => tracker.settings.startDate);
  const [sourcesOpen, setSourcesOpen] = useState(false);
  const { settings, sources, records } = tracker;

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(tracker));
  }, [tracker]);

  const projection = useMemo(
    () => projectTracker(settings, sources, records),
    [settings, sources, records],
  );
  const totals = useMemo(() => sourceTotals(sources), [sources]);
  const draftTotals = useMemo(() => sourceTotals(draftSources), [draftSources]);
  const enabledIds = useMemo(
    () => new Set(sources.filter((source) => source.enabled).map((source) => source.id)),
    [sources],
  );
  const targetReached = projection.final.level >= settings.targetLevel;

  const updateSetting = <K extends keyof TrackerSettings>(key: K, value: TrackerSettings[K]) => {
    setTracker((current) => ({ ...current, settings: { ...current.settings, [key]: value } }));
  };
  const updateBaseline = (startDate: string, baselineTiming: TrackerSettings['baselineTiming']) => {
    if (!startDate || startDate > settings.endDate) return;
    setTracker((current) => ({
      ...current,
      settings: { ...current.settings, startDate, baselineTiming },
      records: rebaseRecords(
        current.settings,
        current.sources,
        current.records,
        startDate,
        baselineTiming,
      ),
    }));
    setOpenWeek(weekKey(startDate));
    setOpenDay(startDate);
  };
  const updateLevelRequirement = (level: 200 | 203 | 206, value: string) => {
    setTracker((current) => ({
      ...current,
      settings: {
        ...current.settings,
        levelRequirements: (() => {
          const previous = current.settings.levelRequirements;
          const next: Record<string, number> = {
            ...previous,
            [level]: Math.max(1, Number(value) || 1),
          };
          const previousSuggested206 = extrapolateLevel206Requirement(
            previous['200'],
            previous['203'],
          );
          if (level !== 206 && previous['206'] === previousSuggested206) {
            next['206'] = extrapolateLevel206Requirement(next['200'], next['203']);
          }
          return next;
        })(),
      },
    }));
  };

  const updateSource = (id: string, patch: Partial<ExperienceSource>) => {
    setDraftSources((current) =>
      current.map((source) => (source.id === id ? { ...source, ...patch } : source)),
    );
    setSourcesDirty(true);
  };

  const syncSourcesToPlan = () => {
    setTracker((current) => ({
      ...current,
      sources: draftSources.map((source) => ({ ...source })),
    }));
    setSourcesDirty(false);
  };

  const toggleTask = (date: string, source: ExperienceSource) => {
    setTracker((current) => {
      const targetWeek = weekKey(date);
      const scheduleDate = date;
      const selected =
        source.frequency === 'weekly'
          ? current.records.some(
              (record) =>
                weekKey(record.date) === targetWeek &&
                record.completedSourceIds.includes(source.id),
            )
          : (current.records
              .find((record) => record.date === date)
              ?.completedSourceIds.includes(source.id) ?? false);
      const nextRecords = current.records.map((record) => {
        let completedSourceIds = record.completedSourceIds;
        if (source.frequency === 'weekly' && weekKey(record.date) === targetWeek)
          completedSourceIds = completedSourceIds.filter((id) => id !== source.id);
        if (record.date === scheduleDate && !selected)
          completedSourceIds = [...completedSourceIds, source.id];
        if (record.date === date && selected && source.frequency === 'daily')
          completedSourceIds = completedSourceIds.filter((id) => id !== source.id);
        return completedSourceIds === record.completedSourceIds
          ? record
          : { ...record, completedSourceIds };
      });
      return { ...current, records: nextRecords };
    });
  };

  const moveWeeklyTaskToDate = (targetWeek: string, sourceId: string, date: string) => {
    setTracker((current) => ({
      ...current,
      records: current.records.map((record) => {
        if (weekKey(record.date) !== targetWeek) return record;
        const completedSourceIds = record.completedSourceIds.filter((id) => id !== sourceId);
        return record.date === date
          ? { ...record, completedSourceIds: [...completedSourceIds, sourceId] }
          : { ...record, completedSourceIds };
      }),
    }));
  };

  const updateWeeklyDungeonBaseline = (targetWeek: string, sourceId: string, included: boolean) => {
    setTracker((current) => {
      const source = current.sources.find((item) => item.id === sourceId);
      if (!source || source.frequency !== 'weekly' || source.group !== 'weekly-dungeon')
        return current;
      const selected = current.records
        .filter((record) => weekKey(record.date) === targetWeek)
        .some((record) => record.completedSourceIds.includes(sourceId));
      const weekRecords = current.records.filter((record) => weekKey(record.date) === targetWeek);
      const currentCompletionDate = weekRecords.find((record) =>
        record.completedSourceIds.includes(sourceId),
      )?.date;
      const latestCalibrationDate = [...weekRecords]
        .reverse()
        .find(
          (record) => record.date !== current.settings.startDate && record.actualPercent !== null,
        )?.date;
      const nextCompletionDate = included
        ? current.settings.startDate
        : currentCompletionDate === current.settings.startDate
          ? (latestCalibrationDate ?? weekRecords.at(-1)?.date)
          : currentCompletionDate;
      return {
        ...current,
        records: current.records.map((record) => {
          if (weekKey(record.date) !== targetWeek) return record;
          const completedSourceIds = record.completedSourceIds.filter((id) => id !== sourceId);
          const baselineIncludedSourceIds =
            record.date === current.settings.startDate
              ? (record.baselineIncludedSourceIds ?? record.completedSourceIds).filter(
                  (id) => id !== sourceId,
                )
              : record.baselineIncludedSourceIds;
          return {
            ...record,
            completedSourceIds:
              selected && record.date === nextCompletionDate
                ? [...completedSourceIds, sourceId]
                : completedSourceIds,
            baselineIncludedSourceIds:
              record.date === current.settings.startDate && included && selected
                ? [...(baselineIncludedSourceIds ?? []), sourceId]
                : baselineIncludedSourceIds,
          };
        }),
      };
    });
  };

  const updateActualPercent = (date: string, value: string) => {
    setTracker((current) => ({
      ...current,
      records: current.records.map((record) =>
        record.date === date
          ? {
              ...record,
              actualPercent: value === '' ? null : Math.max(0, Math.min(100, Number(value) || 0)),
            }
          : record,
      ),
    }));
  };
  const updateDailySourceExperience = (date: string, source: ExperienceSource, value: string) => {
    setTracker((current) => ({
      ...current,
      records: current.records.map((record) => {
        if (record.date !== date) return record;
        const sourceExpOverrides = { ...(record.sourceExpOverrides ?? {}) };
        if (value === '') delete sourceExpOverrides[source.id];
        else sourceExpOverrides[source.id] = Math.max(0, Number(value) || 0) * EXP_PER_YI;
        return { ...record, sourceExpOverrides };
      }),
    }));
  };
  const updateDailySourceUnits = (date: string, source: ExperienceSource, value: string) => {
    setTracker((current) => ({
      ...current,
      records: current.records.map((record) => {
        if (record.date !== date) return record;
        const sourceUnitOverrides = { ...(record.sourceUnitOverrides ?? {}) };
        if (value === '') delete sourceUnitOverrides[source.id];
        else sourceUnitOverrides[source.id] = Math.max(0, Math.floor(Number(value) || 0));
        return { ...record, sourceUnitOverrides };
      }),
    }));
  };

  const resetTracker = () => {
    const defaults = cloneDefaults();
    setTracker(defaults);
    setDraftSources(defaults.sources.map((source) => ({ ...source })));
    setSourcesDirty(false);
    [
      STORAGE_KEY,
      PREVIOUS_STORAGE_KEY,
      BASELINE_STORAGE_KEY,
      LEGACY_STORAGE_KEY,
      OLDER_STORAGE_KEY,
    ].forEach((key) => window.localStorage.removeItem(key));
    setOpenWeek(weekKey(defaults.settings.startDate));
    setOpenDay(defaults.settings.startDate);
  };
  const sourceEditorGroups = [
    {
      key: 'daily',
      label: '日常任务',
      note: '单次经验 × 每日次数',
      items: draftSources.filter((source) => source.frequency === 'daily'),
    },
    {
      key: 'weekly-dungeon',
      label: '周副本',
      note: '每周完成一次',
      items: draftSources.filter((source) => source.group === 'weekly-dungeon'),
    },
    {
      key: 'weekly-reward',
      label: '每周任务奖励',
      note: '基础奖励与额外购买',
      items: draftSources.filter((source) => source.group === 'weekly-reward'),
    },
  ];

  return (
    <main className="tracker-shell">
      <header className="tracker-header">
        <a className="tracker-brand" href={sitePath('/')}>
          Maple<span>Lab</span>
        </a>
        <div className="tracker-heading">
          <span className="tracker-eyebrow">PROGRESSION / DAILY FORECAST</span>
          <h1>等级跟踪器</h1>
          <p>从当前经验基准出发，自动忽略更早日期并预测到 {formatDate(settings.endDate)}。</p>
        </div>
        <a className="tracker-back" href={sitePath('/')}>
          返回工具目录 ↗
        </a>
      </header>

      <section className="tracker-command">
        <div className="command-copy">
          <span className="tracker-eyebrow">
            CURRENT BASELINE / {formatShortDate(settings.startDate)}{' '}
            {settings.baselineTiming === 'end-of-day' ? 'END OF DAY' : 'START OF DAY'}
          </span>
          <h2>
            {formatProgress({ level: settings.currentLevel, percent: settings.currentPercent })}
          </h2>
          <p>
            {formatDate(settings.startDate)}之前的日期不再参与预测；
            {settings.baselineTiming === 'end-of-day'
              ? '当日所有已勾选任务均已包含在当前经验中。'
              : '当日任务将从当前经验继续累计。'}
          </p>
        </div>
        <div className="settings-line">
          <label>
            <span>当前数据日期</span>
            <input
              type="date"
              min={defaultSettings.startDate}
              max={settings.endDate}
              value={settings.startDate}
              onChange={(event) => updateBaseline(event.target.value, settings.baselineTiming)}
            />
          </label>
          <label>
            <span>当日经验状态</span>
            <select
              value={settings.baselineTiming}
              onChange={(event) =>
                updateBaseline(
                  settings.startDate,
                  event.target.value as TrackerSettings['baselineTiming'],
                )
              }
            >
              <option value="start-of-day">日初 · 今日尚未计算</option>
              <option value="end-of-day">日终 · 今日已包含</option>
            </select>
          </label>
          <label>
            <span>当前等级</span>
            <input
              type="number"
              min="1"
              value={settings.currentLevel}
              onChange={(event) =>
                updateSetting('currentLevel', Math.max(1, Number(event.target.value) || 1))
              }
            />
          </label>
          <label>
            <span>当前经验</span>
            <span className="suffix-input">
              <input
                type="number"
                min="0"
                max="100"
                step="0.01"
                value={settings.currentPercent}
                onChange={(event) =>
                  updateSetting(
                    'currentPercent',
                    Math.max(0, Math.min(100, Number(event.target.value) || 0)),
                  )
                }
              />
              <em>%</em>
            </span>
          </label>
          {[200, 203, 206].map((level) => (
            <label className="requirement-field" key={level}>
              <span>{level}级升级经验</span>
              <input
                type="number"
                min="1"
                step="1"
                value={settings.levelRequirements[String(level)]}
                onChange={(event) =>
                  updateLevelRequirement(level as 200 | 203 | 206, event.target.value)
                }
              />
              <small>
                {formatYiExp(settings.levelRequirements[String(level)])}
                {level === 206 ? ' · 按前段涨幅推算' : ''}
              </small>
            </label>
          ))}
          <label>
            <span>升级活动</span>
            <strong>
              自然升级 +{settings.eventExtraLevels}级 · 共{settings.eventExtraLevels + 1}级
            </strong>
          </label>
        </div>
        <div className="command-progress">
          <span style={{ width: `${Math.min(100, settings.currentPercent)}%` }} />
        </div>
      </section>

      <section className={`final-forecast ${targetReached ? 'reached' : 'short'}`}>
        <div>
          <span className="tracker-eyebrow">FINAL / {settings.endDate.replaceAll('-', '.')}</span>
          <h2>{formatProgress(projection.final)}</h2>
          <p>
            {targetReached
              ? `预计 ${formatDate(projection.reachedTargetDate ?? settings.endDate)} 达到 Lv.${settings.targetLevel}`
              : `按当前计划尚未达到 Lv.${settings.targetLevel}`}
          </p>
        </div>
        <dl>
          <div>
            <dt>计划总经验</dt>
            <dd>{formatExp(projection.totalEarnedExp)}</dd>
          </div>
          <div>
            <dt>{targetReached ? '206级经验余量' : '距离升级缺口'}</dt>
            <dd>{formatExp(Math.abs(projection.targetDeltaExp))}</dd>
          </div>
          <div>
            <dt>日常 / 周常</dt>
            <dd>
              {formatExp(totals.daily)} / {formatExp(totals.weekly)}
            </dd>
          </div>
        </dl>
      </section>

      <section className="source-editor">
        <button
          className="source-editor-toggle"
          type="button"
          onClick={() => setSourcesOpen(!sourcesOpen)}
        >
          <span>
            <span className="tracker-eyebrow">01 / EXPERIENCE SOURCES</span>
            <strong>任务经验设置</strong>
            <small>完成修改后，点击刷新同步至每日与每周计划</small>
          </span>
          <b>{sourcesOpen ? '收起 ↑' : '展开编辑 ↓'}</b>
        </button>
        {sourcesOpen && (
          <div className="source-editor-body">
            <div className="source-editor-head">
              <span>启用</span>
              <span>任务来源</span>
              <span>单次参数</span>
              <span>每日 / 每次总经验</span>
              <span>周经验参考</span>
            </div>
            {sourceEditorGroups.map((group) => (
              <div className="source-editor-group" key={group.key}>
                <div className="source-group-title">
                  <span>{group.label}</span>
                  <small>{group.note}</small>
                </div>
                {group.items.map((source) => {
                  const index = draftSources.findIndex((item) => item.id === source.id);
                  const effectiveExp = sourceExperience(source);
                  const purchase = purchaseLabel(source);
                  return (
                    <div
                      className={`source-edit-row ${!source.enabled ? 'disabled' : ''} ${source.optionalPurchase ? 'purchase-source' : ''}`}
                      key={source.id}
                    >
                      <label className="source-switch">
                        <input
                          type="checkbox"
                          checked={source.enabled}
                          onChange={(event) =>
                            updateSource(source.id, { enabled: event.target.checked })
                          }
                        />
                        <i />
                      </label>
                      <span className="source-name">
                        <small>{String(index + 1).padStart(2, '0')}</small>
                        <span>
                          <strong>{source.name}</strong>
                          {purchase && <em>{purchase} · 每周限 1 次</em>}
                        </span>
                      </span>
                      <SourceParameterEditor
                        source={source}
                        onChange={(patch) => updateSource(source.id, patch)}
                      />
                      <strong className="calculated-exp">{formatYiExp(effectiveExp)}</strong>
                      <strong>
                        {source.frequency === 'daily'
                          ? formatYiExp(effectiveExp * 7)
                          : `${formatYiExp(effectiveExp)} / 次`}
                      </strong>
                    </div>
                  );
                })}
              </div>
            ))}
            <div className={`source-editor-total ${sourcesDirty ? 'has-changes' : ''}`}>
              <span>
                草稿汇总<small>{sourcesDirty ? '有未同步修改' : '已同步至周计划'}</small>
              </span>
              <strong>{formatYiExp(draftTotals.daily)} / 天</strong>
              <strong>
                {formatYiExp(draftTotals.daily * 7)} + {formatYiExp(draftTotals.weekly)} / 完整周
              </strong>
              <button type="button" onClick={syncSourcesToPlan} disabled={!sourcesDirty}>
                {sourcesDirty ? '刷新并同步周计划 ↻' : '已同步 ✓'}
              </button>
            </div>
          </div>
        )}
      </section>

      <section className="weekly-workspace">
        <div className="section-intro">
          <div>
            <span className="tracker-eyebrow">02 / WEEKLY TRACKING</span>
            <h2>按周执行与校准</h2>
          </div>
          <p>为周常设置实际领取日；若当天已填写日终校准，周常经验视为已包含，不会再次累计。</p>
        </div>
        <div className="week-list">
          {projection.weeks.map((week, weekIndex) => {
            const expanded = openWeek === week.key;
            const weekCompletedIds = [
              ...new Set(week.days.flatMap((day) => day.completedSourceIds)),
            ];
            const weekBaselineIncludedIds = [
              ...new Set(
                records
                  .filter((record) => weekKey(record.date) === week.key)
                  .flatMap((record) => record.baselineIncludedSourceIds ?? []),
              ),
            ];
            const showDungeonBaselineControl =
              week.key === weekKey(settings.startDate) && settings.baselineTiming === 'end-of-day';
            const completionDates = Object.fromEntries(
              records
                .filter((record) => weekKey(record.date) === week.key)
                .flatMap((record) =>
                  record.completedSourceIds
                    .filter((id) =>
                      sources.some((source) => source.id === id && source.frequency === 'weekly'),
                    )
                    .map((id) => [id, record.date]),
                ),
            );
            const claimableWeekDates = week.days
              .map((day) => day.date)
              .filter((date) => !(showDungeonBaselineControl && date === settings.startDate));
            const latestCalibratedDate = [...week.days]
              .reverse()
              .find((day) => day.calibrated)?.date;
            const weeklyScheduleDate =
              latestCalibratedDate ?? claimableWeekDates.at(-1) ?? week.endDate;
            return (
              <article className={`week-section ${expanded ? 'expanded' : ''}`} key={week.key}>
                <button
                  className="week-summary"
                  type="button"
                  onClick={() => setOpenWeek(expanded ? null : week.key)}
                >
                  <span className="week-number">0{weekIndex + 1}</span>
                  <span className="week-period">
                    <small>
                      {formatShortDate(week.startDate)} — {formatShortDate(week.endDate)}
                    </small>
                    <strong>第 {weekIndex + 1} 周</strong>
                  </span>
                  <span>
                    <small>期初</small>
                    <strong>{formatProgress(week.start)}</strong>
                  </span>
                  <span>
                    <small>日常 / 周常新增</small>
                    <strong>
                      {formatExp(week.dailyEarnedExp)} / {formatExp(week.weeklyEarnedExp)}
                    </strong>
                  </span>
                  <span>
                    <small>本周结束预测</small>
                    <strong className="forecast-value">{formatProgress(week.end)}</strong>
                  </span>
                  <b>{expanded ? '−' : '+'}</b>
                </button>
                {expanded && (
                  <div className="week-days">
                    <WeekTaskPanel
                      sources={sources.filter(
                        (source) => source.enabled && source.frequency === 'weekly',
                      )}
                      completedIds={weekCompletedIds}
                      baselineIncludedIds={weekBaselineIncludedIds}
                      completionDates={completionDates}
                      weekDates={claimableWeekDates}
                      showDungeonBaselineControl={showDungeonBaselineControl}
                      onToggle={(source) => toggleTask(weeklyScheduleDate, source)}
                      onCompletionDateChange={(source, date) =>
                        moveWeeklyTaskToDate(week.key, source.id, date)
                      }
                      onDungeonBaselineChange={(source, included) =>
                        updateWeeklyDungeonBaseline(week.key, source.id, included)
                      }
                    />
                    <div className="day-row day-head">
                      <span>日期</span>
                      <span>日常任务 / 周常状态</span>
                      <span>日常经验</span>
                      <span>日常预测</span>
                      <span>实际日终经验</span>
                      <span />
                    </div>
                    {week.days.map((day) => {
                      const record = records.find((item) => item.date === day.date)!;
                      const activeCompleted = record.completedSourceIds.filter(
                        (id) =>
                          enabledIds.has(id) &&
                          sources.some(
                            (source) => source.id === id && source.frequency === 'daily',
                          ),
                      );
                      const dayExpanded = openDay === day.date;
                      const weeklyStatus =
                        day.claimedWeeklySourceIds.length > 0
                          ? day.calibrated
                            ? `今日领取 ${day.claimedWeeklySourceIds.length} 项 · 已含校准`
                            : `今日领取 ${day.claimedWeeklySourceIds.length} 项`
                          : day.completedWeeklySourceIds.length > 0
                            ? `周常已完成 ${day.completedWeeklySourceIds.length} 项`
                            : '周常待完成';
                      return (
                        <div
                          className={`day-block ${day.calibrated ? 'calibrated' : ''}`}
                          key={day.date}
                        >
                          <div className="day-row">
                            <button
                              className="date-button"
                              type="button"
                              onClick={() => setOpenDay(dayExpanded ? null : day.date)}
                            >
                              <small>
                                {new Intl.DateTimeFormat('zh-CN', { weekday: 'short' }).format(
                                  new Date(`${day.date}T00:00:00`),
                                )}
                              </small>
                              <strong>{formatShortDate(day.date)}</strong>
                            </button>
                            <span className="task-count">
                              <span>
                                <b>{activeCompleted.length}</b> 项日常
                              </span>
                              <small
                                className={day.claimedWeeklySourceIds.length > 0 ? 'claimed' : ''}
                              >
                                {weeklyStatus}
                              </small>
                            </span>
                            <span className="day-exp">
                              <strong>
                                {day.date === settings.startDate
                                  ? day.earnedExp > 0
                                    ? `今日 ${formatExp(day.earnedExp)}`
                                    : '基准日'
                                  : formatExp(day.earnedExp)}
                              </strong>
                              {day.weeklyEarnedExp > 0 && (
                                <small>
                                  {day.calibrated
                                    ? '周常经验已由校准吸收'
                                    : `周常另计 +${formatExp(day.weeklyEarnedExp)}`}
                                </small>
                              )}
                            </span>
                            <span className="day-result">
                              <small>{formatProgress(day.start)}</small>
                              <b>→ {formatProgress(day.predictedEnd)}</b>
                            </span>
                            {day.date === settings.startDate ? (
                              <span className="baseline-label">
                                {settings.baselineTiming === 'end-of-day'
                                  ? '日终基准'
                                  : '从今日开始'}
                              </span>
                            ) : (
                              <label className="actual-input">
                                <input
                                  aria-label={`${formatDate(day.date)}实际日终经验百分比`}
                                  type="number"
                                  min="0"
                                  max="100"
                                  step="0.01"
                                  placeholder="填写校准"
                                  value={record.actualPercent ?? ''}
                                  onChange={(event) =>
                                    updateActualPercent(day.date, event.target.value)
                                  }
                                />
                                <em>%</em>
                              </label>
                            )}
                            <button
                              className="expand-day"
                              type="button"
                              onClick={() => setOpenDay(dayExpanded ? null : day.date)}
                            >
                              {dayExpanded ? '收起' : day.calibrated ? '已校准' : '日常'}
                            </button>
                          </div>
                          {dayExpanded && (
                            <div className="day-tasks">
                              <div className="day-task-note">
                                <strong>{formatDate(day.date)}</strong>
                                <span>
                                  {day.date === settings.startDate
                                    ? settings.baselineTiming === 'end-of-day'
                                      ? '当日全部已勾选任务均已包含在当前基准，不会重复累计。'
                                      : '当日任务将从当前经验继续累计。'
                                    : day.calibrated
                                      ? `实际日终经验已校准为 ${record.actualPercent?.toFixed(2)}%，当天领取的周常经验也已包含其中。`
                                      : '取消勾选会立即从当日及后续预测中扣除；填写实际百分比可校准后续预测。'}
                                </span>
                              </div>
                              <DailyTaskList
                                sources={sources.filter((source) => source.enabled)}
                                completedIds={record.completedSourceIds}
                                expOverrides={record.sourceExpOverrides}
                                unitOverrides={record.sourceUnitOverrides}
                                allowExpOverride={
                                  day.date !== settings.startDate ||
                                  settings.baselineTiming === 'start-of-day'
                                }
                                onToggle={(source) => toggleTask(day.date, source)}
                                onExpOverride={(source, value) =>
                                  updateDailySourceExperience(day.date, source, value)
                                }
                                onUnitOverride={(source, value) =>
                                  updateDailySourceUnits(day.date, source, value)
                                }
                              />
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </article>
            );
          })}
        </div>
      </section>

      <footer className="tracker-footer">
        <span>BASELINE / {settings.startDate.replaceAll('-', '.')}</span>
        <button type="button" onClick={resetTracker}>
          恢复默认数据
        </button>
        <span>经验单位：亿 / 万亿 · 数据保存在当前浏览器</span>
      </footer>
    </main>
  );
}

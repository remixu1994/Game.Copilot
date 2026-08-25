import { useEffect, useMemo, useState } from "react";
import {
  calculatePerfectCores,
  getCoreKey,
  recommendNextCores,
} from "./perfectCoreCalculator";
import { loadProfessions, loadSkills } from "./perfectCoreDb";
import { professionCategories } from "./perfectCoreSeed";
import {
  referenceLayoutByProfessionId,
  supportedReferenceLayouts,
} from "./perfectCoreRecommendations";
import type {
  BoostCore,
  CoreMode,
  Profession,
  Skill,
  PerfectCoreResult,
} from "./perfectCoreTypes";
import { assetPath, sitePath } from "./sitePaths";
import "./perfect-core.css";

interface OwnedCore extends BoostCore {
  level: number;
}
interface ScoredResult extends PerfectCoreResult {
  matchedCount: number;
  replaceCount: number;
}
function SkillBadge({ skill, label }: { skill?: Skill; label?: string }) {
  return (
    <span className="core-skill">
      <span className="skill-avatar">
        {skill?.iconUrl ? (
          <img src={assetPath(skill.iconUrl)} alt="" />
        ) : (
          skill?.name.slice(0, 1)
        )}
      </span>
      <span>
        {label && <small>{label}</small>}
        {skill?.name ?? "未知技能"}
      </span>
    </span>
  );
}
const modeInfo: Record<
  CoreMode,
  { title: string; detail: string; count: number }
> = {
  "4CORE_6": { title: "4核6", detail: "完美方案 · 6 个技能 × 2 次", count: 6 },
  "3CORE_4_5": {
    title: "3核4.5",
    detail: "完美方案 · 4 个双强化 + 1 个半强化",
    count: 5,
  },
  "4CORE_4": { title: "4核4", detail: "过渡方案 · 4 个技能 × 3 次", count: 4 },
};

export default function PerfectCorePage() {
  const [professions, setProfessions] = useState<Profession[]>([]);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [professionId, setProfessionId] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("全部");
  const [mode, setMode] = useState<CoreMode>("4CORE_6");
  const [selected, setSelected] = useState<string[]>([]);
  const [halfSkillId, setHalfSkillId] = useState("");
  const [results, setResults] = useState<PerfectCoreResult[]>([]);
  const [ownedCores, setOwnedCores] = useState<OwnedCore[]>([]);
  const [ownedDraft, setOwnedDraft] = useState<OwnedCore>({
    mainSkillId: "",
    subSkillIds: ["", ""],
    level: 1,
  });
  const [ownedFilter, setOwnedFilter] = useState<
    "all" | "matched" | "remaining"
  >("all");
  const [message, setMessage] = useState("选择职业和技能后开始计算");
  const [search, setSearch] = useState("");
  const [skillSearch, setSkillSearch] = useState("");
  useEffect(() => {
    loadProfessions().then((items) => {
      setProfessions(items);
      setProfessionId(
        items.find((item) => item.id === "night-lord")?.id ??
          items[0]?.id ??
          "",
      );
    });
  }, []);
  useEffect(() => {
    if (professionId)
      loadSkills(professionId).then((items) => {
        setSkills(items);
        const recommended = items.filter((skill) => skill.recommended);
        if (recommended.length === 6) {
          setMode("4CORE_6");
          setSelected(recommended.map((skill) => skill.id));
        }
      });
  }, [professionId]);
  useEffect(() => {
    setSelected([]);
    setHalfSkillId("");
    setResults([]);
    setOwnedCores([]);
    setMessage("选择目标技能后开始计算");
  }, [professionId]);
  useEffect(() => {
    setResults([]);
    if (mode !== "3CORE_4_5") setHalfSkillId("");
  }, [mode]);
  const visibleSkills = useMemo(
    () => skills.filter((skill) => skill.name.includes(skillSearch)),
    [skills, skillSearch],
  );
  const referenceLayout = referenceLayoutByProfessionId[professionId];
  const skillMap = useMemo(
    () => new Map(skills.map((skill) => [skill.id, skill])),
    [skills],
  );
  const availableCategories = professionCategories.filter((category) =>
    professions.some((profession) => profession.category === category),
  );
  const visibleProfessions = professions.filter(
    (profession) =>
      (categoryFilter === "全部" || profession.category === categoryFilter) &&
      (profession.name.includes(search) ||
        profession.category.includes(search)),
  );
  const scoredResults = useMemo<ScoredResult[]>(
    () =>
      results
        .map((result) => {
          const matchedCount = ownedCores.filter((owned) =>
            result.cores.some((core) => getCoreKey(core) === getCoreKey(owned)),
          ).length;
          return {
            ...result,
            matchedCount,
            replaceCount: result.cores.length - matchedCount,
          };
        })
        .sort(
          (a, b) =>
            a.replaceCount - b.replaceCount || b.matchedCount - a.matchedCount,
        ),
    [results, ownedCores],
  );
  const filteredResults = scoredResults.filter((result) =>
    ownedFilter === "matched"
      ? result.matchedCount > 0
      : ownedFilter === "remaining"
        ? result.replaceCount > 0
        : true,
  );
  const nextRecommendations = useMemo(
    () => recommendNextCores(results, ownedCores),
    [results, ownedCores],
  );
  const toggleSkill = (id: string) => {
    setSelected((current) =>
      current.includes(id)
        ? current.filter((item) => item !== id)
        : [...current, id],
    );
    setResults([]);
  };
  const changeMode = (nextMode: CoreMode) => {
    const targetCount = modeInfo[nextMode].count;
    const recommended = skills
      .filter((skill) => skill.recommended)
      .map((skill) => skill.id);
    setMode(nextMode);
    setSelected((current) =>
      recommended.length >= targetCount
        ? recommended.slice(0, targetCount)
        : current.slice(0, targetCount),
    );
    setMessage(
      nextMode === "4CORE_4"
        ? "4核4是过渡方案，需要后续转换为完美核心"
        : "选择目标技能后开始计算",
    );
  };
  const calculate = () => {
    const output = calculatePerfectCores({
      mode,
      selectedSkillIds: selected,
      halfSkillId: mode === "3CORE_4_5" ? halfSkillId : undefined,
    });
    setResults(output.results);
    setMessage(
      output.error ??
        (output.results.length
          ? `找到 ${output.results.length} 种${mode === "4CORE_4" ? "过渡" : "可用"}方案`
          : "没有满足条件的核心组合"),
    );
  };
  const addOwnedCore = () => {
    const [main, sub1, sub2] = [
      ownedDraft.mainSkillId,
      ...ownedDraft.subSkillIds,
    ];
    if (!main || !sub1 || !sub2)
      return setMessage("请完整选择已有核心的 3 个技能");
    if (new Set([main, sub1, sub2]).size !== 3)
      return setMessage("一个核心内不能重复技能");
    setOwnedCores((current) => [
      ...current,
      { ...ownedDraft, subSkillIds: [sub1, sub2].sort() as [string, string] },
    ]);
    setOwnedDraft({ mainSkillId: "", subSkillIds: ["", ""], level: 1 });
    setOwnedFilter("all");
  };
  return (
    <main className="perfect-shell">
      <header className="perfect-header">
        <a className="perfect-brand" href={sitePath('/')}>
          Maple<span>Lab</span>
        </a>
        <div>
          <span className="eyebrow">UTILITY / 05</span>
          <h1>完美核心</h1>
          <p>选择推荐技能，生成目标组合，再用已有核心筛选最省替换方案。</p>
        </div>
        <span aria-hidden="true" />
      </header>
      <div className="perfect-layout">
        <aside className="perfect-sidebar">
          <div className="side-heading">
            <span>01</span>
            <h2>选择职业</h2>
          </div>
          <input
            className="line-input"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="搜索职业或分类"
          />
          <div className="category-filter">
            <button
              className={categoryFilter === "全部" ? "active" : ""}
              onClick={() => setCategoryFilter("全部")}
            >
              全部 <small>{professions.length}</small>
            </button>
            {availableCategories.map((category) => (
              <button
                key={category}
                className={categoryFilter === category ? "active" : ""}
                onClick={() => setCategoryFilter(category)}
              >
                {category}
                <small>
                  {
                    professions.filter(
                      (profession) => profession.category === category,
                    ).length
                  }
                </small>
              </button>
            ))}
          </div>
          <div className="profession-count">
            {categoryFilter === "全部" ? "全部职业" : categoryFilter}
            <span>{visibleProfessions.length} 个</span>
          </div>
          <div className="profession-grid">
            {visibleProfessions.map((profession) => (
              <button
                key={profession.id}
                className={
                  profession.id === professionId
                    ? "profession-card active"
                    : "profession-card"
                }
                onClick={() => setProfessionId(profession.id)}
              >
                <span className="profession-avatar">
                  {profession.iconUrl ? (
                    <img src={assetPath(profession.iconUrl)} alt="" />
                  ) : (
                    profession.name.slice(0, 1)
                  )}
                </span>
                <strong>{profession.name}</strong>
                <small>{profession.category}</small>
              </button>
            ))}
            {visibleProfessions.length === 0 && (
              <p className="profession-empty">没有匹配的职业</p>
            )}
          </div>
        </aside>
        <section className="perfect-main">
          <div className="workspace-head">
            <div>
              <span className="eyebrow">02 / TARGET SKILLS</span>
              <h2>
                {professions.find((item) => item.id === professionId)?.name ??
                  "选择职业"}
              </h2>
              {referenceLayout && (
                <p className="reference-layout">
                  长图参考 <b>{referenceLayout}</b>
                  {!supportedReferenceLayouts.has(referenceLayout) && (
                    <span>当前版本暂未开放该计算模式</span>
                  )}
                </p>
              )}
            </div>
            <span className="selection-count">
              已选择 <b>{selected.length}</b> / {modeInfo[mode].count}
            </span>
          </div>
          <div className="mode-groups">
            <section className="mode-group">
              <div className="mode-group-title">
                <strong>完美方案</strong>
                <span>最终养成目标</span>
              </div>
              <div className="mode-row">
                {(["4CORE_6", "3CORE_4_5"] as CoreMode[]).map((item) => (
                  <button
                    key={item}
                    className={mode === item ? "mode active" : "mode"}
                    onClick={() => changeMode(item)}
                  >
                    <strong>{modeInfo[item].title}</strong>
                    <span>{modeInfo[item].detail}</span>
                  </button>
                ))}
              </div>
            </section>
            <section className="mode-group transition">
              <div className="mode-group-title">
                <strong>过渡方案</strong>
                <span>成型前临时使用</span>
              </div>
              <button
                className={
                  mode === "4CORE_4"
                    ? "mode transition-mode active"
                    : "mode transition-mode"
                }
                onClick={() => changeMode("4CORE_4")}
              >
                <span className="mode-copy">
                  <strong>{modeInfo["4CORE_4"].title}</strong>
                  <span>{modeInfo["4CORE_4"].detail}</span>
                </span>
                <b>非完美</b>
              </button>
            </section>
          </div>
          {mode === "4CORE_4" && (
            <div className="transition-note">
              <strong>4核4不是完美核心</strong>
              <span>
                4 个技能各出现 3 次，用于前期过渡；有效强化按 50
                级封顶，后续建议转为 3核4.5 或 4核6。
              </span>
            </div>
          )}
          <div className="skill-toolbar">
            <span>
              全部技能 <small>红点为推荐技能</small>
            </span>
            <input
              value={skillSearch}
              onChange={(event) => setSkillSearch(event.target.value)}
              placeholder="搜索技能"
            />
            <button
              onClick={() =>
                setSelected(visibleSkills.map((skill) => skill.id))
              }
            >
              全部选择
            </button>
            <button onClick={() => setSelected([])}>清空</button>
          </div>
          <div className="skill-explain">
            不知道选哪些技能？优先选择管理员预置的推荐技能；也可以参考领主伤害统计中占比最高的技能。
          </div>
          {visibleSkills.length > 0 ? (
            <div className="skill-grid">
              {visibleSkills.map((skill) => (
                <button
                  key={skill.id}
                  className={`${selected.includes(skill.id) ? "skill-tile selected" : "skill-tile"} ${skill.recommended ? "recommended" : ""}`}
                  onClick={() => toggleSkill(skill.id)}
                >
                  <span className="skill-avatar">
                    {skill.iconUrl ? (
                      <img src={assetPath(skill.iconUrl)} alt="" />
                    ) : (
                      skill.name.slice(0, 1)
                    )}
                  </span>
                  <span>
                    <strong>
                      {skill.name}
                      {skill.recommended && <i>推荐</i>}
                    </strong>
                    <small>
                      {selected.includes(skill.id) ? "已加入目标" : "点击选择"}
                    </small>
                  </span>
                  <b>{selected.includes(skill.id) ? "✓" : "+"}</b>
                </button>
              ))}
            </div>
          ) : (
            <div className="skill-empty">
              <strong>该职业的强化技能资料待补充</strong>
              <span>可前往数据维护页面录入技能、图标和推荐状态。</span>
            </div>
          )}
          {mode === "3CORE_4_5" && (
            <div className="half-row">
              <div>
                <span className="eyebrow">HALF BOOST</span>
                <strong>选择半强化技能</strong>
                <small>该技能在组合中只出现 1 次，获得 25 级强化。</small>
              </div>
              <select
                value={halfSkillId}
                onChange={(event) => setHalfSkillId(event.target.value)}
              >
                <option value="">请选择技能</option>
                {selected.map((id) => (
                  <option key={id} value={id}>
                    {skillMap.get(id)?.name}
                  </option>
                ))}
              </select>
            </div>
          )}
          <div className="calculate-bar">
            <span className={message.startsWith("找到") ? "success" : ""}>
              {message}
            </span>
            <button className="primary-action" onClick={calculate}>
              {mode === "4CORE_4" ? "生成过渡核心" : "生成完美核心"}{" "}
              <span>→</span>
            </button>
          </div>
          {results.length > 0 && (
            <>
              <OwnedCorePanel
                skills={skills}
                ownedCores={ownedCores}
                draft={ownedDraft}
                setDraft={setOwnedDraft}
                onAdd={addOwnedCore}
                onRemove={(index) =>
                  setOwnedCores((current) =>
                    current.filter((_, itemIndex) => itemIndex !== index),
                  )
                }
              />
              <NextCorePanel
                recommendations={nextRecommendations}
                skills={skills}
                onPick={(core) => setOwnedDraft({ ...core, level: 1 })}
              />
              <ResultList
                results={filteredResults}
                total={results.length}
                filter={ownedFilter}
                setFilter={setOwnedFilter}
                skillMap={skillMap}
                ownedCount={ownedCores.length}
                ownedCores={ownedCores}
                mode={mode}
              />
            </>
          )}
        </section>
      </div>
    </main>
  );
}

function OwnedCorePanel({
  skills,
  ownedCores,
  draft,
  setDraft,
  onAdd,
  onRemove,
}: {
  skills: Skill[];
  ownedCores: OwnedCore[];
  draft: OwnedCore;
  setDraft: (value: OwnedCore) => void;
  onAdd: () => void;
  onRemove: (index: number) => void;
}) {
  const optionList = (
    <>
      <option value="">选择技能</option>
      {skills.map((skill) => (
        <option key={skill.id} value={skill.id}>
          {skill.name}
        </option>
      ))}
    </>
  );
  return (
    <section className="owned-section">
      <div className="results-heading">
        <div>
          <span className="eyebrow">03 / OWNED CORES</span>
          <h2>
            我已有的核心 <em>{ownedCores.length}</em>
          </h2>
        </div>
        <span>录入后按可保留核心数量排序</span>
      </div>
      {ownedCores.map((core, index) => (
        <div className="owned-core-row" key={`${getCoreKey(core)}-${index}`}>
          <span className="owned-index">{index + 1}</span>
          <SkillBadge
            skill={skills.find((skill) => skill.id === core.mainSkillId)}
            label="主"
          />
          <SkillBadge
            skill={skills.find((skill) => skill.id === core.subSkillIds[0])}
          />
          <SkillBadge
            skill={skills.find((skill) => skill.id === core.subSkillIds[1])}
          />
          <span className="owned-level">Lv. {core.level}</span>
          <button className="remove-owned" onClick={() => onRemove(index)}>
            ×
          </button>
        </div>
      ))}
      <div className="owned-core-editor">
        <span className="owned-index">＋</span>
        <select
          value={draft.mainSkillId}
          onChange={(event) =>
            setDraft({ ...draft, mainSkillId: event.target.value })
          }
        >
          {optionList}
        </select>
        <select
          value={draft.subSkillIds[0]}
          onChange={(event) =>
            setDraft({
              ...draft,
              subSkillIds: [event.target.value, draft.subSkillIds[1]],
            })
          }
        >
          {optionList}
        </select>
        <select
          value={draft.subSkillIds[1]}
          onChange={(event) =>
            setDraft({
              ...draft,
              subSkillIds: [draft.subSkillIds[0], event.target.value],
            })
          }
        >
          {optionList}
        </select>
        <label className="owned-level-input">
          Lv.
          <input
            type="number"
            min="1"
            max="25"
            value={draft.level}
            onChange={(event) =>
              setDraft({
                ...draft,
                level: Math.max(1, Math.min(25, Number(event.target.value))),
              })
            }
          />
        </label>
        <button className="add-owned" onClick={onAdd}>
          添加
        </button>
      </div>
    </section>
  );
}

function NextCorePanel({
  recommendations,
  skills,
  onPick,
}: {
  recommendations: Array<{ core: BoostCore; planCount: number }>;
  skills: Skill[];
  onPick: (core: BoostCore) => void;
}) {
  return (
    <section className="next-core-section">
      <div className="results-heading">
        <div>
          <span className="eyebrow">NEXT STEP</span>
          <h2>下一枚推荐核心</h2>
        </div>
        <span>
          {recommendations.length ? "根据当前已拥有核心反推" : "暂无匹配方案"}
        </span>
      </div>
      {recommendations.length > 0 && (
        <div className="next-core-list">
          {recommendations.slice(0, 8).map((item, index) => (
            <button
              className="next-core-item"
              key={getCoreKey(item.core)}
              onClick={() => onPick(item.core)}
            >
              <b>{String(index + 1).padStart(2, "0")}</b>
              <div>
                <SkillBadge
                  skill={skills.find(
                    (skill) => skill.id === item.core.mainSkillId,
                  )}
                  label="主"
                />
                <SkillBadge
                  skill={skills.find(
                    (skill) => skill.id === item.core.subSkillIds[0],
                  )}
                />
                <SkillBadge
                  skill={skills.find(
                    (skill) => skill.id === item.core.subSkillIds[1],
                  )}
                />
              </div>
              <span>
                覆盖 {item.planCount} 个方案
                <br />
                <small>点击填入已有核心</small>
              </span>
            </button>
          ))}
        </div>
      )}
    </section>
  );
}

function ResultList({
  results,
  total,
  filter,
  setFilter,
  skillMap,
  ownedCount,
  ownedCores,
  mode,
}: {
  results: ScoredResult[];
  total: number;
  filter: "all" | "matched" | "remaining";
  setFilter: (value: "all" | "matched" | "remaining") => void;
  skillMap: Map<string, Skill>;
  ownedCount: number;
  ownedCores: OwnedCore[];
  mode: CoreMode;
}) {
  const [visible, setVisible] = useState(12);
  return (
    <section className="results-section">
      <div className="results-heading">
        <div>
          <span className="eyebrow">
            {mode === "4CORE_4"
              ? "04 / TRANSITION LAYOUTS"
              : "04 / CALCULATED LAYOUTS"}
          </span>
          <h2>
            {mode === "4CORE_4" ? "剩余过渡方案" : "剩余方案"}{" "}
            <em>
              {results.length} / {total}
            </em>
          </h2>
        </div>
        <div className="result-filters">
          <button
            className={filter === "all" ? "active" : ""}
            onClick={() => setFilter("all")}
          >
            全部
          </button>
          {ownedCount > 0 && (
            <>
              <button
                className={filter === "matched" ? "active" : ""}
                onClick={() => setFilter("matched")}
              >
                含已有核心
              </button>
              <button
                className={filter === "remaining" ? "active" : ""}
                onClick={() => setFilter("remaining")}
              >
                仍需替换
              </button>
            </>
          )}
        </div>
      </div>
      {ownedCount > 0 && (
        <p className="result-note">
          已按最少替换核心数排序；每个方案标记可直接保留的核心。
        </p>
      )}
      <div className="result-list">
        {results.slice(0, visible).map((result, index) => (
          <article
            className="result-item"
            key={result.cores
              .map(
                (core) => `${core.mainSkillId}-${core.subSkillIds.join("-")}`,
              )
              .join("_")}
          >
            <div className="result-number">
              {String(index + 1).padStart(2, "0")}
            </div>
            <div className="core-row">
              {result.cores.map((core) => {
                const kept = ownedCores.some(
                  (owned) => getCoreKey(owned) === getCoreKey(core),
                );
                return (
                  <div
                    className={kept ? "core-block kept" : "core-block"}
                    key={`${core.mainSkillId}-${core.subSkillIds.join("-")}`}
                  >
                    <SkillBadge
                      skill={skillMap.get(core.mainSkillId)}
                      label="主"
                    />
                    <SkillBadge skill={skillMap.get(core.subSkillIds[0])} />
                    <SkillBadge skill={skillMap.get(core.subSkillIds[1])} />
                    {kept && <small className="kept-label">已有，可保留</small>}
                  </div>
                );
              })}
            </div>
            <div className="result-meta">
              {ownedCount > 0 && (
                <strong>
                  可保留 {result.matchedCount} 核 · 需替换 {result.replaceCount}{" "}
                  核
                </strong>
              )}
              <div className="level-summary">
                {Object.entries(result.skillLevels).map(([id, level]) => (
                  <span key={id}>
                    {skillMap.get(id)?.name}
                    <b>{level}</b>
                  </span>
                ))}
              </div>
            </div>
          </article>
        ))}
      </div>
      {visible < results.length && (
        <button
          className="load-more"
          onClick={() => setVisible((value) => value + 12)}
        >
          加载更多方案
        </button>
      )}
    </section>
  );
}

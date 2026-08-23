import { useEffect, useMemo, useState } from 'react';
import './perfect-core.css';
import './perfect-core-adjustments.css';

type SkillId = 'cleave' | 'order' | 'bloom' | 'territory' | 'shard' | 'creation';
type OwnedCore = { id: string; skills: [SkillId, SkillId, SkillId] };

const skills: Array<{ id: SkillId; name: string; icon: string }> = [
  { id: 'cleave', name: '斩决', icon: '/core-icons/cleave.png' },
  { id: 'order', name: '御剑追击', icon: '/core-icons/order.png' },
  { id: 'bloom', name: '盛放之剑', icon: '/core-icons/bloom.png' },
  { id: 'territory', name: '剑域', icon: '/core-icons/territory.png' },
  { id: 'shard', name: '夏德', icon: '/core-icons/shard.png' },
  { id: 'creation', name: '缔造', icon: '/core-icons/creation.png' },
];

const skillMap = Object.fromEntries(skills.map((skill) => [skill.id, skill])) as Record<SkillId, (typeof skills)[number]>;
const targetPerSkill = 2;
const targetCoreCount = 4;
const storageKey = 'maplelab-perfect-cores';

const exampleCores: OwnedCore[] = [
  { id: 'example-1', skills: ['bloom', 'territory', 'order'] },
  { id: 'example-2', skills: ['bloom', 'territory', 'cleave'] },
  { id: 'example-3', skills: ['cleave', 'order', 'shard'] },
  { id: 'example-4', skills: ['cleave', 'territory', 'order'] },
  { id: 'example-5', skills: ['shard', 'creation', 'cleave'] },
  { id: 'example-6', skills: ['shard', 'creation', 'territory'] },
  { id: 'example-7', skills: ['creation', 'order', 'bloom'] },
  { id: 'example-8', skills: ['order', 'cleave', 'creation'] },
];

function combinations<T>(items: T[], count: number): T[][] {
  if (count === 0) return [[]];
  if (items.length < count) return [];
  const result: T[][] = [];
  items.forEach((item, index) => {
    combinations(items.slice(index + 1), count - 1).forEach((tail) => result.push([item, ...tail]));
  });
  return result;
}

function scoreCoreSet(cores: OwnedCore[]) {
  const counts = Object.fromEntries(skills.map(({ id }) => [id, 0])) as Record<SkillId, number>;
  cores.forEach((core) => core.skills.forEach((skill) => { counts[skill] += 1; }));
  const covered = skills.reduce((total, skill) => total + Math.min(counts[skill.id], targetPerSkill), 0);
  return { counts, covered, progress: Math.round((covered / (skills.length * targetPerSkill)) * 100) };
}

function solveOwnedCores(ownedCores: OwnedCore[]) {
  const eligibleSets: OwnedCore[][] = [];
  for (let size = Math.min(targetCoreCount, ownedCores.length); size >= 1; size -= 1) {
    combinations(ownedCores, size).forEach((set) => {
      const uniqueMains = new Set(set.map((core) => core.skills[0]));
      if (uniqueMains.size === set.length) eligibleSets.push(set);
    });
  }

  let best = eligibleSets[0] ?? [];
  let bestScore = scoreCoreSet(best);
  eligibleSets.forEach((set) => {
    const score = scoreCoreSet(set);
    if (score.covered > bestScore.covered || (score.covered === bestScore.covered && set.length > best.length)) {
      best = set;
      bestScore = score;
    }
  });

  const solution = eligibleSets.find((set) => {
    if (set.length !== targetCoreCount) return false;
    const { counts } = scoreCoreSet(set);
    return skills.every(({ id }) => counts[id] === targetPerSkill);
  });

  return { solution, best, ...bestScore };
}

function SkillIcon({ id, size = 'normal' }: { id: SkillId; size?: 'normal' | 'small' }) {
  const skill = skillMap[id];
  return <img className={`core-skill-icon ${size}`} src={skill.icon} alt={skill.name} title={skill.name} />;
}

function CoreEditor({ initial, onCancel, onSave }: { initial?: OwnedCore; onCancel: () => void; onSave: (skills: [SkillId, SkillId, SkillId]) => void }) {
  const [selected, setSelected] = useState<SkillId[]>(initial?.skills ?? []);
  const chooseSkill = (skill: SkillId) => {
    setSelected((current) => current.includes(skill) ? current.filter((item) => item !== skill) : current.length < 3 ? [...current, skill] : current);
  };

  return <div className="core-modal-backdrop" onMouseDown={onCancel}>
    <section className="core-modal" role="dialog" aria-modal="true" aria-labelledby="core-editor-title" onMouseDown={(event) => event.stopPropagation()}>
      <div className="core-modal-head">
        <div><small>添加已有核心</small><h2 id="core-editor-title">依次选择核心的三个技能</h2></div>
        <button type="button" onClick={onCancel} aria-label="关闭">×</button>
      </div>
      <p className="core-modal-tip">第一个是主技能，决定核心名称；三个技能不能重复。</p>
      <div className="core-editor-slots">
        {[0, 1, 2].map((index) => <div className={selected[index] ? 'filled' : ''} key={index}>
          <span>{index === 0 ? '主' : index}</span>
          {selected[index] ? <><SkillIcon id={selected[index]} /><b>{skillMap[selected[index]].name}</b></> : <em>请选择</em>}
        </div>)}
      </div>
      <div className="core-editor-skills">
        {skills.map((skill) => <button className={selected.includes(skill.id) ? 'selected' : ''} type="button" onClick={() => chooseSkill(skill.id)} key={skill.id}>
          <SkillIcon id={skill.id} /><span>{skill.name}</span><i>{selected.indexOf(skill.id) === 0 ? '主' : selected.includes(skill.id) ? selected.indexOf(skill.id) : ''}</i>
        </button>)}
      </div>
      <div className="core-modal-actions">
        <button type="button" onClick={onCancel}>取消</button>
        <button type="button" className="primary" disabled={selected.length !== 3} onClick={() => onSave(selected as [SkillId, SkillId, SkillId])}>保存核心</button>
      </div>
    </section>
  </div>;
}

export default function PerfectCorePage() {
  const [ownedCores, setOwnedCores] = useState<OwnedCore[]>(() => {
    try {
      const stored = localStorage.getItem(storageKey);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });
  const [editingId, setEditingId] = useState<string | 'new' | null>(null);
  const result = useMemo(() => solveOwnedCores(ownedCores), [ownedCores]);
  const editingCore = editingId && editingId !== 'new' ? ownedCores.find((core) => core.id === editingId) : undefined;

  useEffect(() => { localStorage.setItem(storageKey, JSON.stringify(ownedCores)); }, [ownedCores]);

  const saveCore = (coreSkills: [SkillId, SkillId, SkillId]) => {
    if (editingId && editingId !== 'new') {
      setOwnedCores((current) => current.map((core) => core.id === editingId ? { ...core, skills: coreSkills } : core));
    } else {
      setOwnedCores((current) => [...current, { id: crypto.randomUUID(), skills: coreSkills }]);
    }
    setEditingId(null);
  };

  const missing = skills.map((skill) => ({ ...skill, count: Math.max(0, targetPerSkill - result.counts[skill.id]) })).filter((skill) => skill.count > 0);

  return <main className="perfect-core-shell">
    <header className="core-topbar">
      <a className="core-brand" href="/">Maple<span>Lab</span></a>
      <div><small>御剑骑士</small><strong>完美核心计算器</strong></div>
      <a href="/">返回工具箱</a>
    </header>

    <section className="core-intro">
      <div><span>V MATRIX</span><h1>把已有核心，<br />拼成真正的<span>完美组合。</span></h1></div>
      <p>录入你背包里的三合一核心，工具会自动检查主技能冲突，并从中找出能毕业的组合。</p>
    </section>

    <section className="core-panel target-panel">
      <div className="core-section-title"><span>1</span><div><h2>完美核心</h2><p>当前按御剑骑士常用六技计算</p></div><a href="#core-rules">核心规则</a></div>
      <div className="core-plan-tabs" aria-label="核心方案"><button disabled>3核4.5</button><button className="active">4核6</button><button disabled>5核7.5</button><button disabled>6核9</button><button disabled>7核10.5</button></div>
      <div className="core-other-filter">其他⌄</div>
      <div className="target-skills">{skills.map((skill) => <div key={skill.id}><SkillIcon id={skill.id} /><span>{skill.name}</span></div>)}</div>
    </section>

    <section className="core-panel owned-panel">
      <div className="core-section-title"><span>2</span><div><h2>我的核心</h2><p>点击加号，把自己已有的三合一核心逐颗录入</p></div><div className="owned-actions"><button onClick={() => setOwnedCores(exampleCores)}>载入示例</button><button className="danger" onClick={() => setOwnedCores([])} disabled={!ownedCores.length}>清空</button></div></div>
      <div className="owned-core-list">
        {ownedCores.map((core) => <article className="owned-core-card" key={core.id}>
          <button className="remove-core" type="button" aria-label="删除核心" onClick={() => setOwnedCores((current) => current.filter((item) => item.id !== core.id))}>×</button>
          <button className="core-stack" type="button" onClick={() => setEditingId(core.id)} aria-label={`编辑${skillMap[core.skills[0]].name}核心`}>
            {core.skills.map((skill, index) => <span className={index === 0 ? 'main' : ''} key={skill}><SkillIcon id={skill} /></span>)}
          </button>
        </article>)}
        <button className="add-core" type="button" onClick={() => setEditingId('new')}><span>＋</span><small>添加核心</small></button>
      </div>
      {ownedCores.length > 0 && <p className="owned-summary">已录入 {ownedCores.length} 颗核心 · 点击任意核心可修改</p>}
    </section>

    <section className="core-panel result-core-panel">
      <div className="core-section-title"><span>3</span><div><h2>计算结果</h2><p>实时检查是否已经能够组成完美核心</p></div><i className={result.solution ? 'done' : ''}>{result.solution ? '可毕业' : '计算中'}</i></div>
      <div className="core-result-overview">
        <div className="progress-ring" style={{ '--progress': `${result.solution ? 360 : result.progress * 3.6}deg` } as React.CSSProperties}><div><strong>{result.solution ? 100 : result.progress}%</strong><small>毕业进度</small></div></div>
        <div className="result-message"><span>{result.solution ? '组合完成' : ownedCores.length ? '继续录入核心' : '等待你的核心'}</span><h3>{result.solution ? '已毕业！' : ownedCores.length ? `当前最佳覆盖 ${result.covered}/12` : '先添加已有核心'}</h3><p>{result.solution ? '这套核心可以凑出一组完整的 4核6技。' : missing.length ? `还缺：${missing.map((skill) => `${skill.name}×${skill.count}`).join('、')}` : '工具会自动从已有核心中寻找可用组合。'}</p></div>
      </div>

      {result.solution ? <div className="solution-list">{result.solution.map((core) => <div className="solution-row" key={core.id}><span>主</span><strong>{skillMap[core.skills[0]].name}</strong><div>{core.skills.map((skill) => <SkillIcon id={skill} size="small" key={skill} />)}</div></div>)}</div> : <div className="empty-result"><strong>{ownedCores.length ? '暂时还拼不成完整组合' : '尚未录入核心'}</strong><p>允许录入超过四颗，计算器会自动挑出正确的四颗。</p></div>}
    </section>

    <section className="core-rules" id="core-rules"><h2>4核6技判定规则</h2><p>四颗核心共有 12 个技能位；六个目标技能必须各出现两次，并且四颗核心的第一个主技能不能重复。</p></section>
    {editingId && <CoreEditor initial={editingCore} onCancel={() => setEditingId(null)} onSave={saveCore} />}
  </main>;
}

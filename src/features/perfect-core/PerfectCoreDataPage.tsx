import { useEffect, useState } from 'react';
import { assetPath, sitePath } from '../../shared/lib/sitePaths';
import {
  deleteProfession,
  deleteSkill,
  exportDatabase,
  loadAllProfessions,
  loadSkills,
  resetDatabase,
  saveProfession,
  saveSkill,
} from './perfectCoreDb';
import { professionCategories } from './perfectCoreSeed';
import type { Profession, Skill } from './perfectCoreTypes';
import './perfect-core.css';

const emptyProfession = (): Profession => ({
  id: `profession-${Date.now()}`,
  name: '',
  category: '其他职业',
  sortOrder: 99,
  active: true,
});
const emptySkill = (professionId: string): Skill => ({
  id: `skill-${Date.now()}`,
  professionId,
  name: '',
  sortOrder: 99,
  active: true,
  recommended: false,
});

export default function PerfectCoreDataPage() {
  const [professions, setProfessions] = useState<Profession[]>([]);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [currentId, setCurrentId] = useState('');
  const [draft, setDraft] = useState<Profession>();
  const [notice, setNotice] = useState('');
  const refresh = async (id = currentId) => {
    const items = await loadAllProfessions();
    setProfessions(items);
    const selected = id || items[0]?.id || '';
    setCurrentId(selected);
    setDraft(items.find((item) => item.id === selected) ?? items[0]);
    if (selected) setSkills(await loadSkills(selected, true));
  };
  useEffect(() => {
    refresh();
  }, []);
  const choose = async (id: string) => {
    setCurrentId(id);
    setDraft(professions.find((item) => item.id === id));
    setSkills(await loadSkills(id, true));
  };
  const save = async () => {
    if (!draft?.name.trim()) return setNotice('职业名称不能为空');
    await saveProfession(draft);
    setNotice('职业已保存');
    await refresh(draft.id);
  };
  const addProfession = async () => {
    const item = emptyProfession();
    await saveProfession(item);
    await refresh(item.id);
    setNotice('已新增职业，请填写名称');
  };
  const addSkill = async () => {
    if (!currentId) return;
    const item = emptySkill(currentId);
    await saveSkill(item);
    setSkills(await loadSkills(currentId, true));
  };
  const saveSkillRow = async (item: Skill) => {
    if (!item.name.trim()) return;
    await saveSkill(item);
    setNotice('技能已保存');
  };
  const download = async () => {
    const bytes = await exportDatabase();
    const copy = bytes.slice().buffer as ArrayBuffer;
    const blob = new Blob([copy], { type: 'application/x-sqlite3' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'perfect-core.sqlite';
    anchor.click();
    URL.revokeObjectURL(url);
  };
  return (
    <main className="perfect-shell data-shell">
      <header className="perfect-header">
        <a className="perfect-brand" href={sitePath('/perfect-core')}>
          Maple<span>Lab</span>
        </a>
        <div>
          <span className="eyebrow">DATABASE / LOCAL SQLITE</span>
          <h1>数据维护</h1>
          <p>维护职业分类、职业头像与可用于强化核心的技能资料。</p>
        </div>
        <a className="data-link" href={sitePath('/perfect-core')}>
          返回计算器 ↗
        </a>
      </header>
      <div className="data-toolbar">
        <button onClick={addProfession}>＋ 新增职业</button>
        <button onClick={download}>导出 SQLite</button>
        <button
          onClick={async () => {
            await resetDatabase();
            await refresh();
            setNotice('已恢复初始数据');
          }}
        >
          恢复初始数据
        </button>
        {notice && <span>{notice}</span>}
      </div>
      <div className="data-editor">
        <aside className="data-professions">
          {professions.map((item) => (
            <button
              key={item.id}
              className={item.id === currentId ? 'data-profession active' : 'data-profession'}
              onClick={() => choose(item.id)}
            >
              <span className="data-profession-avatar">
                {item.iconUrl ? (
                  <img src={assetPath(item.iconUrl)} alt="" />
                ) : (
                  item.name.slice(0, 1)
                )}
              </span>
              <span>
                <strong>{item.name || '未命名职业'}</strong>
                <small>{item.category}</small>
              </span>
            </button>
          ))}
        </aside>
        <section className="editor-main">
          {draft ? (
            <>
              <div className="editor-title">
                <div>
                  <span className="eyebrow">PROFESSION</span>
                  <h2>职业资料</h2>
                </div>
                <button
                  className="danger-link"
                  onClick={async () => {
                    await deleteProfession(draft.id);
                    await refresh();
                  }}
                >
                  删除职业
                </button>
              </div>
              <div className="profession-edit-preview">
                <span className="profession-avatar">
                  {draft.iconUrl ? (
                    <img src={assetPath(draft.iconUrl)} alt="" />
                  ) : (
                    draft.name.slice(0, 1)
                  )}
                </span>
                <div>
                  <strong>{draft.name || '未命名职业'}</strong>
                  <small>{draft.category}</small>
                </div>
              </div>
              <div className="edit-grid">
                <label>
                  职业名称
                  <input
                    value={draft.name}
                    onChange={(event) => setDraft({ ...draft, name: event.target.value })}
                  />
                </label>
                <label>
                  职业分类
                  <select
                    value={draft.category}
                    onChange={(event) => setDraft({ ...draft, category: event.target.value })}
                  >
                    {professionCategories.map((category) => (
                      <option key={category}>{category}</option>
                    ))}
                  </select>
                </label>
                <label>
                  头像 URL
                  <input
                    value={draft.iconUrl ?? ''}
                    onChange={(event) => setDraft({ ...draft, iconUrl: event.target.value })}
                  />
                </label>
                <label>
                  排序
                  <input
                    type="number"
                    value={draft.sortOrder}
                    onChange={(event) =>
                      setDraft({ ...draft, sortOrder: Number(event.target.value) })
                    }
                  />
                </label>
              </div>
              <button className="primary-action small-action" onClick={save}>
                保存职业
              </button>
              <div className="editor-title skills-editor-title">
                <div>
                  <span className="eyebrow">SKILLS</span>
                  <h2>强化技能</h2>
                </div>
                <button className="outline-action" onClick={addSkill}>
                  ＋ 新增技能
                </button>
              </div>
              <div className="skill-edit-list">
                {skills.map((item) => (
                  <div className="skill-edit-row" key={item.id}>
                    <input
                      value={item.name}
                      placeholder="技能名称"
                      onChange={(event) =>
                        setSkills((items) =>
                          items.map((row) =>
                            row.id === item.id ? { ...row, name: event.target.value } : row,
                          ),
                        )
                      }
                    />
                    <input
                      value={item.iconUrl ?? ''}
                      placeholder="图标 URL（可选）"
                      onChange={(event) =>
                        setSkills((items) =>
                          items.map((row) =>
                            row.id === item.id ? { ...row, iconUrl: event.target.value } : row,
                          ),
                        )
                      }
                    />
                    <input
                      type="number"
                      value={item.sortOrder}
                      onChange={(event) =>
                        setSkills((items) =>
                          items.map((row) =>
                            row.id === item.id
                              ? { ...row, sortOrder: Number(event.target.value) }
                              : row,
                          ),
                        )
                      }
                    />
                    <label className="recommended-toggle">
                      <input
                        type="checkbox"
                        checked={item.recommended}
                        onChange={(event) =>
                          setSkills((items) =>
                            items.map((row) =>
                              row.id === item.id
                                ? { ...row, recommended: event.target.checked }
                                : row,
                            ),
                          )
                        }
                      />
                      推荐
                    </label>
                    <button onClick={() => saveSkillRow(item)}>保存</button>
                    <button
                      className="danger-link"
                      onClick={async () => {
                        await deleteSkill(item.id);
                        setSkills(await loadSkills(currentId, true));
                      }}
                    >
                      删除
                    </button>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="empty-state">请先新增或选择职业</div>
          )}
        </section>
      </div>
    </main>
  );
}

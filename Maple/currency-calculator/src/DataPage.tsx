import { useMemo, useState } from 'react';
import './data.css';

type DataItem = { name: string; description: string; tag?: string };
type DataSection = { id: string; title: string; note: string; items: DataItem[] };

const sections: DataSection[] = [
  {
    id: 'basic',
    title: '基本属性',
    note: '角色成长与属性攻击力',
    items: [
      { name: '属性攻击力', description: '属性攻击力越高，技能伤害越强。根据基本属性和攻击力数值，获得各职业对应的属性（物理 / 魔法）。', tag: '伤害' },
      { name: '主属性', description: '通过角色升级、装备、各种成长获得。主属性可以大幅提高属性攻击力。', tag: '成长' },
      { name: '副属性', description: '副属性额外提高属性攻击力，与职业的主属性共同参与角色面板计算。', tag: '成长' },
    ],
  },
  {
    id: 'core',
    title: '核心',
    note: '战斗面板常用指标',
    items: [
      { name: '伤害增加', description: '造成的伤害增加。' },
      { name: '暴击率', description: '造成暴击的概率。' },
      { name: '领主攻击力', description: '攻击领主时额外提升的攻击力数值。' },
      { name: '暴击伤害', description: '造成暴击时伤害增加。' },
      { name: '攻击力', description: '通过装备等途径获得的攻击力数值之和。' },
      { name: '最终伤害', description: '经过技能、被动与各项增益结算后的最终伤害修正。' },
      { name: '无视防御率', description: '无视敌人防御率的比例。对怪物、玩家和技能发动的无视防御率进行乘算后适用，最高适用 100%。' },
    ],
  },
  {
    id: 'judgement',
    title: '判定',
    note: '命中与战斗判定',
    items: [
      { name: '命中率', description: '攻击命中怪物的概率。' },
      { name: '贯穿率', description: '无视对方格挡判定的比例。' },
      { name: '回避率', description: '回避对方攻击的概率。' },
      { name: '格挡率', description: '格挡对方攻击，使攻击无效。' },
      { name: '异常状态抗性', description: '减少进入异常状态的概率。' },
      { name: '减益持续时间减少', description: '减少大部分减益的持续时间，最高可以减少 80%。' },
    ],
  },
  {
    id: 'survival',
    title: '生存',
    note: '防御与资源',
    items: [
      { name: '物理防御力', description: '使对方的物理攻击下降相应数值。' },
      { name: '魔法防御力', description: '使对方的魔法攻击下降相应数值。' },
      { name: '体力', description: '每次受到伤害时会减少体力值。' },
      { name: '魔力', description: '使用技能时会消耗魔力。' },
      { name: '所受物理伤害减少', description: '使受到的物理伤害减少相应比例。' },
      { name: '所受魔法伤害减少', description: '使受到的魔法伤害减少相应比例。' },
    ],
  },
  {
    id: 'special',
    title: '特殊',
    note: '移动与增益',
    items: [
      { name: '移动速度', description: '角色移动的速度。' },
      { name: '跳跃力', description: '角色跳起的高度。' },
      { name: '坚韧', description: '抵抗对方击退攻击的能力。' },
      { name: '增益持续时间', description: '延长增益持续时间。' },
      { name: '热力增益时间', description: '延长热力增益持续时间。' },
    ],
  },
  {
    id: 'bonus',
    title: '加成',
    note: '收益与掉落',
    items: [
      { name: '道具掉落率', description: '增加普通 / 星之力战场、材料副本中的道具掉落率。' },
      { name: '金币获得量提高', description: '消灭怪物时获得更多金币。' },
      { name: '经验值增加', description: '消灭怪物时获得更多经验值，最高 370%。' },
      { name: '组队经验值增加', description: '组队状态下，所有队友消灭怪物获得的经验值增加。' },
    ],
  },
];

export default function DataPage() {
  const [active, setActive] = useState('basic');
  const [query, setQuery] = useState('');
  const activeSection = sections.find((section) => section.id === active) ?? sections[0];
  const filtered = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    if (!keyword) return activeSection.items;
    return activeSection.items.filter((item) =>
      `${item.name}${item.description}`.toLowerCase().includes(keyword),
    );
  }, [activeSection, query]);

  return (
    <main className="data-page">
      <header className="data-topbar">
        <a className="data-brand" href="/">Maple<span>Lab</span></a>
        <nav>
          <a href="/dps">伤害 DPS 模拟器</a>
          <a href="/currency">枫币计算器</a>
          <a className="current" href="/data">基础数据</a>
        </nav>
        <button type="button" aria-label="打开搜索">⌕</button>
      </header>
      <div className="data-layout">
        <aside className="data-sidebar">
          <div className="side-intro">
            <span>资料库 · 01</span>
            <h1>角色数据</h1>
            <p>基础属性、战斗指标与收益数据的集中整理。</p>
          </div>
          <div className="side-nav">
            {sections.map((section, index) => (
              <button
                className={active === section.id ? 'active' : ''}
                type="button"
                key={section.id}
                onClick={() => {
                  setActive(section.id);
                  setQuery('');
                }}
              >
                <b>{String(index + 1).padStart(2, '0')}</b>
                <span>{section.title}<small>{section.note}</small></span>
                <i>›</i>
              </button>
            ))}
          </div>
        </aside>
        <article className="data-article">
          <div className="article-breadcrumb">基础数据 <span>/</span> 角色属性</div>
          <div className="article-heading">
            <div>
              <span className="article-label">CHARACTER DATA</span>
              <h2>角色属性</h2>
              <p>了解每项属性的作用，以及它们如何参与角色构建与伤害计算。</p>
            </div>
            <div className="article-meta">
              <strong>2.360.3642</strong>
              <span>资料版本</span>
              <span>2025.06.25 更新</span>
            </div>
          </div>
          <div className="article-callout">
            <span>✦</span>
            <div>
              <strong>属性攻击力</strong>
              <p>属性攻击力越高，技能伤害越强。不同职业根据基本属性和攻击力获得物理或魔法属性。</p>
            </div>
          </div>
          <div className="data-toolbar">
            <div><strong>{activeSection.title}</strong><span>{activeSection.note}</span></div>
            <label>⌕<input placeholder="搜索当前分类" value={query} onChange={(event) => setQuery(event.target.value)} /></label>
          </div>
          <div className="attribute-grid">
            {filtered.map((item) => (
              <div className="attribute-item" key={item.name}>
                <div className="attribute-title"><span>{item.name}</span>{item.tag && <em>{item.tag}</em>}</div>
                <p>{item.description}</p>
              </div>
            ))}
          </div>
          {filtered.length === 0 && <div className="empty-data">没有找到匹配的属性，请尝试其他关键词。</div>}
          <footer className="data-footer">资料由编辑收集、核对与整理，仅供查询与参考。</footer>
        </article>
      </div>
    </main>
  );
}

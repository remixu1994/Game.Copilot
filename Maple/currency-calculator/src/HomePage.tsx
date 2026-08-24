import type { CSSProperties } from 'react';
import './home.css';

const tools = [
  { number: '01', title: '伤害 DPS 模拟器', description: '录入角色面板与技能频率，拆解爆发、常态输出和技能贡献。', href: '/dps', meta: '战斗分析 · 实时计算' },
  { number: '02', title: '枫币与水晶换算', description: '按市场枫币价格估算礼包价值、红水晶单价和常见消耗成本。', href: '/currency', meta: '货币效率 · 商店估价' },
  { number: '03', title: '完美核心规划', description: '选择职业推荐技能，生成核心组合，并根据已有核心筛选剩余方案。', href: '/perfect-core', meta: '52 职业 · 本地 SQLite' },
  { number: '04', title: '角色基础数据', description: '集中查询角色属性、战斗指标及其在角色构建中的实际作用。', href: '/data', meta: '资料库 · 属性说明' },
  { number: '05', title: '等级跟踪器', description: '按周拆解每日与每周经验来源，追踪活动期间的升级目标。', href: '/level-tracker', meta: '升级计划 · 每周执行' },
];

const portraits = [['adele.jpg', '御剑骑士'], ['night-lord.jpg', '隐士'], ['bishop.jpg', '主教'], ['zero.jpg', '神之子']] as const;

export default function HomePage() {
  return <main className="home-shell">
    <section className="home-hero">
      <header className="home-nav">
        <a className="home-brand" href="/" aria-label="MapleLab 首页">Maple<span>Lab</span></a>
        <nav aria-label="站点工具菜单"><a href="/dps">DPS 模拟</a><a href="/currency">货币换算</a><a href="/perfect-core">完美核心</a><a href="/data">基础数据</a><a href="/level-tracker">等级跟踪</a></nav>
        <a className="nav-action" href="/perfect-core">进入工具台 ↗</a>
      </header>
      <div className="hero-copy">
        <span className="hero-index">MAPLESTORY M / TOOL ARCHIVE</span>
        <h1>把复杂养成，<br />算得更明白。</h1>
        <p>伤害、货币、核心与角色数据，集中在一个轻量工具站里。</p>
        <div className="hero-actions"><a href="/perfect-core">规划完美核心 <span>→</span></a><a href="#tools">浏览全部工具</a></div>
      </div>
      <div className="hero-visual" aria-label="职业角色预览">
        <div className="visual-orbit"><span>52</span><small>职业资料</small></div>
        <div className="portrait-stack">{portraits.map(([image, name], index) => <figure key={image} style={{ '--portrait-index': index } as CSSProperties}><img src={`/assets/professions/${image}`} alt={name} /><figcaption>{name}</figcaption></figure>)}</div>
        <div className="visual-caption"><b>LOCAL FIRST</b><span>数据保存在你的浏览器中</span></div>
      </div>
      <div className="hero-foot"><span>01 — 04</span><span>持续补充职业与技能资料</span><a href="#tools">向下浏览 ↓</a></div>
    </section>
    <section className="tool-directory" id="tools">
      <div className="directory-head"><span>TOOLS / 04</span><div><h2>工具目录</h2><p>选择要处理的问题，直接进入工作页面。</p></div></div>
      <div className="tool-list">{tools.map((tool) => <a className="tool-row" href={tool.href} key={tool.number}><span className="tool-number">{tool.number}</span><div className="tool-copy"><small>{tool.meta}</small><h3>{tool.title}</h3><p>{tool.description}</p></div><span className="tool-arrow">↗</span></a>)}</div>
    </section>
    <section className="home-final"><span>READY / 现在开始</span><h2>先从你的职业与<br />完美核心开始。</h2><a href="/perfect-core">打开核心计算器 <b>→</b></a></section>
    <footer className="home-footer"><a className="home-brand" href="/">Maple<span>Lab</span></a><p>冒险岛手游玩家工具站 · 数据仅供规划参考</p><span>2026</span></footer>
  </main>;
}

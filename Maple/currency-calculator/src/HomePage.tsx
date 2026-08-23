import './home.css';
import './perfect-home.css';

const tools = [
  {
    href: '/upgrade',
    index: '01',
    eyebrow: 'EQUIPMENT UPGRADE',
    title: '装备升级实验室',
    description: '比较武器与防具升级材料，把经验、枫币和红水晶统一换算成人民币。',
    action: '开始计算',
    tone: 'gold',
  },
  {
    href: '/currency',
    index: '02',
    eyebrow: 'CURRENCY DESK',
    title: '货币价值工具',
    description: '计算枫币、红蓝水晶和活动币的实际价值，快速比较商店兑换效率。',
    action: '查看货币工具',
    tone: 'blue',
  },
  {
    href: '/dps',
    index: '03',
    eyebrow: 'DAMAGE SIMULATOR',
    title: '伤害 DPS 模拟器',
    description: '录入角色面板与技能数据，估算爆发、常态伤害和技能输出贡献。',
    action: '打开模拟器',
    tone: 'red',
  },
  {
    href: '/cores',
    index: '04',
    eyebrow: 'PERFECT V MATRIX',
    title: '完美核心计算器',
    description: '录入自己已有的三合一核心，自动找出能够组成 4核6技的毕业组合。',
    action: '开始组合',
    tone: 'cyan',
  },
];

export default function HomePage() {
  return <main className="home-shell">
    <header className="home-header">
      <a className="home-brand" href="/">Maple<span>Lab</span></a>
      <span>MapleStory M · 数据工具箱</span>
    </header>
    <section className="home-hero">
      <p>MAPLESTORY M TOOLBOX</p>
      <h1>把游戏数据，<br /><span>换成清楚的答案。</span></h1>
      <div><p>升级成本、货币价值与伤害模拟，都从这里开始。</p><span>向下选择工具 ↓</span></div>
    </section>
    <nav className="home-tool-grid" aria-label="工具菜单">
      {tools.map((tool) => <a className={`home-tool-card ${tool.tone}`} href={tool.href} key={tool.href}>
        <div className="home-card-top"><span>{tool.index}</span><small>{tool.eyebrow}</small><b>↗</b></div>
        <div><h2>{tool.title}</h2><p>{tool.description}</p></div>
        <strong>{tool.action}<i>→</i></strong>
      </a>)}
    </nav>
    <footer className="home-footer"><span>MapleLab</span><small>所有结果均基于当前输入与实测数据</small></footer>
  </main>;
}

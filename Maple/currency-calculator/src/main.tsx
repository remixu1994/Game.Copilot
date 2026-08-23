import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import CurrencyPage from './CurrencyPage';
import EquipmentUpgradePage from './EquipmentUpgradePage';
import HomePage from './HomePage';
import PerfectCorePage from './PerfectCorePage';
import './styles.css';
import './modal.css';

const Page = window.location.pathname.startsWith('/upgrade')
  ? EquipmentUpgradePage
  : window.location.pathname.startsWith('/currency')
    ? CurrencyPage
    : window.location.pathname.startsWith('/cores')
      ? PerfectCorePage
    : window.location.pathname.startsWith('/dps')
      ? App
      : HomePage;

if (window.location.pathname.startsWith('/upgrade')) document.title = '装备升级实验室 · MapleLab';
else if (window.location.pathname.startsWith('/currency')) document.title = '货币价值工具 · MapleLab';
else if (window.location.pathname.startsWith('/cores')) document.title = '完美核心计算器 · MapleLab';
else if (window.location.pathname.startsWith('/dps')) document.title = '伤害 DPS 模拟器 · MapleLab';
else document.title = 'MapleLab · MapleStory M 数据工具箱';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Page />
  </StrictMode>,
);

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import HomePage from './HomePage';
import CurrencyPage from './CurrencyPage';
import PerfectCorePage from './PerfectCorePage';
import PerfectCoreDataPage from './PerfectCoreDataPage';
import LevelTrackerPage from './LevelTrackerPage';
import EquipmentUpgradePage from './EquipmentUpgradePage';
import { perfectCoreAdminEnabled } from './perfectCoreAdmin';
import { currentRoutePath } from './sitePaths';
import './styles.css';
import './modal.css';

const path = currentRoutePath();
const isPerfectCoreAdminPath = path.startsWith('/admin/perfect-core/data');
const Page = isPerfectCoreAdminPath && perfectCoreAdminEnabled
  ? PerfectCoreDataPage
  : path === '/'
    ? HomePage
      : path.startsWith('/perfect-core') || isPerfectCoreAdminPath
      ? PerfectCorePage
      : path.startsWith('/level-tracker')
        ? LevelTrackerPage
      : path.startsWith('/dps')
        ? App
      : path.startsWith('/equipment-upgrade')
        ? EquipmentUpgradePage
      : path.startsWith('/currency')
          ? CurrencyPage
          : HomePage;

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Page />
  </StrictMode>,
);

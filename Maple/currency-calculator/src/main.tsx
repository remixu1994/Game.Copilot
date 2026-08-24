import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import HomePage from './HomePage';
import CurrencyPage from './CurrencyPage';
import DataPage from './DataPage';
import PerfectCorePage from './PerfectCorePage';
import PerfectCoreDataPage from './PerfectCoreDataPage';
import LevelTrackerPage from './LevelTrackerPage';
import { perfectCoreAdminEnabled } from './perfectCoreAdmin';
import './styles.css';
import './modal.css';
import './attack.css';

const path = window.location.pathname;
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
        : path.startsWith('/currency')
          ? CurrencyPage
          : path.startsWith('/data')
            ? DataPage
            : HomePage;

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Page />
  </StrictMode>,
);

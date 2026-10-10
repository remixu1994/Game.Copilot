import CurrencyPage from '../features/currency/CurrencyPage';
import DpsPage from '../features/dps/DpsPage';
import EquipmentUpgradePage from '../features/equipment-upgrade/EquipmentUpgradePage';
import HomePage from '../features/home/HomePage';
import LevelTrackerPage from '../features/level-tracker/LevelTrackerPage';
import PerfectCoreDataPage from '../features/perfect-core/PerfectCoreDataPage';
import PerfectCorePage from '../features/perfect-core/PerfectCorePage';
import { perfectCoreAdminEnabled } from '../features/perfect-core/perfectCoreAdmin';
import { currentRoutePath } from '../shared/lib/sitePaths';

export default function AppRouter() {
  const path = currentRoutePath();
  const isPerfectCoreAdminPath = path.startsWith('/admin/perfect-core/data');

  if (isPerfectCoreAdminPath && perfectCoreAdminEnabled) return <PerfectCoreDataPage />;
  if (path.startsWith('/perfect-core') || isPerfectCoreAdminPath) return <PerfectCorePage />;
  if (path.startsWith('/level-tracker')) return <LevelTrackerPage />;
  if (path.startsWith('/equipment-upgrade')) return <EquipmentUpgradePage />;
  if (path.startsWith('/currency')) return <CurrencyPage />;
  if (path.startsWith('/dps')) return <DpsPage />;

  return <HomePage />;
}

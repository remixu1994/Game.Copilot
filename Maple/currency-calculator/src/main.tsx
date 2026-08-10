import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import CurrencyPage from './CurrencyPage';
import './styles.css';
import './modal.css';

const Page = window.location.pathname.startsWith('/currency') ? CurrencyPage : App;

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Page />
  </StrictMode>,
);

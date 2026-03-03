import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '@frontend/styles/global.scss';
import App from '@frontend/App';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

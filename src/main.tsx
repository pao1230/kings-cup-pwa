import React from 'react';
import ReactDOM from 'react-dom/client';
import { HashRouter } from 'react-router-dom';
import App from './App';
import './index.css';
import { applyThemeAndLang } from './store/settingsStore';
import { loadSettings } from './lib/storage';

// Apply persisted theme/language before first paint (avoids flash).
applyThemeAndLang(loadSettings());

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    {/* HashRouter → works from static hosting & file:// with no server config. */}
    <HashRouter>
      <App />
    </HashRouter>
  </React.StrictMode>,
);

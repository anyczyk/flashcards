// index.tsx
import './fonts/fontello/css/fontello.css';
import './styles/styles.scss';
import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, HashRouter } from 'react-router-dom';
import { FlashcardProvider } from './context/FlashcardContext';
import App from './App';
import './i18n';
import { supportsES6 } from './utils/supportsES6'

const isCordova = !!window.cordova;
const container = document.getElementById('root');
const root = createRoot(container);

root.render(supportsES6 ?
    <FlashcardProvider>
        {isCordova ? (
            <HashRouter>
                <App />
            </HashRouter>
        ) : (
            <BrowserRouter>
                <App />
            </BrowserRouter>
        )}
    </FlashcardProvider> : <div className="o-update-your-device"><h1><i className="icon-logo-f" />lasho</h1><p>Update your device.</p></div>
);

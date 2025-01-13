// index.js
import './fonts/fontello/css/fontello.css';
import './styles/styles.scss';
import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, HashRouter } from 'react-router-dom';
import { FlashcardProvider } from './context/FlashcardContext';
import App from './App';
import './i18n';

const isCordova = !!window.cordova;
const container = document.getElementById('root');
const root = createRoot(container);

root.render(
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
    </FlashcardProvider>
);

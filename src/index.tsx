// index.js
import './fonts/fontello/css/fontello.css';
import './styles/styles.scss';
import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, HashRouter } from 'react-router-dom';
import { FlashcardProvider } from './context/FlashcardContext';
import App from './App';
import './i18n';

// Funkcja do sprawdzenia, czy aplikacja działa w Cordova
const isCordova = !!window.cordova;

// Opcjonalnie: Logowanie do konsoli dla celów debugowania
// console.log('Czy aplikacja działa w Cordova?', isCordova);

// Pobranie elementu DOM, do którego będzie renderowana aplikacja
const container = document.getElementById('root');
const root = createRoot(container);

// Renderowanie aplikacji z odpowiednim Routerem
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

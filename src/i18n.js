// src/i18n.js
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import translationEN from './languages/en/translation.json';
import translationPL from './languages/pl/translation.json';

const resources = {
    en: {
        translation: translationEN
    },
    pl: {
        translation: translationPL
    }
};

i18n
    .use(LanguageDetector)
    .use(initReactI18next)
    .init({
        resources,
        fallbackLng: 'en',
        supportedLngs: ['en', 'pl'], // Dodaj wsparcie dla konkretnych języków
        load: 'languageOnly', // Użyj tylko kodów językowych bez regionów
        detection: {
            order: ['localStorage', 'cookie', 'navigator'],
            caches: ['localStorage', 'cookie']
        },
        interpolation: { escapeValue: false }
    });

export default i18n;

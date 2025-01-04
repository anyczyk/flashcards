// src/i18n.js
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import translationEN from './languages/en/translation.json';
import translationPL from './languages/pl/translation.json';
import translationId from './languages/id/translation.json';
import translationEs from './languages/es/translation.json';
import translationFr from './languages/fr/translation.json';
import translationPt from './languages/pt/translation.json';
import translationDe from './languages/de/translation.json';
import translationIt from './languages/it/translation.json';
import translationJa from './languages/ja/translation.json';

const resources = {
    en: {
        translation: translationEN
    },
    pl: {
        translation: translationPL
    },
    id: {
        translation: translationId
    },
    es: {
        translation: translationEs
    },
    fr: {
        translation: translationFr
    },
    pt: {
        translation: translationPt
    },
    de: {
        translation: translationDe
    },
    it: {
        translation: translationIt
    },
    ja: {
        translation: translationJa
    }
};

i18n
    .use(LanguageDetector)
    .use(initReactI18next)
    .init({
        resources,
        fallbackLng: 'en',
        supportedLngs: ['en', 'pl', 'id', 'es', 'fr', 'pt', 'de', 'it', 'ja'],
        load: 'languageOnly',
        detection: {
            order: ['localStorage', 'cookie', 'navigator'],
            caches: ['localStorage', 'cookie']
        },
        interpolation: { escapeValue: false }
    });

export default i18n;

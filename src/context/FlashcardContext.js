import React, { createContext, useState, useEffect, useCallback } from 'react';
import { getAllFlashcards, addFlashcardToDB, removeFlashcardFromDB, editFlashcardInDB } from '../db';
import { setLocalStorage, getLocalStorage } from '../utils/storage';

export const FlashcardContext = createContext();
const rtlLangs = ["ug", "syr", "ks", "ar", "fa", "he", "ur", "ckb", "arc", "sd", "ps"];
const rtlCodeLangs = ["ug-CN", "syr-SY", "ks-IN", "ar-SA", "fa-IR", "he-IL", "ur-PK", "ckb-IQ", "arc-IQ", "sd-PK", "ps-AF"];

const languageMap = {
    "ar-SA": "العربية",
    "bg-BG": "български",
    "bn-BD": "বাংলা",
    "cs-CZ": "čeština",
    "da-DK": "dansk",
    "de-DE": "Deutsch",
    "el-GR": "Ελληνικά",
    "en-GB": "English",
    "en-US": "English",
    "es-ES": "Español",
    "es-US": "Español (Estados Unidos)",
    "es-MX": "Español",
    "et-EE": "eesti keel",
    "fa-IR": "فارسی",
    "fi-FI": "suomi",
    "fr-FR": "Français",
    "he-IL": "עברית",
    "hi-IN": "हिन्दी",
    "hr-HR": "hrvatski",
    "hu-HU": "magyar",
    "id-ID": "Bahasa Indonesia",
    "it-IT": "Italiano",
    "ja-JP": "日本語",
    "ko-KR": "한국어",
    "lt-LT": "lietuvių kalba",
    "lv-LV": "latviešu valoda",
    "mr-IN": "मराठी",
    "ms-MY": "Bahasa Melayu",
    "nl-NL": "Nederlands",
    "no-NO": "norsk",
    "pl-PL": "Polski",
    "pt-BR": "Português",
    "pt-PT": "Português",
    "ro-RO": "Română",
    "ru-RU": "Русский",
    "sk-SK": "slovenčina",
    "sl-SI": "slovenščina",
    "sv-SE": "svenska",
    "ta-IN": "தமிழ்",
    "te-IN": "తెలుగు",
    "th-TH": "ไทย",
    "tr-TR": "Türkçe",
    "uk-UA": "українська",
    "vi-VN": "Tiếng Việt",
    "zh-CN": "中文 (简体)",
    "zh-HK": "中文 (香港)",
    "zh-TW": "中文 (繁體)"
};


export const FlashcardProvider = ({ children }) => {
    const [dirAttribute, setDirAttribute] = useState('ltr');
    const [orderedCategories, setOrderedCategories] = useState([]);
    const [playFlashcards, setPlayFlashcards] = useState(false);
    const [currentLocalStorageCategoryOrder, setCurrentLocalStorageCategoryOrder] = useState(getLocalStorage("categoryOrder") || []);
    const [importSuccessMessage, setImportSuccessMessage] = useState('');
    const [flashcards, setFlashcards] = useState([]);
    const [categories, setCategories] = useState([]);
    const [allCategories, setAllCategories] = useState([]);
    const [superCategoriesArray, setSuperCategoriesArray] = useState([]);
    const [syntAudio, setSyntAudio] = useState(() => {
        const storedAudio = getLocalStorage('syntAudio');
        return storedAudio !== null ? storedAudio : true;
    });

    useEffect(() => {
        setLocalStorage("categoryOrder", currentLocalStorageCategoryOrder);
    }, [currentLocalStorageCategoryOrder]);

    useEffect(() => {
        setLocalStorage('syntAudio', syntAudio);
    }, [syntAudio]);

    const loadData = useCallback(async () => {
        const data = await getAllFlashcards();
        setFlashcards(data);

        const allCat = new Set(
            data.filter(fc => fc.category && fc.category.trim() !== '')
                .map(fc => fc.category)
        );

        const superCategories = new Set(
            data
                .filter(fc => fc.superCategory && fc.superCategory.trim() !== '')
                .map(fc => fc.superCategory)
        );

        const categoriesWithoutSuper = data
            .filter(fc =>
                fc.category &&
                fc.category.trim() !== '' &&
                (!fc.superCategory || fc.superCategory.trim() === '') &&
                !superCategories.has(fc.category)
            )
            .map(fc => fc.category);

        const catSet = new Set([...superCategories, ...categoriesWithoutSuper]);
        const cats = [...catSet];

        setSuperCategoriesArray([...superCategories]);
        setCategories(cats);
        setAllCategories([...allCat]);
    }, []);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const addFlashcard = async (front, back, category, know, langFront, langBack, superCategory, frontDesc) => {
        const newFc = await addFlashcardToDB(front, back, category, know, langFront, langBack, superCategory, frontDesc);
        setFlashcards((prev) => {
            const updated = [...prev, newFc];
            updateCategories(updated);
            return updated;
        });
    };

    const removeFlashcard = async (id) => {
        await removeFlashcardFromDB(id);
        setFlashcards((prev) => {
            const updated = prev.filter(fc => fc.id !== id);
            updateCategories(updated);
            return updated;
        });
    };

    const editFlashcard = async (id, updatedFront, updatedBack, updatedCategory, updatedKnow, updatedFrontLang, updatedBackLang, updateSuperCategory, updatedFrontDesc, updatedBackDesc) => {
        await editFlashcardInDB(id, updatedFront, updatedBack, updatedCategory, updatedKnow, updatedFrontLang, updatedBackLang, updateSuperCategory, updatedFrontDesc, updatedBackDesc);
        setFlashcards((prev) => {
            const updated = prev.map(fc =>
                fc.id === id
                    ? {
                        ...fc,
                        front: updatedFront,
                        back: updatedBack,
                        category: updatedCategory,
                        know: updatedKnow,
                        langFront: updatedFrontLang,
                        langBack: updatedBackLang,
                        superCategory: updateSuperCategory,
                        frontDesc: updatedFrontDesc,
                        backDesc: updatedBackDesc
                    }
                    : fc
            );
            updateCategories(updated);
            return updated;
        });
    };

    const setFlashcardKnow = async (id, knowValue) => {
        const card = flashcards.find(fc => fc.id === id);
        if (!card) return;
        await editFlashcardInDB(
            id,
            card.front,
            card.back,
            card.category,
            knowValue,
            card.langFront,
            card.langBack,
            card.superCategory,
            card.frontDesc,
            card.backDesc
        );
        setFlashcards((prev) =>
            prev.map(fc => (fc.id === id ? { ...fc, know: knowValue } : fc))
        );
    };

    const updateCategories = (flashcardsData) => {
        const superCategories = new Set(
            flashcardsData
                .filter(fc => fc.superCategory && fc.superCategory.trim() !== '')
                .map(fc => fc.superCategory)
        );

        const categoriesWithoutSuper = flashcardsData
            .filter(fc =>
                fc.category &&
                fc.category.trim() !== '' &&
                (!fc.superCategory || fc.superCategory.trim() === '') &&
                !superCategories.has(fc.category)
            )
            .map(fc => fc.category);

        const catSet = new Set([...superCategories, ...categoriesWithoutSuper]);
        const cats = [...catSet];

        setSuperCategoriesArray([...superCategories]);
        setCategories(cats);
    };

    return (
        <FlashcardContext.Provider
            value={{
                languageMap,
                rtlLangs, rtlCodeLangs,
                dirAttribute, setDirAttribute,
                importSuccessMessage,
                setImportSuccessMessage,
                currentLocalStorageCategoryOrder,
                setCurrentLocalStorageCategoryOrder,
                orderedCategories,
                setOrderedCategories,
                playFlashcards,
                setPlayFlashcards,
                flashcards,
                categories,
                allCategories,
                superCategoriesArray,
                syntAudio,
                setSyntAudio,
                loadData,
                addFlashcard,
                removeFlashcard,
                editFlashcard,
                setFlashcardKnow
            }}
        >
            {children}
        </FlashcardContext.Provider>
    );
};

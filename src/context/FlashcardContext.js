import React, { createContext, useState, useEffect, useCallback } from 'react';
import { getAllFlashcards, addFlashcardToDB, removeFlashcardFromDB, editFlashcardInDB } from '../db';
import { setLocalStorage, getLocalStorage } from '../utils/storage';

export const FlashcardContext = createContext();

export const FlashcardProvider = ({ children }) => {
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

        const anyWithoutCategory = data.some(fc => !fc.category || fc.category.trim() === '');
        const cats = [...catSet];
        if (anyWithoutCategory) {
            cats.push('Without category');
        }

        setSuperCategoriesArray([...superCategories]);
        setCategories(cats);
        setAllCategories([...allCat]);
    }, []);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const addFlashcard = async (front, back, category, know, langFront, langBack, superCategory) => {
        const newFc = await addFlashcardToDB(front, back, category, know, langFront, langBack, superCategory);
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

    const editFlashcard = async (id, updatedFront, updatedBack, updatedCategory, updatedKnow, updatedFrontLang, updatedBackLang, updateSuperCategory) => {
        await editFlashcardInDB(id, updatedFront, updatedBack, updatedCategory, updatedKnow, updatedFrontLang, updatedBackLang, updateSuperCategory);
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
                        superCategory: updateSuperCategory
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
            card.superCategory
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

        const anyWithoutCategory = flashcardsData.some(fc => !fc.category || fc.category.trim() === '');
        const cats = [...catSet];
        if (anyWithoutCategory) {
            cats.push('Without category');
        }

        setSuperCategoriesArray([...superCategories]);
        setCategories(cats);
    };

    return (
        <FlashcardContext.Provider
            value={{
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

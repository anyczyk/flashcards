// App.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { Routes, Route, Link, Navigate } from 'react-router-dom';
import CreateFlashcard from './components/CreateFlashcard';
import EditFlashcardList from './components/EditFlashcardList';
import ViewFlashcards from './components/ViewFlashcards';
import ImportExport from './components/ImportExport';
import { getAllFlashcards, addFlashcardToDB, removeFlashcardFromDB, editFlashcardInDB } from './db';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

function App() {
    const { t, i18n } = useTranslation();
    const [flashcards, setFlashcards] = useState([]);
    const [categories, setCategories] = useState([]);

    const navigate = useNavigate();

    const loadData = useCallback(async () => {
        const data = await getAllFlashcards();
        setFlashcards(data);

        const catSet = new Set(
            data
                .filter(fc => fc.category && fc.category.trim() !== '')
                .map(fc => fc.category)
        );
        const anyWithoutCategory = data.some(fc => !fc.category || fc.category.trim() === '');
        const cats = [...catSet];
        if (anyWithoutCategory) {
            cats.push('Without category');
        }

        setCategories(cats);
    }, []);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const addFlashcard = async (front, back, category) => {
        const newFc = await addFlashcardToDB(front, back, category);
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

    const editFlashcard = async (id, updatedFront, updatedBack, updatedCategory, updatedKnow) => {
        await editFlashcardInDB(id, updatedFront, updatedBack, updatedCategory, updatedKnow);
        setFlashcards((prev) => {
            const updated = prev.map(fc => fc.id === id ? { ...fc, front: updatedFront, back: updatedBack, category: updatedCategory, know: updatedKnow } : fc);
            updateCategories(updated);
            return updated;
        });
    };

    const setFlashcardKnow = async (id, knowValue) => {
        const card = flashcards.find(fc => fc.id === id);
        if (!card) return;
        await editFlashcardInDB(id, card.front, card.back, card.category, knowValue);
        setFlashcards((prev) => {
            return prev.map(fc => fc.id === id ? { ...fc, know: knowValue } : fc);
        });
    };

    const updateCategories = (flashcardsData) => {
        const catSet = new Set(
            flashcardsData
                .filter(fc => fc.category && fc.category.trim() !== '')
                .map(fc => fc.category)
        );
        const anyWithoutCategory = flashcardsData.some(fc => !fc.category || fc.category.trim() === '');
        const cats = [...catSet];
        if (anyWithoutCategory) {
            cats.push('Without category');
        }
        setCategories(cats);
    };

    const changeLanguage = (lng) => {
        i18n.changeLanguage(lng);
    };

    const getLanguageCode = (lng) => lng.split('-')[0];

    const handleImport = () => {
        loadData();
    };

    return (
        <div>
            <nav>
                <ul>
                    <li><Link to="/">{t('view_flashcards')}</Link></li>
                    <li><Link to="/create">{t('create_flashcard')}</Link></li>
                    <li><Link to="/list-edit">{t('edit_flashcards')}</Link></li>
                    <li><Link to="/import-export">{t('import_export')}</Link></li>
                </ul>
                {i18n.language}
                <select onChange={(e) => changeLanguage(e.target.value)} value={getLanguageCode(i18n.language)}>
                    <option value="en">English</option>
                    <option value="pl">Polski</option>
                </select>
            </nav>

            <Routes>
                <Route path="/" element={<ViewFlashcards flashcards={flashcards} categories={categories}
                                                         setFlashcardKnow={setFlashcardKnow} />} />
                <Route path="/create" element={<CreateFlashcard addFlashcard={addFlashcard} categories={categories} />} />
                <Route path="/list-edit" element={<EditFlashcardList flashcards={flashcards} removeFlashcard={removeFlashcard} editFlashcard={editFlashcard} categories={categories} />} />
                <Route path="/import-export" element={<ImportExport onImport={handleImport} />} />
                {/* Trasa domyślna */}
                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>

            <footer>
                <p>{window.cordova ? 'Cordova' : 'Browser'}</p>
            </footer>
        </div>
    );
}

export default App;

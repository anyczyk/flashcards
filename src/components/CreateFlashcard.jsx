// CreateFlashcard.jsx
import React, { useState, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import { getCordovaLanguage } from '../utils/getLanguage';
import { loadLanguages } from '../utils/loadLanguages';
import SelectCodeLanguages from './sub-components/SelectCodeLanguages';
import { useTranslation } from 'react-i18next';
import { getAllFlashcards } from '../db';

function CreateFlashcard({ allCategories, addFlashcard, categories, superCategoriesArray }) {
    const { t } = useTranslation();
    const [front, setFront] = useState('');
    const [back, setBack] = useState('');
    const [category, setCategory] = useState('');
    const [superCategory, setSuperCategory] = useState('');
    const [langFront, setLangFront] = useState('');
    const [langBack, setLangBack] = useState('');
    const [flashcardCreated, setFlashcardCreated] = useState(false);
    const [availableLanguages, setAvailableLanguages] = useState([]);
    const [categoriesDependentOnSuperCategory, setCategoriesDependentOnSuperCategory] = useState([]);
    const [currentSelectSuperCategory, setCurrentSelectSuperCategory] = useState('');

    // Wczytujemy z bazy wszystkie fiszki i tworzymy z nich listę kategorii zależną od superkategorii.
    const loadData = useCallback(async () => {
        const data = await getAllFlashcards();
        const catDependSuperCategory = new Set(
            data
                .filter(fc => fc.category && fc.category.trim() !== '' && fc.superCategory === currentSelectSuperCategory)
                .map(fc => fc.category)
        );
        setCategoriesDependentOnSuperCategory([...catDependSuperCategory]);
    }, [currentSelectSuperCategory]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    // Wczytujemy dostępne języki
    useEffect(() => {
        const fetchLanguages = async () => {
            try {
                const languages = await loadLanguages();
                setAvailableLanguages(languages);
            } catch (error) {
                console.error('Error loading languages:', error);
                setAvailableLanguages(['en-US']);
            }
        };
        fetchLanguages();
    }, []);

    // Ustawienie języków po załadowaniu availableLanguages
    useEffect(() => {
        if (availableLanguages.length > 0) {
            const setLanguages = async () => {
                try {
                    const detectedLanguage = await getCordovaLanguage();
                    console.log('Detected language:', detectedLanguage);

                    if (availableLanguages.includes(detectedLanguage)) {
                        setLangFront(detectedLanguage);
                        setLangBack(detectedLanguage);
                    } else if (availableLanguages.includes('en-US')) {
                        setLangFront('en-US');
                        setLangBack('en-US');
                    } else {
                        setLangFront(availableLanguages[0]);
                        setLangBack(availableLanguages[0]);
                    }
                } catch (error) {
                    console.error('Error setting languages:', error);
                    // Ustawienie domyślnych języków w przypadku błędu
                    if (availableLanguages.includes('en-US')) {
                        setLangFront('en-US');
                        setLangBack('en-US');
                    } else {
                        setLangFront(availableLanguages[0]);
                        setLangBack(availableLanguages[0]);
                    }
                }
            };
            setLanguages();
        }
    }, [availableLanguages]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (front.trim() && back.trim()) {
            // Usunięcie białych znaków
            let finalCategory = category.trim();
            if (finalCategory.toLowerCase() === 'without category') {
                finalCategory = '';
            }

            // Ustaw domyślny język na 'en-US', jeśli nie wybrano żadnego
            const finalLangFront = langFront || 'en-US';
            const finalLangBack = langBack || 'en-US';
            const finalSuperCategory = superCategory.trim();

            console.log('Submitting flashcard with languages:', finalLangFront, finalLangBack);

            try {
                // Dodajemy fiszkę (logika w rodzicu/metodzie addFlashcard)
                await addFlashcard({
                    front,
                    back,
                    category: finalCategory,
                    langFront: finalLangFront,
                    langBack: finalLangBack,
                    superCategory: finalSuperCategory
                });

                // LOGIKA ZAPISU DO LOCAL STORAGE
                // ------------------------------
                // Jeżeli superCategory jest niepuste, to zapisujemy superCategory.
                // W przeciwnym razie, jeśli category jest niepuste, zapisujemy category.
                let categoryToStore = finalSuperCategory || finalCategory;

                // Czytamy localStorage
                const savedOrder = localStorage.getItem('categoryOrder');
                let savedOrderArray = savedOrder ? JSON.parse(savedOrder) : [];

                // Dodajemy kategorię na POCZĄTEK tablicy
                // usuwając wcześniej duplikat (jeśli istnieje),
                // aby uniknąć dwukrotnego występowania tej samej wartości
                if (categoryToStore) {
                    const index = savedOrderArray.indexOf(categoryToStore);
                    if (index !== -1) {
                        // Usuwamy istniejącą pozycję
                        savedOrderArray.splice(index, 1);
                    }
                    // Wstawiamy na początek
                    savedOrderArray.unshift(categoryToStore);
                }

                // Nadpisujemy localStorage
                localStorage.setItem('categoryOrder', JSON.stringify(savedOrderArray));
                // ------------------------------

                // Komunikat o utworzeniu fiszki
                setFlashcardCreated(true);

                // Resetujemy front/back
                setFront('');
                setBack('');
            } catch (error) {
                console.error('Error adding flashcard:', error);
            }
        }
    };

    const handleSuperCategorySelect = (e) => {
        const selected = e.target.value;
        if (selected) {
            setSuperCategory(selected);
            setCurrentSelectSuperCategory(selected);
        } else {
            setSuperCategory('');
            setCurrentSelectSuperCategory('');
        }
    };

    const handleCategorySelect = (e) => {
        const selected = e.target.value;
        if (selected) {
            setCategory(selected);
        } else {
            setCategory('');
        }
    };

    // Automatyczne ukrycie komunikatu po 3 sekundach
    useEffect(() => {
        let timer;
        if (flashcardCreated) {
            timer = setTimeout(() => {
                setFlashcardCreated(false);
            }, 3000);
        }
        return () => clearTimeout(timer);
    }, [flashcardCreated]);

    // Filtrowanie kategorii, aby nie pokazywać "Without category"
    const filteredCategories = categories.filter(cat => cat.toLowerCase() !== 'without category');

    return (
        <div className="o-page-create-flashcard">
            <h2>Create a new Flashcard</h2>
            <hr />
            <form className="o-card" onSubmit={handleSubmit}>
                <div className="o-card__content">
                    <p>
                        <label htmlFor="o-front">
                            <span className="color-red">*</span> Front:
                        </label>
                        <textarea
                            value={front}
                            onChange={(e) => setFront(e.target.value)}
                            rows="3"
                            cols="30"
                            id="o-front"
                            required
                        />
                    </p>

                    <p>
                        <label htmlFor="lang-front">Kod języka dla syntezatora mowy (Front):</label>
                        <br />
                        <SelectCodeLanguages
                            availableLanguages={availableLanguages}
                            value={langFront}
                            id={'lang-front'}
                            setFunction={setLangFront}
                        />
                    </p>

                    <hr />

                    <p>
                        <label htmlFor="o-back">
                            <span className="color-red">*</span> Back:
                        </label>
                        <textarea
                            value={back}
                            onChange={(e) => setBack(e.target.value)}
                            rows="3"
                            cols="30"
                            id="o-back"
                            required
                        />
                    </p>

                    <p>
                        <label htmlFor="lang-back">Kod języka dla syntezatora mowy (Back):</label>
                        <br />
                        <SelectCodeLanguages
                            availableLanguages={availableLanguages}
                            value={langBack}
                            id={'lang-back'}
                            setFunction={setLangBack}
                        />
                    </p>

                    <hr />

                    <p>
                        <label htmlFor="o-super-category">
                            Optional Super Category (choose existing or type new):
                        </label>
                        <br />
                        <select
                            id="o-super-category"
                            onChange={handleSuperCategorySelect}
                            value={superCategory}
                        >
                            <option value="">-- Select existing super category --</option>
                            {superCategoriesArray.map((cat, index) => (
                                <option key={index} value={cat}>
                                    {cat}
                                </option>
                            ))}
                        </select>
                    </p>

                    <p>
                        <input
                            type="text"
                            placeholder="Type a new super category or edit selected one"
                            value={superCategory}
                            onChange={(e) => setSuperCategory(e.target.value)}
                        />
                    </p>

                    <hr />

                    <p>
                        <label htmlFor="o-category">
                            Category (choose existing or type new):
                        </label>
                        <br />
                        <select id="o-category" onChange={handleCategorySelect} value={category}>
                            <option value="">-- Select existing category --</option>
                            {categoriesDependentOnSuperCategory.map((cat, index) => (
                                <option key={index} value={cat}>
                                    {cat}
                                </option>
                            ))}
                        </select>
                    </p>

                    <p>
                        <input
                            type="text"
                            placeholder="Type a new category or edit selected one"
                            value={category}
                            onChange={(e) => setCategory(e.target.value)}
                        />
                    </p>

                    <hr />

                    <p>
                        <button type="submit" disabled={!front.trim() || !back.trim()}>
                            Add Flashcard
                        </button>
                        {flashcardCreated && (
                            <strong className="color-green"> {t('flashcard_added')}</strong>
                        )}
                    </p>
                </div>
            </form>
        </div>
    );
}

CreateFlashcard.propTypes = {
    addFlashcard: PropTypes.func.isRequired,
    categories: PropTypes.arrayOf(PropTypes.string).isRequired,
    superCategoriesArray: PropTypes.arrayOf(PropTypes.string).isRequired
};

export default CreateFlashcard;

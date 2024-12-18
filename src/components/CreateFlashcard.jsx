// CreateFlashcard.jsx
import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { getCordovaLanguage } from '../functions/getLanguage';

function CreateFlashcard({ addFlashcard, categories }) {
    const [front, setFront] = useState('');
    const [back, setBack] = useState('');
    const [category, setCategory] = useState('');
    const [langFront, setLangFront] = useState('');
    const [langBack, setLangBack] = useState('');
    const [flashcardCreated, setFlashcardCreated] = useState(false);
    const [availableLanguages, setAvailableLanguages] = useState([]);

    // Ładowanie dostępnych języków
    useEffect(() => {
        const loadLanguages = async () => {
            if (window.cordova && window.TTS) {
                const predefinedLanguages = [
                    'en-US', 'en-GB', 'pl-PL', 'es-ES', 'es-MX', 'de-DE', 'fr-FR',
                    'it-IT', 'ru-RU', 'zh-CN', 'zh-TW', 'ja-JP', 'ko-KR', 'pt-PT',
                    'pt-BR', 'nl-NL', 'sv-SE', 'no-NO', 'da-DK', 'fi-FI', 'tr-TR',
                    'ar-SA', 'he-IL', 'hi-IN', 'id-ID', 'ms-MY', 'th-TH', 'vi-VN',
                    'cs-CZ', 'el-GR', 'hu-HU', 'ro-RO', 'sk-SK', 'uk-UA', 'bg-BG',
                    'hr-HR', 'lt-LT', 'lv-LV', 'sl-SI', 'et-EE', 'fa-IR', 'bn-BD',
                    'ta-IN', 'te-IN', 'mr-IN'
                ];
                setAvailableLanguages(predefinedLanguages);
            } else if (window.speechSynthesis) {
                const loadVoices = () => {
                    const voices = window.speechSynthesis.getVoices();
                    const uniqueLangs = Array.from(new Set(voices.map(voice => voice.lang)));
                    if (uniqueLangs.length > 0) {
                        setAvailableLanguages(uniqueLangs);
                    } else {
                        console.warn("No voices available, setting default language to 'en-US'.");
                        setAvailableLanguages(['en-US']);
                    }
                };

                window.speechSynthesis.onvoiceschanged = loadVoices;
                loadVoices();

                return () => {
                    window.speechSynthesis.onvoiceschanged = null;
                };
            } else {
                console.warn("No TTS available.");
                setAvailableLanguages(['en-US']);
            }
        };

        loadLanguages();
    }, []);

    // Ustawienie języków po załadowaniu availableLanguages
    useEffect(() => {
        if (availableLanguages.length > 0) {
            const setLanguages = async () => {
                try {
                    const detectedLanguage = await getCordovaLanguage();
                    console.log("Detected language:", detectedLanguage);

                    // Sprawdzenie, czy wykryty język jest dostępny
                    if (availableLanguages.includes(detectedLanguage)) {
                        setLangFront(detectedLanguage);
                        setLangBack(detectedLanguage);
                    } else if (availableLanguages.includes('en-US')) {
                        setLangFront('en-US');
                        setLangBack('en-US');
                    } else {
                        // Ustawienie na pierwszy dostępny język
                        setLangFront(availableLanguages[0]);
                        setLangBack(availableLanguages[0]);
                    }
                } catch (error) {
                    console.error("Error setting languages:", error);
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
            let finalCategory = category.trim();
            if (finalCategory.toLowerCase() === 'without category') {
                finalCategory = '';
            }

            // Ustaw domyślny język na 'en-US', jeśli nie wybrano żadnego
            const finalLangFront = langFront || 'en-US';
            const finalLangBack = langBack || 'en-US';

            console.log("Submitting flashcard with languages:", finalLangFront, finalLangBack);

            try {
                // Przekazujemy obiekt do funkcji addFlashcard
                const newFlashcard = await addFlashcard({
                    front,
                    back,
                    category: finalCategory,
                    langFront: finalLangFront,
                    langBack: finalLangBack
                });

                // Wyświetlenie komunikatu o utworzeniu fiszki
                setFlashcardCreated(true);

                // Resetowanie pól front i back, pozostawienie kategorii oraz języków
                setFront('');
                setBack('');
            } catch (error) {
                console.error("Error adding flashcard:", error);
            }
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
            {flashcardCreated && <p className="color-green">Fiszka utworzona!</p>}
            <form onSubmit={handleSubmit}>
                <p>
                    <label htmlFor="o-front">Front:</label>
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
                    <label htmlFor="lang-front">Kod języka dla syntezatora mowy (Front):</label><br/>
                    <select
                        id="lang-front"
                        value={langFront}
                        onChange={(e) => setLangFront(e.target.value)}
                        required
                    >
                        {availableLanguages.length === 0 && <option value="">Loading...</option>}
                        {availableLanguages.map((lang, index) => (
                            <option key={index} value={lang}>{lang}</option>
                        ))}
                    </select>
                </p>
                <hr/>
                <p>
                    <label htmlFor="o-back">Back:</label>
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
                    <label htmlFor="lang-back">Kod języka dla syntezatora mowy (Back):</label><br/>
                    <select
                        id="lang-back"
                        value={langBack}
                        onChange={(e) => setLangBack(e.target.value)}
                        required
                    >
                        {availableLanguages.length === 0 && <option value="">Loading...</option>}
                        {availableLanguages.map((lang, index) => (
                            <option key={index} value={lang}>{lang}</option>
                        ))}
                    </select>
                </p>
                <hr/>
                <p>
                    <label htmlFor="o-category">Category (choose existing or type new):</label><br/>
                    <select id="o-category" onChange={handleCategorySelect} value={category}>
                        <option value="">-- Select existing category --</option>
                        {filteredCategories.map((cat, index) => (
                            <option key={index} value={cat}>{cat}</option>
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
                <hr/>
                <button type="submit" disabled={!front.trim() || !back.trim()}>
                    Add Flashcard
                </button>
            </form>
        </div>
    );
}

CreateFlashcard.propTypes = {
    addFlashcard: PropTypes.func.isRequired,
    categories: PropTypes.arrayOf(PropTypes.string).isRequired
};

export default CreateFlashcard;

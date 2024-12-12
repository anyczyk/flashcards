// ViewFlashcards.jsx
import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';

function ViewFlashcards({ flashcards, categories, setFlashcardKnow }) {
    const { t, i18n } = useTranslation(); // Użyj hooka tłumaczenia
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [learningFilter, setLearningFilter] = useState('all');
    // learningFilter: 'all' lub 'learningOnly'

    // Fiszki z wybranej kategorii, bez dodatkowego filtra "Do nauki" (learningOnly)
    const categoryFlashcards = useMemo(() => {
        if (selectedCategory === null) {
            return [];
        }

        let filtered;
        if (selectedCategory === 'All') {
            filtered = [...flashcards];
        } else if (selectedCategory === 'Without category') {
            filtered = flashcards.filter(fc => !fc.category || fc.category.trim() === '');
        } else {
            filtered = flashcards.filter(fc => fc.category === selectedCategory);
        }

        return filtered;
    }, [selectedCategory, flashcards]);

    // Czy w wybranej kategorii są fiszki do nauki (know !== true)?
    const hasLearningCards = categoryFlashcards.some(fc => fc.know !== true);

    // Liczenie fiszek po zastosowaniu filtra
    const getFilteredFlashcardCount = (filter) => {
        let filtered = [...categoryFlashcards];
        if (filter === 'learningOnly') {
            filtered = filtered.filter(fc => fc.know !== true);
        }
        return filtered.length;
    };

    const filteredFlashcards = useMemo(() => {
        // Zastosowanie filtra "Do nauki"
        let filtered = [...categoryFlashcards];
        if (learningFilter === 'learningOnly') {
            filtered = filtered.filter(fc => fc.know !== true);
        }

        // Tasowanie losowe
        for (let i = filtered.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [filtered[i], filtered[j]] = [filtered[j], filtered[i]];
        }

        return filtered;
    }, [categoryFlashcards, learningFilter]);

    const learnIt = (id) => {
        // Ustawiamy know = undefined
        setFlashcardKnow(id, undefined);
    };

    const knowIt = (id) => {
        // Ustawiamy know = true
        setFlashcardKnow(id, true);
    };

    return (
        <div>
            <h2>View Flashcards</h2>

            {(selectedCategory !== null) ? <div>
                    <button
                        onClick={() => {
                            setSelectedCategory(null);
                            setLearningFilter(null);
                        }}
                    >
                        Wybierz inną kategorię
                    </button>
                </div> :
                <ul>
                    <li>
                        <button
                            onClick={() => {
                                setSelectedCategory('All');
                                setLearningFilter('all');
                            }}
                        >
                            {t('all')} ({flashcards.length})
                        </button>
                    </li>
                    {categories.map(cat => {
                        let count;
                        if (cat === 'Without category') {
                            count = flashcards.filter(fc => !fc.category || fc.category.trim() === '').length;
                        } else {
                            count = flashcards.filter(fc => fc.category === cat).length;
                        }

                        return (
                            <li key={cat}>
                                <button
                                    onClick={() => {
                                        setSelectedCategory(cat);
                                        setLearningFilter('all');
                                    }}
                                >
                                    {(cat === 'Without category') ? t('without_category') : cat} ({count})
                                </button>
                            </li>
                        );
                    })}
                </ul>
            }
            {selectedCategory !== null && selectedCategory !== undefined && categoryFlashcards.length > 0 ? (
                <div>
                    <h3>
                        {selectedCategory === 'All' ? t('all') : (selectedCategory === 'Without category' ? t('without_category') : selectedCategory  )} (
                        {selectedCategory === 'All'
                            ? flashcards.length
                            : selectedCategory === 'Without category'
                                ? flashcards.filter(fc => !fc.category || fc.category.trim() === '').length
                                : categoryFlashcards.length}
                        )
                    </h3>
                    <hr />
                    <div>
                        <button
                            onClick={() => setLearningFilter('all')}
                        >
                            Wszystkie z kategorii: {selectedCategory ? selectedCategory : 'All'} ({getFilteredFlashcardCount('all')})
                        </button>
                        {hasLearningCards && (
                            <button
                                onClick={() => setLearningFilter('learningOnly')}
                            >
                                Do nauki ({getFilteredFlashcardCount('learningOnly')})
                            </button>
                        )}
                    </div>
                </div>
            ) : null}

            {selectedCategory === null ? (
                <div>Wybierz kategorię, aby załadować fiszki.</div>
            ) : filteredFlashcards.length === 0 ? (
                <div>Brak fiszek w tej kategorii.</div>
            ) : (
                <ul>
                    {filteredFlashcards.map(card => (
                        <li key={card.id}>
                            <div className="fc-front"><strong>Front:</strong> {card.front}</div>
                            <div className="fc-back"><strong>Back:</strong> {card.back}</div>
                            <div className="fc-category">
                                <strong>Category:</strong> {card.category && card.category.trim() !== '' ? card.category : 'Without category'}
                            </div>
                            <div className="fc-know">
                                <p>{card.know ? 'Już to znam' : 'Ucze się'}</p>
                                <button onClick={() => learnIt(card.id)}>Ucze się</button>
                                <button onClick={() => knowIt(card.id)}>Już to znam</button>
                            </div>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}

export default ViewFlashcards;

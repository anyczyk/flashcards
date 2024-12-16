// ViewFlashcards.jsx
import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from "react-router-dom";

function ViewFlashcards({ flashcards, categories, setFlashcardKnow }) {
    const { t } = useTranslation(); // Użyj hooka tłumaczenia
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [learningFilter, setLearningFilter] = useState(null); // Inicjalizacja jako null

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
        if (!learningFilter) return [];

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
        <div className="o-page-view-flashcards">
            <div className="o-page-view-flashcards__header">
                {(selectedCategory !== null) && (
                    <p>
                        <button onClick={() => { setSelectedCategory(null); setLearningFilter(null); }}>
                            Wybierz inną kategorię
                        </button>
                    </p>
                )}
                {selectedCategory !== null && selectedCategory !== undefined && categoryFlashcards.length > 0 ? (
                    <>
                        <h3>
                            {selectedCategory === 'All'
                                ? t('all')
                                : (selectedCategory === 'Without category' ? t('without_category') : selectedCategory)} (
                            {selectedCategory === 'All'
                                ? flashcards.length
                                : selectedCategory === 'Without category'
                                    ? flashcards.filter(fc => !fc.category || fc.category.trim() === '').length
                                    : categoryFlashcards.length}
                            )
                        </h3>
                        <hr/>
                        <ul className="o-list-buttons-clear o-default-box">
                            {getFilteredFlashcardCount('learningOnly') < getFilteredFlashcardCount('all') && (
                                <li>
                                    <button
                                        className={`btn ${learningFilter === 'all' ? 'btn--active' : ''}`}
                                        onClick={() => setLearningFilter('all')}
                                    >
                                        Powtórz wszystkie ({getFilteredFlashcardCount('all')})
                                    </button>
                                </li>
                            )}
                            {hasLearningCards && (
                                <li>
                                    <button
                                        className={`btn ${learningFilter === 'learningOnly' ? 'btn--active' : ''}`}
                                        onClick={() => setLearningFilter('learningOnly')}
                                    >
                                        Do nauki ({getFilteredFlashcardCount('learningOnly')})
                                    </button>
                                </li>
                            )}
                        </ul>
                    </>
                ) : null}
            </div>
            {selectedCategory === null ? (
                (flashcards.length > 0) && <p>Wybierz kategorię, aby załadować fiszki.</p>
            ) : (
                learningFilter && (
                    filteredFlashcards.length === 0 ? (
                        <p>Gratulacje, udało ci się zapammiętać wszystkie fiszki w kategorii: {selectedCategory}!</p>
                    ) : (
                        <div className="o-page-view-flashcards__content">
                            <ul className="o-list-flashcards">
                                {filteredFlashcards.map(card => (
                                    <li className="o-list-flashcards__single-card" key={card.id}>
                                        <div className="o-list-flashcards__front">
                                            <p>{card.front}</p>
                                        </div>
                                        <div className="o-list-flashcards__back">
                                            <p>{card.back}</p>
                                        </div>
                                        <div className="o-list-flashcards__category">
                                            <strong>Category:</strong> {card.category && card.category.trim() !== '' ? card.category : 'Without category'}
                                        </div>
                                        <div className="o-list-flashcards__know">
                                            <p>{card.know ? 'Już to znam' : 'Uczę się'}</p>
                                            <ul className="o-list-buttons-clear">
                                                <li>
                                                    <button onClick={() => learnIt(card.id)}>Uczę się</button>
                                                </li>
                                                <li>
                                                    <button className="btn--green" onClick={() => knowIt(card.id)}>Już to znam</button>
                                                </li>
                                            </ul>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )
                )
            )}

            {selectedCategory === null ? (
                <>
                    {flashcards.length > 0 ? (
                        <ul className="o-list-categories">
                            <li>
                                <button
                                    className={`btn ${selectedCategory === 'All' && learningFilter === 'all' ? 'btn--active' : ''}`}
                                    onClick={() => {
                                        setSelectedCategory('All');
                                        setLearningFilter(null); // Reset filtra przy wyborze kategorii
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
                                            className={`btn ${selectedCategory === cat && learningFilter === 'all' ? 'btn--active' : ''}`}
                                            onClick={() => {
                                                setSelectedCategory(cat);
                                                setLearningFilter(null); // Reset filtra przy wyborze kategorii
                                            }}
                                        >
                                            {(cat === 'Without category') ? t('without_category') : cat} ({count})
                                        </button>
                                    </li>
                                );
                            })}
                        </ul>
                    ) : (
                        <div className="o-no-flashcards">
                            <p>{t('no_flashcards')}</p>
                            <ul className="o-list-buttons-clear">
                                <li><Link className="btn" to="/create"><i className="icon-plus"></i> {t('create_flashcard')}</Link></li>
                                <li><Link className="btn" to="/import-export"><i className="icon-export"></i> {t('import_export')}</Link></li>
                            </ul>
                        </div>
                    )}
                </>
            ) : null}
        </div>
    );
}

export default ViewFlashcards;

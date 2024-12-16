// ViewFlashcards.jsx
import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from 'framer-motion'; // Importujemy Framer Motion

function ViewFlashcards({ flashcards, categories, setFlashcardKnow }) {
    const { t } = useTranslation(); // Użyj hooka tłumaczenia
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [learningFilter, setLearningFilter] = useState(null); // Inicjalizacja jako null
    const [orderedFlashcards, setOrderedFlashcards] = useState([]); // Nowy stan dla uporządkowanej listy fiszek

    // Czy w wybranej kategorii są fiszki do nauki (know !== true)?
    const hasLearningCards = flashcards.some(fc => {
        if (selectedCategory === null) return false;
        if (selectedCategory === 'All') {
            return fc.know !== true;
        } else if (selectedCategory === 'Without category') {
            return (!fc.category || fc.category.trim() === '') && fc.know !== true;
        } else {
            return fc.category === selectedCategory && fc.know !== true;
        }
    });

    // Liczenie fiszek po zastosowaniu filtra
    const getFilteredFlashcardCount = (filter) => {
        if (selectedCategory === null) return 0;
        let filtered = [];
        if (selectedCategory === 'All') {
            filtered = [...flashcards];
        } else if (selectedCategory === 'Without category') {
            filtered = flashcards.filter(fc => !fc.category || fc.category.trim() === '');
        } else {
            filtered = flashcards.filter(fc => fc.category === selectedCategory);
        }

        if (filter === 'learningOnly') {
            filtered = filtered.filter(fc => fc.know !== true);
        }

        return filtered.length;
    };

    // Shuffling fiszek i ustawienie orderedFlashcards tylko przy zmianie kategorii lub filtra
    useEffect(() => {
        let filtered = [];
        if (selectedCategory === 'All') {
            filtered = [...flashcards];
        } else if (selectedCategory === 'Without category') {
            filtered = flashcards.filter(fc => !fc.category || fc.category.trim() === '');
        } else if (selectedCategory) {
            filtered = flashcards.filter(fc => fc.category === selectedCategory);
        }

        if (learningFilter === 'learningOnly') {
            filtered = filtered.filter(fc => fc.know !== true);
        }

        // Shuffle the filtered list using Fisher-Yates algorithm
        for (let i = filtered.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [filtered[i], filtered[j]] = [filtered[j], filtered[i]];
        }

        setOrderedFlashcards(filtered);
    }, [selectedCategory, learningFilter]); // Zależności tylko od kategorii i filtra

    // Nowy useEffect do usuwania znanych fiszek w trybie "Do nauki"
    useEffect(() => {
        if (selectedCategory !== null && learningFilter === 'learningOnly') {
            setOrderedFlashcards(prev => prev.filter(card => {
                const updatedCard = flashcards.find(fc => fc.id === card.id);
                return updatedCard && updatedCard.know !== true;
            }));
        }
    }, [flashcards, selectedCategory, learningFilter]);

    // Funkcja do przenoszenia fiszki na początek listy
    const moveCardToFront = (id) => {
        setOrderedFlashcards(prev => {
            const cardIndex = prev.findIndex(card => card.id === id);
            if (cardIndex > -1) {
                const card = prev[cardIndex];
                const newList = [card, ...prev.slice(0, cardIndex), ...prev.slice(cardIndex + 1)];
                return newList;
            }
            return prev;
        });
    };

    const learnIt = (id) => {
        // Ustawiamy know = undefined
        setFlashcardKnow(id, undefined);
        // Jeśli filtr to "Powtórz wszystkie" lub "Do nauki", przenosimy fiszkę na początek
        if (learningFilter === 'all' || learningFilter === 'learningOnly') {
            moveCardToFront(id);
        }
    };

    const knowIt = (id) => {
        // Ustawiamy know = true
        setFlashcardKnow(id, true);
        // Jeśli filtr to "Powtórz wszystkie", przenosimy fiszkę na początek
        if (learningFilter === 'all') {
            moveCardToFront(id);
        }
    };

    // Funkcja obsługująca swipe
    const handleSwipe = (id, direction) => {
        console.log(direction);
        if (direction === 'prawo') {
            setFlashcardKnow(id, true);
            if (learningFilter === 'all') {
                moveCardToFront(id);
            }
        } else if (direction === 'lewo') {
            setFlashcardKnow(id, undefined);
            if (learningFilter === 'all' || learningFilter === 'learningOnly') {
                moveCardToFront(id);
            }
        } else if (direction === 'gora') {
            setFlashcardKnow(id, 'gora');
            // Opcjonalnie: Przenieś na początek, jeśli jest to wymagane
        } else if (direction === 'dol') {
            setFlashcardKnow(id, 'dol');
            // Opcjonalnie: Przenieś na początek, jeśli jest to wymagane
        }
    };

    return (
        <div className="o-page-view-flashcards">
            <div className="o-page-view-flashcards__header">
                {selectedCategory !== null && (
                    <p>
                        <button onClick={() => { setSelectedCategory(null); setLearningFilter(null); }}>
                            Wybierz inną kategorię
                        </button>
                    </p>
                )}
                {selectedCategory !== null && getFilteredFlashcardCount('all') > 0 ? (
                    <>
                        <h3>
                            {selectedCategory === 'All'
                                ? t('all')
                                : (selectedCategory === 'Without category' ? t('without_category') : selectedCategory)} (
                            {selectedCategory === 'All'
                                ? flashcards.length
                                : selectedCategory === 'Without category'
                                    ? flashcards.filter(fc => !fc.category || fc.category.trim() === '').length
                                    : flashcards.filter(fc => fc.category === selectedCategory).length}
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
                flashcards.length > 0 && <p>Wybierz kategorię, aby załadować fiszki.</p>
            ) : (
                learningFilter && (
                    orderedFlashcards.length === 0 ? (
                        <p>Gratulacje, udało ci się zapamiętać wszystkie fiszki w kategorii: {selectedCategory}!</p>
                    ) : (
                        <div className="o-page-view-flashcards__content">
                            <ul className="o-list-flashcards">
                                <AnimatePresence>
                                    {orderedFlashcards.map((card, index) => (
                                        <motion.li
                                            className="o-list-flashcards__single-card"
                                            key={card.id}
                                            drag={true} // Umożliwia przeciąganie w obu osiach
                                            dragConstraints={{ top: 0, left: 0, right: 0, bottom: 0 }} // Ograniczenie przeciągania do kontenera
                                            dragElastic={0.2}
                                            onDragEnd={(event, info) => {
                                                const threshold = 150; // Próg w px
                                                const { offset } = info;
                                                const absX = Math.abs(offset.x);
                                                const absY = Math.abs(offset.y);

                                                if (absX > absY) { // Przeciąganie bardziej w poziomie
                                                    if (absX > threshold) {
                                                        const direction = offset.x > 0 ? 'prawo' : 'lewo';
                                                        handleSwipe(card.id, direction);
                                                    }
                                                } else { // Przeciąganie bardziej w pionie
                                                    if (absY > threshold) {
                                                        const direction = offset.y > 0 ? 'dol' : 'gora';
                                                        handleSwipe(card.id, direction);
                                                    }
                                                }
                                            }}
                                            initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
                                            animate={{ x: 0, y: 0, opacity: 1, scale: 1 }}
                                            exit={{ opacity: 0, scale: 0.5 }}
                                            transition={{
                                                type: "spring",
                                                stiffness: 300,
                                                damping: 30,
                                                duration: 0.3
                                            }}
                                            style={{
                                                position: 'absolute', // Przywrócenie pozycji absolutnej
                                                cursor: 'grab',
                                                listStyle: 'none',
                                                zIndex: index
                                            }}
                                        >
                                            <div className="o-list-flashcards__front">
                                                <p>{card.front}</p>
                                            </div>
                                            <div className="o-list-flashcards__back">
                                                <p>{card.back}</p>
                                            </div>
                                            <div className="o-list-flashcards__category">
                                                <strong>Kategoria:</strong> {card.category && card.category.trim() !== '' ? card.category : 'Bez kategorii'}
                                            </div>
                                            <div className="o-list-flashcards__know">
                                                <p>{card.know ? 'Już to znam' : 'Uczę się'}</p>
                                                <ul className="o-list-buttons-clear">
                                                    <li>
                                                        <button onClick={() => learnIt(card.id)}>Uczę się</button>
                                                    </li>
                                                    <li>
                                                        <button className="btn--green"
                                                                onClick={() => knowIt(card.id)}>Już to znam
                                                        </button>
                                                    </li>
                                                </ul>
                                            </div>
                                        </motion.li>
                                    ))}
                                </AnimatePresence>
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

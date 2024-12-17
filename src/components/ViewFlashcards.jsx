// ViewFlashcards.jsx
import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from "react-router-dom";
import { motion, AnimatePresence, useAnimation } from 'framer-motion';
import { speak, stopSpeaking } from "../functions/speak";

function ViewFlashcards({ flashcards, categories, setFlashcardKnow }) {
    const { t } = useTranslation();
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [learningFilter, setLearningFilter] = useState(null); // 'all' lub 'learningOnly'
    const [orderedFlashcards, setOrderedFlashcards] = useState([]);
    const [checkedCards, setCheckedCards] = useState(new Set());
    const [animatingCards, setAnimatingCards] = useState({}); // Nowy stan dla animujących się kart
    const [draggingDirection, setDraggingDirection] = useState({}); // Nowy stan dla kierunku przeciągania
    const [isShuffling, setIsShuffling] = useState(false); // Nowy stan dla animacji tasowania

    const controls = useAnimation(); // Kontroler animacji dla kontenera <ul>

    // Resetowanie checkedCards przy zmianie filtra lub kategorii
    useEffect(() => {
        setCheckedCards(new Set());
    }, [learningFilter, selectedCategory]);

    // Zatrzymaj mowę przy zmianie istotnych stanów
    useEffect(() => {
        stopSpeaking();
    }, [
        selectedCategory,
        learningFilter,
        isShuffling,
        animatingCards,
        draggingDirection,
        checkedCards
    ]);

    // Zatrzymaj mowę przy odmontowaniu komponentu
    useEffect(() => {
        return () => {
            stopSpeaking();
        };
    }, []);

    // Funkcja do obsługi mowy z zatrzymaniem poprzedniej
    const handleSpeak = (text, lang) => {
        stopSpeaking();
        speak(text, lang);
    };

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

    // Tasowanie fiszek tylko przy zmianie kategorii lub filtra
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

        // Tasowanie listy za pomocą algorytmu Fisher-Yates
        for (let i = filtered.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [filtered[i], filtered[j]] = [filtered[j], filtered[i]];
        }

        setOrderedFlashcards(filtered);
    }, [selectedCategory, learningFilter]); // Usuń `flashcards` z zależności

    // Funkcja do tasowania tablicy (kopiowanie i tasowanie Fisher-Yates)
    const shuffleArray = (array) => {
        const shuffled = [...array];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
    };

    // Funkcja obsługująca kliknięcie przycisku "Tasuj"
    const handleShuffle = async () => {
        if (isShuffling) return; // Zapobiega wielokrotnemu klikaniu

        setIsShuffling(true);
        await controls.start("shuffling"); // Rozpoczęcie animacji

        // Tasowanie fiszek po zakończeniu animacji
        setOrderedFlashcards(prev => shuffleArray(prev));

        setIsShuffling(false);
    };

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
        if (learningFilter === 'all') {
            // W trybie 'all' przenieś na początek
            moveCardToFront(id);
        } else if (learningFilter === 'learningOnly') {
            // W trybie 'learningOnly' nie usuwaj fiszki
            // Możesz dodać dodatkową logikę, jeśli potrzebujesz
            moveCardToFront(id); // Opcjonalne: przenieś na początek
        }
        // Resetujemy stan sprawdzenia
        setCheckedCards(prev => {
            const newSet = new Set(prev);
            newSet.delete(id);
            return newSet;
        });
    };

    const knowIt = (id) => {
        // Ustawiamy know = true
        setFlashcardKnow(id, true);
        if (learningFilter === 'all') {
            // W trybie 'all' przenieś na początek
            moveCardToFront(id);
        } else if (learningFilter === 'learningOnly') {
            // W trybie 'learningOnly' usuń fiszkę z listy
            setOrderedFlashcards(prev => prev.filter(card => card.id !== id));
        }
        // Resetujemy stan sprawdzenia
        setCheckedCards(prev => {
            const newSet = new Set(prev);
            newSet.delete(id);
            return newSet;
        });
    };

    // Funkcja obsługująca swipe
    const handleSwipe = (id, direction) => {
        if (direction === 'prawo') {
            // Swipe w prawo oznacza "Już to znam"
            setAnimatingCards(prev => ({ ...prev, [id]: 'animateRight' }));
        } else if (direction === 'lewo') {
            // Swipe w lewo oznacza "Uczę się"
            setAnimatingCards(prev => ({ ...prev, [id]: 'animateLeft' }));
        }
        // Usunięcie obsługi dla 'gora' i 'dol'

        // Resetujemy stan sprawdzenia po przesunięciu
        setCheckedCards(prev => {
            const newSet = new Set(prev);
            newSet.delete(id);
            return newSet;
        });
    };

    // Funkcja obsługująca kliknięcie "Sprawdź"
    const handleCheck = (id) => {
        setCheckedCards(prev => new Set(prev).add(id));
    };

    // Definicja wariantów animacji dla poszczególnych fiszek
    const variants = {
        default: {
            x: 0,
            rotate: 0,
        },
        animateLeft: {
            x: -100,
            rotate: -5, // Obrót w lewo
            transition: { duration: 0.2 }
        },
        animateRight: {
            x: 100,
            rotate: 5, // Obrót w prawo
            transition: { duration: 0.2 }
        },
    };

    // Definicja wariantów animacji dla kontenera <ul> (drgania)
    const containerVariants = {
        initial: {
            x: 0,
            rotate: 0,
        },
        shuffling: {
            x: [-10, 10, -10, 10, -5, 5, 0],
            rotate: [-5, 5, -5, 5, -2.5, 2.5, 0],
            transition: {
                duration: 0.6,
                ease: "easeInOut",
            },
        },
    };

    return (
        <div className="o-page-view-flashcards">
            <div className="o-page-view-flashcards__header">
                {selectedCategory !== null && (
                    <p>
                        <button onClick={() => {
                            setSelectedCategory(null);
                            setLearningFilter(null);
                            setCheckedCards(new Set());
                        }}>
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
                                        onClick={() => {
                                            setLearningFilter('all');
                                            setCheckedCards(new Set());
                                        }}
                                    >
                                        Powtórz ({getFilteredFlashcardCount('all')})
                                    </button>
                                </li>
                            )}
                            {hasLearningCards && (
                                <li>
                                    <button
                                        className={`btn ${learningFilter === 'learningOnly' ? 'btn--active' : ''}`}
                                        onClick={() => {
                                            setLearningFilter('learningOnly');
                                            setCheckedCards(new Set());
                                        }}
                                    >
                                        Do nauki ({getFilteredFlashcardCount('learningOnly')})
                                    </button>
                                </li>
                            )}
                            {!(learningFilter && orderedFlashcards.length === 0) && <li>
                                <button onClick={handleShuffle} disabled={isShuffling}>
                                    {isShuffling ? 'Tasowanie...' : 'Tasuj'}
                                </button>
                            </li>}
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
                            {/* Użycie motion.ul z kontrolą animacji drgań */}
                            <motion.ul
                                className="o-list-flashcards"
                                variants={containerVariants}
                                initial="initial"
                                animate={controls}
                            >
                                <AnimatePresence>
                                    {orderedFlashcards.map((card) => (
                                        <motion.li
                                            className="o-list-flashcards__single-card"
                                            key={card.id}
                                            // Ograniczenie przeciągania tylko do osi X
                                            drag="x"
                                            dragConstraints={{ left: 0, right: 0 }}
                                            dragElastic={0.9}
                                            whileDrag={{
                                                rotate: draggingDirection[card.id] === 'prawo'
                                                    ? 5
                                                    : draggingDirection[card.id] === 'lewo'
                                                        ? -5
                                                        : 0
                                            }}
                                            onDrag={(event, info) => {
                                                const { offset } = info;
                                                const threshold = 20; // Minimalny przesunięcie do rozpoznania kierunku
                                                if (Math.abs(offset.x) > threshold) {
                                                    const direction = offset.x > 0 ? 'prawo' : 'lewo';
                                                    setDraggingDirection(prev => ({ ...prev, [card.id]: direction }));
                                                }
                                            }}
                                            onDragEnd={(event, info) => {
                                                const threshold = 100; // Próg w px
                                                const { offset } = info;
                                                const absX = Math.abs(offset.x);

                                                if (absX > threshold) { // Tylko przeciąganie w poziomie
                                                    const direction = offset.x > 0 ? 'prawo' : 'lewo';
                                                    handleSwipe(card.id, direction);
                                                }

                                                // Resetowanie kierunku przeciągania po zakończeniu animacji
                                                setDraggingDirection(prev => {
                                                    const newDrag = { ...prev };
                                                    delete newDrag[card.id];
                                                    return newDrag;
                                                });
                                            }}
                                            variants={variants}
                                            animate={animatingCards[card.id] || 'default'}
                                            onAnimationComplete={() => {
                                                if (animatingCards[card.id] === 'animateLeft') {
                                                    learnIt(card.id);
                                                    setAnimatingCards(prev => {
                                                        const newAnim = { ...prev };
                                                        delete newAnim[card.id];
                                                        return newAnim;
                                                    });
                                                } else if (animatingCards[card.id] === 'animateRight') {
                                                    knowIt(card.id);
                                                    setAnimatingCards(prev => {
                                                        const newAnim = { ...prev };
                                                        delete newAnim[card.id];
                                                        return newAnim;
                                                    });
                                                }

                                                // Resetowanie kierunku przeciągania po zakończeniu animacji
                                                setDraggingDirection(prev => {
                                                    const newDrag = { ...prev };
                                                    delete newDrag[card.id];
                                                    return newDrag;
                                                });
                                            }}
                                            transition={{
                                                type: "spring",
                                                stiffness: 300,
                                                damping: 30,
                                                duration: 0.3
                                            }}
                                            style={{
                                                cursor: 'grab',
                                                listStyle: 'none',
                                                overflowY: 'auto', // Umożliwia przewijanie zawartości wewnątrz fiszki
                                            }}
                                        >
                                            <div className="o-list-flashcards__front o-default-box">
                                                <p role="button" onClick={() => handleSpeak(card.front,"pl-PL")}>
                                                    <i className="icon-volume"></i> {card.front}
                                                </p>
                                            </div>
                                            <hr />
                                            {checkedCards.has(card.id) && (
                                                <div className="o-list-flashcards__back">
                                                    <p role="button" onClick={() => handleSpeak(card.back,"en-US")}>
                                                        <i className="icon-volume"></i> {card.back}
                                                    </p>
                                                </div>
                                            )}
                                            <div className="o-list-flashcards__know">
                                                <p className="o-list-flashcards__swipe-info-know-or-learn">
                                                    {card.know ? <span className="color-green">Już to znam?</span> : <span className="color-brow">Uczę się?</span>}
                                                </p>
                                                <div className={`o-list-flashcards__swipe-info-know ${draggingDirection[card.id] === 'prawo' ? 'o-list-flashcards__swipe-info-know--visible' : ''}`}>
                                                    <p><i className="icon-ok"></i> Już to znam</p>
                                                </div>
                                                <div className={`o-list-flashcards__swipe-info-learn ${draggingDirection[card.id] === 'lewo' ? 'o-list-flashcards__swipe-info-learn--visible' : ''}`}>
                                                    <p><i className="icon-graduation-cap"></i> Uczę się</p>
                                                </div>
                                                {!checkedCards.has(card.id) ? (
                                                    <button
                                                        className="o-list-flashcards__know-check btn--blue"
                                                        onClick={() => handleCheck(card.id)}
                                                    >
                                                        Sprawdź
                                                    </button>
                                                ) : (
                                                    <ul className="o-list-buttons-clear">
                                                        <li>
                                                            <button
                                                                onClick={() => {
                                                                    setDraggingDirection(prev => ({ ...prev, [card.id]: 'lewo' }));
                                                                    setAnimatingCards(prev => ({
                                                                        ...prev,
                                                                        [card.id]: 'animateLeft'
                                                                    }));
                                                                }}
                                                            >
                                                                Uczę się
                                                            </button>
                                                        </li>
                                                        <li>
                                                            <button
                                                                className="btn--green"
                                                                onClick={() => {
                                                                    setDraggingDirection(prev => ({ ...prev, [card.id]: 'prawo' }));
                                                                    setAnimatingCards(prev => ({
                                                                        ...prev,
                                                                        [card.id]: 'animateRight'
                                                                    }));
                                                                }}
                                                            >
                                                                Już to znam
                                                            </button>
                                                        </li>
                                                    </ul>
                                                )}
                                            </div>
                                        </motion.li>
                                    ))}
                                </AnimatePresence>
                            </motion.ul>
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
                                        setLearningFilter('all');
                                        setCheckedCards(new Set());
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
                                                setLearningFilter('all');
                                                setCheckedCards(new Set());
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

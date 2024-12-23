// ViewFlashcards.jsx
import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from "react-router-dom";
import { motion, AnimatePresence, useAnimation } from 'framer-motion';
import { speak, stopSpeaking } from "../utils/speak";
import { setLocalStorage, getLocalStorage } from '../utils/storage';

function ViewFlashcards({ flashcards, categories, setFlashcardKnow }) {
    const { t } = useTranslation();

    // Kategoria i filtr
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [learningFilter, setLearningFilter] = useState(null);

    // [NOWE] - Cała przefiltrowana i przetasowana talia
    const [deck, setDeck] = useState([]);

    // [NOWE] - Dokładnie 2 karty wyświetlane (lub 1, jeśli nie ma drugiej)
    // Format: [topCard, bottomCard]
    const [twoCards, setTwoCards] = useState([]);

    // „Sprawdź” (odkrycie drugiej strony)
    const [checkedCards, setCheckedCards] = useState(new Set());
    // Info do animacji (przesunięcie)
    const [animatingCards, setAnimatingCards] = useState({});
    const [draggingDirection, setDraggingDirection] = useState({});

    // Flagi jednorazowe
    const [isShuffling, setIsShuffling] = useState(false);
    const [reversFrontBack, setReversFrontBack] = useState(false);

    // Audio on/off
    const [syntAudio, setSyntAudio] = useState(() => {
        const storedAudio = getLocalStorage('syntAudio');
        return storedAudio !== null ? storedAudio : true;
    });

    // Animacje framer-motion
    const controls = useAnimation();

    // Inne
    const [reviewedSet, setReviewedSet] = useState(new Set());
    const [showCompleteMessage, setShowCompleteMessage] = useState(false);

    // -------------------------
    //  Shuffling i filtry
    // -------------------------
    const shuffleArray = (array) => {
        const newArray = [...array];
        for (let i = newArray.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
        }
        return newArray;
    };

    // [ZM] - Tworzy nową talię i ustawia `twoCards` jako pierwsze 2 (o ile są)
    const applyFilterAndShuffle = () => {
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

        const shuffled = shuffleArray(filtered);

        // Ustawiamy nową talię w stanie
        setDeck(shuffled);

        // Wyciągamy z potasowanej talii do twoCards
        if (shuffled.length >= 2) {
            const [first, second, ...rest] = shuffled;
            setTwoCards([first, second]); // [top, bottom]
            setDeck(rest); // reszta w talii
        } else if (shuffled.length === 1) {
            setTwoCards([shuffled[0]]);
            setDeck([]);
        } else {
            setTwoCards([]);
            setDeck([]);
        }
    };

    // -------------------------
    //  useEffect-y
    // -------------------------
    useEffect(() => {
        setLocalStorage('syntAudio', syntAudio);
    }, [syntAudio]);

    // Za każdym razem, gdy mamy wybraną kategorię i filtr, wczytujemy karty
    useEffect(() => {
        if (selectedCategory !== null && learningFilter !== null) {
            applyFilterAndShuffle();
        }
    }, [selectedCategory, learningFilter]);

    // Reset, gdy zmieniamy filtr/kategorię
    useEffect(() => {
        setCheckedCards(new Set());
        setReviewedSet(new Set());
    }, [learningFilter, selectedCategory]);

    // Stop speaking przy zmianach
    useEffect(() => {
        stopSpeaking();
    }, [
        selectedCategory,
        learningFilter,
        isShuffling,
        animatingCards,
        draggingDirection,
        reversFrontBack,
        syntAudio
    ]);

    useEffect(() => {
        return () => {
            stopSpeaking();
        };
    }, []);

    // -------------------------
    //  Funkcje pomocnicze
    // -------------------------
    const handleSpeak = (text, lang) => {
        stopSpeaking();
        speak(text, lang);
    };

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

    const handleShuffle = async () => {
        if (isShuffling) return;
        setIsShuffling(true);
        await controls.start("shuffling");
        applyFilterAndShuffle();
        setIsShuffling(false);
        setReviewedSet(new Set());
    };

    // -------------------------
    //  Usuwanie karty (NOWA LOGIKA)
    // -------------------------
    // Gdy usuwamy 'bottom' (czyli OSTATNIĄ kartę w <ul>),
    // wstawiamy nową kartę z decka na początek (jako top),
    // a dotychczasowy top spada na drugie miejsce (jako bottom).
    const removeBottomCardFromUI = (id) => {
        setTwoCards(prevTwo => {
            // Zapiszmy "top" zanim usuniemy bottom
            if (prevTwo.length === 2) {
                const [oldTop, oldBottom] = prevTwo;
                if (oldBottom.id === id) {
                    // usuwamy oldBottom -> wstawiamy newCard z decka jako nowy top
                    const newDeck = [...deck];
                    if (newDeck.length > 0) {
                        const newCard = newDeck.shift(); // weź pierwszą kartę
                        setDeck(newDeck);
                        // Nowy stan: [newCard, oldTop]
                        return [newCard, oldTop];
                    } else {
                        // Brak kart w decku
                        return [oldTop];
                    }
                } else {
                    // usuwamy jakąś inną kartę, np. top? (ale w tej logice raczej nie robimy)
                    return prevTwo.filter(c => c.id !== id);
                }
            } else if (prevTwo.length === 1) {
                // Jeżeli jest tylko 1 karta, to usunięcie tej karty -> spróbujmy dobrać nową
                if (prevTwo[0].id === id) {
                    const newDeck = [...deck];
                    if (newDeck.length > 0) {
                        const newCard = newDeck.shift();
                        setDeck(newDeck);
                        return [newCard];
                    } else {
                        return [];
                    }
                } else {
                    return prevTwo;
                }
            } else {
                // pusta tablica
                return [];
            }
        });

        // Oprócz aktualizacji twoCards, usuwamy tę kartę z decka na wszelki wypadek
        setDeck(prev => prev.filter(card => card.id !== id));

        // Dodatkowo: reviewedSet, checkedCards
        setReviewedSet(prev => new Set(prev).add(id));
        setCheckedCards(prev => {
            const newSet = new Set(prev);
            newSet.delete(id);
            return newSet;
        });
    };

    // Funkcje do oznaczania 'know' i 'learn'
    const learnIt = (id) => {
        setFlashcardKnow(id, undefined);
        removeBottomCardFromUI(id);
    };

    const knowIt = (id) => {
        setFlashcardKnow(id, true);
        removeBottomCardFromUI(id);
    };

    // -------------------------
    //  Obsługa Swipe + Animacje
    // -------------------------
    const handleSwipe = (id, direction) => {
        // Obojętnie lewo/prawo – w tej logice usuwamy bottom
        // i wstawiamy nową kartę na górę.
        if (direction === 'lewo') {
            setAnimatingCards(prev => ({ ...prev, [id]: 'animateLeft' }));
        } else if (direction === 'prawo') {
            setAnimatingCards(prev => ({ ...prev, [id]: 'animateRight' }));
        }
        // Po wstępnej animacji i tak ostatecznie w onAnimationComplete
        // wywołamy removeBottomCardFromUI
        setCheckedCards(prev => {
            const newSet = new Set(prev);
            newSet.delete(id);
            return newSet;
        });
    };

    const handleCheck = (id) => {
        setCheckedCards(prev => new Set(prev).add(id));
    };

    // Framer-motion varianty
    const variants = {
        default: {
            x: 0,
            rotate: 0,
        },
        animateLeft: {
            x: -500,
            rotate: -5,
            transition: {
                type: "tween",
                duration: 0.5
            }
        },
        animateRight: {
            x: 500,
            rotate: 5,
            transition: {
                type: "tween",
                duration: 0.5
            }
        },
    };

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

    // Gdy animacja się zakończy -> usuwamy kartę z UI
    useEffect(() => {
        // Po zakończeniu animacji jednej z kart:
        // sprawdzamy animatingCards
        Object.keys(animatingCards).forEach((cardId) => {
            const motionState = animatingCards[cardId];
            if (motionState === 'animateLeft' || motionState === 'animateRight') {
                // remove bottom
                removeBottomCardFromUI(cardId);
                setAnimatingCards(prev => {
                    const newObj = { ...prev };
                    delete newObj[cardId];
                    return newObj;
                });
            }
        });
    }, [animatingCards]);

    // -------------------------
    //  Komunikat - koniec fiszek
    // -------------------------
    useEffect(() => {
        // Warunek "showCompleteMessage" -> jeśli filtr 'all', a talia jest pusta i twoCards też puste
        if (
            learningFilter === 'all' &&
            deck.length === 0 &&
            twoCards.length === 0 &&
            selectedCategory !== null
        ) {
            setShowCompleteMessage(true);
        } else {
            setShowCompleteMessage(false);
        }
    }, [learningFilter, deck, twoCards, selectedCategory]);

    // -------------------------
    //  Drobne akcje (przyciski)
    // -------------------------
    const reversCards = () => {
        setReversFrontBack(prev => !prev);
    };

    const audioOnOff = () => {
        setSyntAudio(prev => !prev);
    };

    const CardFrontOrBack = ({ card, cardLang }) => {
        return (
            <div className="o-list-flashcards__text o-list-flashcards__front o-default-box">
                <p
                    role="button"
                    onClick={() => handleSpeak(card, cardLang)}
                >
                    <span className="o-list-flashcards__lang">
                        <span className="o-list-flashcards__lang-code">{cardLang}</span>
                        <i className="icon-volume"></i>
                    </span>
                    {` ${card}`}
                </p>
            </div>
        );
    };

    // -------------------------
    //  Render
    // -------------------------
    return (
        <div className="o-page-view-flashcards">
            <div className="o-page-view-flashcards__header">
                {selectedCategory !== null && (
                    <ul className="o-list-buttons-clear o-list-buttons-clear--nowrap o-default-box">
                        <li>
                            <button
                                onClick={() => {
                                    setSelectedCategory(null);
                                    setLearningFilter(null);
                                    setCheckedCards(new Set());
                                    setReviewedSet(new Set());
                                    setReversFrontBack(false);
                                    // czyścimy deck i twoCards
                                    setDeck([]);
                                    setTwoCards([]);
                                }}
                            >
                                Kategorie
                            </button>
                        </li>
                        <li>
                            <button
                                className={reversFrontBack ? 'btn--active' : ''}
                                onClick={reversCards}
                            >
                                <i className="icon-switch"></i> Revers <sup>{reversFrontBack ? 'On' : 'Off'}</sup>
                            </button>
                        </li>
                        <li>
                            <button
                                className={syntAudio ? 'btn--active' : ''}
                                onClick={audioOnOff}
                            >
                                <i className="icon-volume"></i> Audio <sup>{syntAudio ? 'On' : 'Off'}</sup>
                            </button>
                        </li>
                    </ul>
                )}

                {selectedCategory !== null && getFilteredFlashcardCount('all') > 0 ? (
                    <>
                        <h2 className="o-page-view-flashcards__title">
                            {selectedCategory === 'All'
                                ? t('all')
                                : (selectedCategory === 'Without category'
                                    ? t('without_category')
                                    : selectedCategory)
                            }
                            {' ('}
                            {selectedCategory === 'All'
                                ? flashcards.length
                                : selectedCategory === 'Without category'
                                    ? flashcards.filter(fc => !fc.category || fc.category.trim() === '').length
                                    : flashcards.filter(fc => fc.category === selectedCategory).length
                            }
                            {')'}
                        </h2>
                        <hr />
                        <ul className="o-page-view-flashcards__tools o-list-buttons-clear o-list-buttons-clear--nowrap o-default-box">
                            {getFilteredFlashcardCount('learningOnly') < getFilteredFlashcardCount('all') && (
                                <li>
                                    <button
                                        className={`btn ${learningFilter === 'all' ? 'btn--active' : ''}`}
                                        onClick={() => {
                                            setLearningFilter('all');
                                            setCheckedCards(new Set());
                                            setReviewedSet(new Set());
                                            applyFilterAndShuffle();
                                        }}
                                    >
                                        Powtórz <sup>
                                        {learningFilter === 'all'
                                            ? (deck.length + twoCards.length)
                                            : getFilteredFlashcardCount('all')}
                                    </sup>
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
                                            setReviewedSet(new Set());
                                            applyFilterAndShuffle();
                                        }}
                                    >
                                        Do nauki <sub>{getFilteredFlashcardCount('learningOnly')}</sub>
                                        <sup>
                                            {learningFilter === 'learningOnly'
                                                ? (deck.length + twoCards.length)
                                                : getFilteredFlashcardCount('learningOnly')}
                                        </sup>
                                    </button>
                                </li>
                            )}
                            {!(learningFilter && twoCards.length === 0 && deck.length === 0) && (
                                <li>
                                    <button onClick={handleShuffle} disabled={isShuffling}>
                                        <i className="icon-spin4"></i> {isShuffling ? 'Resetuje...' : 'Resetuj'}
                                    </button>
                                </li>
                            )}
                        </ul>
                    </>
                ) : null}
            </div>

            {showCompleteMessage && (
                <div className="o-complete-message">
                    <p>Przeglądnołeś wszystkie fiszki w tej kategorii.</p>
                    <ul className="o-list-buttons-clear">
                        <li>
                            <button
                                onClick={() => {
                                    setShowCompleteMessage(false);
                                    setReviewedSet(new Set());
                                    applyFilterAndShuffle();
                                }}
                            >
                                Przeglądaj od nowa
                            </button>
                        </li>
                        {getFilteredFlashcardCount('learningOnly') > 0 && (
                            <li>
                                <button
                                    onClick={() => {
                                        setLearningFilter('learningOnly');
                                        setCheckedCards(new Set());
                                        setReviewedSet(new Set());
                                        applyFilterAndShuffle();
                                    }}
                                >
                                    Przeglądaj tylko te których nie wiedziałeś
                                </button>
                            </li>
                        )}
                    </ul>
                </div>
            )}

            {selectedCategory === null ? (
                flashcards.length > 0 && <p>Wybierz kategorię, aby załadować fiszki.</p>
            ) : (
                learningFilter && (
                    (twoCards.length === 0 && deck.length === 0 && learningFilter === "learningOnly") ? (
                        (getFilteredFlashcardCount('learningOnly') > 0 ? (
                            <>
                                <p>W tej kategorii ciągle posiadasz fiszki do nauki ({getFilteredFlashcardCount('learningOnly')})</p>
                                <ul className="o-list-buttons-clear">
                                    <li>
                                        <button
                                            onClick={() => {
                                                setLearningFilter('learningOnly');
                                                setCheckedCards(new Set());
                                                setReviewedSet(new Set());
                                                applyFilterAndShuffle();
                                            }}
                                        >
                                            Powtórz raz jeszcze naukę
                                        </button>
                                    </li>
                                </ul>
                            </>
                        ) : (
                            <p>Gratulacje, udało ci się zapamiętać wszystkie fiszki w kategorii!</p>
                        ))
                    ) : (
                        // ========================
                        //   ZAWSZE MAX 2 karty -> twoCards
                        // ========================
                        <div className="o-page-view-flashcards__content">
                            <motion.ul
                                className="o-list-flashcards"
                                variants={containerVariants}
                                initial="initial"
                                animate={controls}
                            >
                                <AnimatePresence>
                                    {twoCards.map((card) => (
                                        <motion.li
                                            layoutId={card.id}
                                            className="o-list-flashcards__single-card"
                                            key={card.id}
                                            drag="x"
                                            dragConstraints={{ left: 0, right: 0 }}
                                            dragElastic={0.8}
                                            whileDrag={{
                                                rotate:
                                                    draggingDirection[card.id] === 'prawo'
                                                        ? 5
                                                        : draggingDirection[card.id] === 'lewo'
                                                            ? -5
                                                            : 0
                                            }}
                                            onDrag={(event, info) => {
                                                const { offset } = info;
                                                const threshold = 20;
                                                if (Math.abs(offset.x) > threshold) {
                                                    const direction = offset.x > 0 ? 'prawo' : 'lewo';
                                                    setDraggingDirection(prev => ({
                                                        ...prev, [card.id]: direction
                                                    }));
                                                }
                                            }}
                                            onDragEnd={(event, info) => {
                                                const threshold = 100;
                                                const { offset } = info;
                                                const absX = Math.abs(offset.x);

                                                if (absX > threshold) {
                                                    const direction = offset.x > 0 ? 'prawo' : 'lewo';
                                                    handleSwipe(card.id, direction);
                                                }

                                                setDraggingDirection(prev => {
                                                    const newDrag = { ...prev };
                                                    delete newDrag[card.id];
                                                    return newDrag;
                                                });
                                            }}
                                            variants={variants}
                                            animate={animatingCards[card.id] || 'default'}
                                            style={{
                                                cursor: 'grab',
                                                listStyle: 'none'
                                            }}
                                        >
                                            {reversFrontBack ? (
                                                <CardFrontOrBack
                                                    card={card.back}
                                                    cardLang={card.langBack}
                                                />
                                            ) : (
                                                <CardFrontOrBack
                                                    card={card.front}
                                                    cardLang={card.langFront}
                                                />
                                            )}
                                            <hr />
                                            {checkedCards.has(card.id) && (
                                                !reversFrontBack ? (
                                                    <CardFrontOrBack
                                                        card={card.back}
                                                        cardLang={card.langBack}
                                                    />
                                                ) : (
                                                    <CardFrontOrBack
                                                        card={card.front}
                                                        cardLang={card.langFront}
                                                    />
                                                )
                                            )}
                                            <div className="o-list-flashcards__know">
                                                <p className="o-list-flashcards__swipe-info-know-or-learn">
                                                    {card.know ? (
                                                        <span className="color-green">Już to znam?</span>
                                                    ) : (
                                                        <span className="color-red">Uczę się?</span>
                                                    )}
                                                </p>
                                                <div
                                                    className={`o-list-flashcards__swipe-info-know ${
                                                        draggingDirection[card.id] === 'prawo'
                                                            ? 'o-list-flashcards__swipe-info-know--visible'
                                                            : ''
                                                    }`}
                                                >
                                                    <p><i className="icon-ok"></i> Już to znam</p>
                                                </div>
                                                <div
                                                    className={`o-list-flashcards__swipe-info-learn ${
                                                        draggingDirection[card.id] === 'lewo'
                                                            ? 'o-list-flashcards__swipe-info-learn--visible'
                                                            : ''
                                                    }`}
                                                >
                                                    <p><i className="icon-graduation-cap"></i> Uczę się</p>
                                                </div>
                                                {!checkedCards.has(card.id) ? (
                                                    <button
                                                        className="o-list-flashcards__know-check btn--blue"
                                                        onClick={() => {
                                                            handleCheck(card.id);
                                                            if (syntAudio) {
                                                                if (reversFrontBack) {
                                                                    handleSpeak(card.front, card.langFront);
                                                                } else {
                                                                    handleSpeak(card.back, card.langBack);
                                                                }
                                                            }
                                                        }}
                                                    >
                                                        Sprawdź
                                                    </button>
                                                ) : (
                                                    <ul className="o-list-buttons-clear">
                                                        <li>
                                                            <button
                                                                className="btn--red"
                                                                onClick={() => {
                                                                    setDraggingDirection(prev => ({
                                                                        ...prev,
                                                                        [card.id]: 'lewo'
                                                                    }));
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
                                                                    setDraggingDirection(prev => ({
                                                                        ...prev,
                                                                        [card.id]: 'prawo'
                                                                    }));
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
                                    className={`btn ${
                                        selectedCategory === 'All' && learningFilter === 'all'
                                            ? 'btn--active'
                                            : ''
                                    }`}
                                    onClick={() => {
                                        setSelectedCategory('All');
                                        setLearningFilter('all');
                                        setCheckedCards(new Set());
                                        setReviewedSet(new Set());
                                        setDeck([]);
                                        setTwoCards([]);
                                        applyFilterAndShuffle();
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
                                            className={`btn ${
                                                selectedCategory === cat && learningFilter === 'all'
                                                    ? 'btn--active'
                                                    : ''
                                            }`}
                                            onClick={() => {
                                                setSelectedCategory(cat);
                                                setLearningFilter('all');
                                                setCheckedCards(new Set());
                                                setReviewedSet(new Set());
                                                setDeck([]);
                                                setTwoCards([]);
                                                applyFilterAndShuffle();
                                            }}
                                        >
                                            {cat === 'Without category' ? t('without_category') : cat} ({count})
                                        </button>
                                    </li>
                                );
                            })}
                        </ul>
                    ) : (
                        <div className="o-no-flashcards">
                            <p>{t('no_flashcards')}</p>
                            <ul className="o-list-buttons-clear">
                                <li>
                                    <Link className="btn" to="/create">
                                        <i className="icon-plus"></i> {t('create_flashcard')}
                                    </Link>
                                </li>
                                <li>
                                    <Link className="btn" to="/import-export">
                                        <i className="icon-export"></i> {t('import_export')}
                                    </Link>
                                </li>
                            </ul>
                        </div>
                    )}
                </>
            ) : null}
        </div>
    );
}

export default ViewFlashcards;

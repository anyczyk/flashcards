// ViewFlashcards.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { addMultipleFlashcardsToDB, getAllFlashcards } from '../db';
import { Link } from "react-router-dom";
import { motion, AnimatePresence, useAnimation } from 'framer-motion';
import { speak, stopSpeaking } from "../utils/speak";
import { setLocalStorage, getLocalStorage } from '../utils/storage';
import sampleData from '../data/sample-data.json';

function ViewFlashcards({ loadData, flashcards, categories, setFlashcardKnow, syntAudio }) {
    const { t } = useTranslation();

    const newOrders = getLocalStorage('categoryOrder');
    // Stan wybranej kategorii i superkategorii
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [selectedSuperCategory, setSelectedSuperCategory] = useState(null);
    const [learningFilter, setLearningFilter] = useState(null);

    const [activeSuperCategory, setActiveSuperCategory] = useState(null);

    // - Cała przefiltrowana i przetasowana talia
    const [deck, setDeck] = useState([]);

    // - Dokładnie 2 karty wyświetlane (lub 1, jeśli nie ma drugiej)
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

    // Animacje framer-motion
    const controls = useAnimation();

    // Inne
    const [reviewedSet, setReviewedSet] = useState(new Set());
    const [showCompleteMessage, setShowCompleteMessage] = useState(false);

    const handleActiveSuperCategory = (index) => {
        setActiveSuperCategory(activeSuperCategory === index ? null : index);
    };

    const handleGenerateSampleFlashcards = async () => {
        try {
            const existingFlashcards = await getAllFlashcards();
            if (existingFlashcards.length === 0) {
                await addMultipleFlashcardsToDB(sampleData);
                if (loadData) {
                    await loadData(); // Odśwież fiszki poprzez callback
                }
            } else {
                alert("Baza danych nie jest pusta. Import przykładowych fiszek nie został wykonany.");
            }
        } catch (error) {
            console.error("Błąd podczas importowania przykładowych fiszek:", error);
            alert("Wystąpił błąd podczas importowania przykładowych fiszek.");
        }
    };

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

    const applyFilterAndShuffle = () => {
        let filtered = [];

        if (selectedCategory && selectedSuperCategory) {
            // Jeśli wybrano zarówno kategorię, jak i superCategory, filtrujemy po obu
            filtered = flashcards.filter(fc =>
                fc.superCategory === selectedSuperCategory && fc.category === selectedCategory
            );
        } else if (selectedSuperCategory) {
            // Jeśli wybrano tylko superCategory, filtrujemy po superCategory
            filtered = flashcards.filter(fc => fc.superCategory === selectedSuperCategory);
        } else if (selectedCategory === 'All') {
            filtered = [...flashcards];
        } else if (selectedCategory === 'Without category') {
            // Poprawka: Wyświetlamy TYLKO fiszki bez category i bez superCategory
            filtered = flashcards.filter(fc =>
                (!fc.category || fc.category.trim() === '') && !fc.superCategory
            );
        } else if (selectedCategory) {
            // Sprawdzenie, czy wybrana kategoria jest superCategory
            // (czy istnieją fiszki z fc.superCategory === selectedCategory?)
            const isSuperCategory = flashcards.some(fc => fc.superCategory === selectedCategory);

            if (isSuperCategory) {
                // Jeśli wybrana "kategoria" jest w rzeczywistości superCategory
                filtered = flashcards.filter(fc => fc.superCategory === selectedCategory);
            } else {
                // Jeśli wybrana kategoria nie jest superCategory, filtrujemy po category
                // i jednocześnie upewniamy się, że superCategory jest puste
                filtered = flashcards.filter(fc => fc.category === selectedCategory && !fc.superCategory);
            }
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

    // Za każdym razem, gdy mamy wybraną kategorię, superkategorię lub filtr, wczytujemy karty
    useEffect(() => {
        if (selectedCategory !== null || selectedSuperCategory !== null) {
            applyFilterAndShuffle();
        }
    }, [selectedCategory, selectedSuperCategory, learningFilter]);

    // Reset, gdy zmieniamy filtr/kategorię
    useEffect(() => {
        setCheckedCards(new Set());
        setReviewedSet(new Set());
    }, [learningFilter, selectedCategory, selectedSuperCategory]);

    // Stop speaking przy zmianach
    useEffect(() => {
        stopSpeaking();
    }, [
        selectedCategory,
        selectedSuperCategory,
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

    const handleSpeak = (text, lang) => {
        stopSpeaking();
        speak(text, lang);
    };

    const getFilteredFlashcardCount = (filter) => {
        let filtered = [];

        if (selectedCategory && selectedSuperCategory) {
            filtered = flashcards.filter(fc =>
                fc.superCategory === selectedSuperCategory && fc.category === selectedCategory
            );
        } else if (selectedSuperCategory) {
            filtered = flashcards.filter(fc => fc.superCategory === selectedSuperCategory);
        } else if (selectedCategory === 'All') {
            filtered = [...flashcards];
        } else if (selectedCategory === 'Without category') {
            // Poprawka: liczymy TYLKO fiszki bez category i bez superCategory
            filtered = flashcards.filter(fc =>
                (!fc.category || fc.category.trim() === '') && !fc.superCategory
            );
        } else if (selectedCategory) {
            const isSuperCategory = flashcards.some(fc => fc.superCategory === selectedCategory);

            if (isSuperCategory) {
                filtered = flashcards.filter(fc => fc.superCategory === selectedCategory);
            } else {
                filtered = flashcards.filter(fc => fc.category === selectedCategory && !fc.superCategory);
            }
        }

        if (filter === 'learningOnly') {
            filtered = filtered.filter(fc => fc.know !== true);
        }

        return filtered.length;
    };

    const hasLearningCards = flashcards.some(fc => {
        // do sprawdzenia, czy w ogóle są fiszki do nauki w danym widoku
        if (selectedCategory && selectedSuperCategory) {
            return fc.superCategory === selectedSuperCategory && fc.category === selectedCategory && fc.know !== true;
        }

        if (selectedSuperCategory) {
            return fc.superCategory === selectedSuperCategory && fc.know !== true;
        }

        if (selectedCategory === 'All') {
            return fc.know !== true;
        }

        if (selectedCategory === 'Without category') {
            return ((!fc.category || fc.category.trim() === '') && !fc.superCategory && fc.know !== true);
        }

        if (selectedCategory) {
            const isSuperCategory = flashcards.some(f => f.superCategory === selectedCategory);
            if (isSuperCategory) {
                return fc.superCategory === selectedCategory && fc.know !== true;
            } else {
                return fc.category === selectedCategory && !fc.superCategory && fc.know !== true;
            }
        }

        return false;
    });

    const handleShuffle = async () => {
        if (isShuffling) return;
        setIsShuffling(true);
        await controls.start("shuffling");
        applyFilterAndShuffle();
        setIsShuffling(false);
        setReviewedSet(new Set());
    };

    const removeBottomCardFromUI = (id) => {
        setTwoCards(prevTwo => {
            // Zapiszmy "top" zanim usuniemy bottom
            if (prevTwo.length === 2) {
                const [oldTop, oldBottom] = prevTwo;
                if (oldBottom.id === id) {
                    // Usuwamy oldBottom -> wstawiamy newCard z decka jako nowy top
                    const newDeck = [...deck];
                    if (newDeck.length > 0) {
                        const newCard = newDeck.shift();
                        setDeck(newDeck);
                        // Nowy stan: [newCard, oldTop]
                        return [newCard, oldTop];
                    } else {
                        // Brak kart w decku
                        return [oldTop];
                    }
                } else {
                    // Usuwamy inną kartę, np. top (ale w tej logice raczej nie robimy)
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
                // Pusta tablica
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
        // Z lewej / prawej - w tej logice usuwamy bottom
        if (direction === 'lewo') {
            setAnimatingCards(prev => ({ ...prev, [id]: 'animateLeft' }));
        } else if (direction === 'prawo') {
            setAnimatingCards(prev => ({ ...prev, [id]: 'animateRight' }));
        }
        // Po wstępnej animacji i tak ostatecznie w onAnimationComplete wywołamy removeBottomCardFromUI
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
        animateLeft: {
            x: -650,
            rotate: -5,
            transition: {
                type: "tween",
                duration: 0.3,
                ease: "easeInOut"
            }
        },
        animateRight: {
            x: 650,
            rotate: 5,
            transition: {
                type: "tween",
                duration: 0.3,
                ease: "easeInOut"
            }
        },
        exit: {
            opacity: 0.999,
            transition: {
                duration: 0.2,
                ease: "easeInOut",
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

    //  Komunikat - koniec fiszek
    useEffect(() => {
        if (
            learningFilter === 'all' &&
            deck.length === 0 &&
            twoCards.length === 0 &&
            (selectedCategory !== null || selectedSuperCategory !== null)
        ) {
            setShowCompleteMessage(true);
        } else {
            setShowCompleteMessage(false);
        }
    }, [learningFilter, deck, twoCards, selectedCategory, selectedSuperCategory]);

    const reversCards = () => {
        setReversFrontBack(prev => !prev);
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
                    {card}
                </p>
            </div>
        );
    };

    // -------------------------
    //  Renderowanie
    // -------------------------
    return (
        <div className="o-page-view-flashcards">
            <div className="o-page-view-flashcards__header">
                {(selectedCategory !== null || selectedSuperCategory !== null) && getFilteredFlashcardCount('all') > 0 ? (
                    <>
                        <h2 className="o-page-view-flashcards__title">
                            <span
                                type="button"
                                className="o-page-view-flashcards__title-categories"
                                onClick={() => {
                                    setSelectedCategory(null);
                                    setSelectedSuperCategory(null);
                                    setLearningFilter(null);
                                    setCheckedCards(new Set());
                                    setReviewedSet(new Set());
                                    setReversFrontBack(false);
                                    setDeck([]);
                                    setTwoCards([]);
                                }}>{t('categories')}</span> / {selectedSuperCategory ? `${selectedSuperCategory} / ` : ''} {selectedCategory === 'All'
                            ? t('all')
                            : (selectedCategory === 'Without category'
                                ? t('without_category')
                                : selectedCategory)
                        }
                            {' ('}
                            {selectedSuperCategory !== null
                                ? flashcards.filter(fc => fc.superCategory === selectedSuperCategory && fc.category === selectedCategory).length
                                : selectedCategory === 'All'
                                    ? flashcards.length
                                    : selectedCategory === 'Without category'
                                        ? flashcards.filter(fc =>
                                            (!fc.category || fc.category.trim() === '') && !fc.superCategory
                                        ).length
                                        : flashcards.filter(fc => fc.category === selectedCategory && !fc.superCategory).length
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
                                        {t('review')} <sup>
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
                                        {t('study')} <sub>{getFilteredFlashcardCount('learningOnly')}</sub>
                                        <sup>
                                            {Math.ceil(((getFilteredFlashcardCount('all') - getFilteredFlashcardCount('learningOnly') )* 100) / getFilteredFlashcardCount('all') )}%
                                        </sup>
                                    </button>
                                </li>
                            )}
                            {!(learningFilter && twoCards.length === 0 && deck.length === 0) && (
                                <>
                                    <li className="o-list-buttons-clear__single-icon">
                                        <button aria-label="Restart / Tasowanie" onClick={handleShuffle} disabled={isShuffling}>
                                            <i className="icon-spin4"></i>
                                        </button>
                                    </li>
                                    <li className="o-list-buttons-clear__single-icon">
                                        <button
                                            aria-label="Revers"
                                            className={`btn-revers ${reversFrontBack ? 'btn-revers--active btn--active' : ''}`}
                                            onClick={reversCards}
                                        >
                                            <i className="icon-switch"></i><sup>{reversFrontBack ? 'On' : 'Off'}</sup>
                                        </button>
                                    </li>
                                </>
                            )}
                        </ul>
                    </>
                ) : null}
            </div>

            {showCompleteMessage && (
                <div className="o-complete-message">
                    <p>{t('viewed_all_flashcards')}</p>
                    <ul className="o-list-buttons-clear">
                        <li>
                            <button
                                onClick={() => {
                                    setShowCompleteMessage(false);
                                    setReviewedSet(new Set());
                                    applyFilterAndShuffle();
                                }}
                            >
                                {t('review_again')}
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
                                    {t('review_only_the_ones_you_didnt_know')}
                                </button>
                            </li>
                        )}
                    </ul>
                </div>
            )}

            {(selectedCategory !== null || selectedSuperCategory !== null) ? (
                learningFilter && (
                    (twoCards.length === 0 && deck.length === 0 && learningFilter === "learningOnly") ? (
                        (getFilteredFlashcardCount('learningOnly') > 0 ? (
                            <>
                                <p>{t('in_this_category_you_still_have_flashcards_to_learn')} ({getFilteredFlashcardCount('learningOnly')})</p>
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
                                            {t('repeat_the_lesson_once_again')}
                                        </button>
                                    </li>
                                    <li>
                                        <button>Next lesson</button>
                                    </li>
                                </ul>
                            </>
                        ) : (
                            <>
                                <p>{t('congratulations_text')}</p>
                                <p><button>Next lesson</button></p>
                            </>
                        ))
                    ) : (
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
                                            dragTransition={{
                                                type: "tween",
                                                duration: 0.5,
                                                ease: "easeInOut"
                                            }}
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
                                            animate={animatingCards[card.id]}
                                            exit="exit"
                                            onAnimationComplete={() => {
                                                // Tutaj ostatecznie usuwamy kartę z UI
                                                if (animatingCards[card.id] === 'animateLeft') {
                                                    // Uczę się (lewo)
                                                    learnIt(card.id);
                                                } else if (animatingCards[card.id] === 'animateRight') {
                                                    // Już to znam (prawo)
                                                    knowIt(card.id);
                                                }

                                                // Sprzątanie po skończonej animacji
                                                setAnimatingCards(prev => {
                                                    const newAnim = { ...prev };
                                                    delete newAnim[card.id];
                                                    return newAnim;
                                                });
                                                setDraggingDirection(prev => {
                                                    const newDrag = { ...prev };
                                                    delete newDrag[card.id];
                                                    return newDrag;
                                                });
                                            }}
                                            style={{
                                                cursor: 'grab',
                                                listStyle: 'none',
                                                zIndex: animatingCards[card.id] ? 2 : 1, // Dynamiczny z-index
                                            }}
                                        >
                                            <div
                                                className={`o-list-flashcards__swipe-info-know-or-learn ${card.know ? 'bg-color-green' : 'bg-color-red'}`}>
                                            </div>
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
                                                        {t('check')}
                                                    </button>
                                                ) : (
                                                    <ul className="o-list-buttons-clear">
                                                        <li>
                                                            <button
                                                                className="btn--red"
                                                                onClick={() => {
                                                                    // wyrzucamy kartę w lewo
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
                                                                {t('still_learning')}
                                                            </button>
                                                        </li>
                                                        <li>
                                                            <button
                                                                className="btn--green"
                                                                onClick={() => {
                                                                    // wyrzucamy kartę w prawo
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
                                                                {t('got_it')}
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
            ) : null}

            {(selectedCategory === null && selectedSuperCategory === null) ? (
                <>
                    {flashcards.length > 0 ? (
                        <ul className="o-list-categories">
                            <li style={{ order: 0 }}>
                                <button
                                    className={`btn ${
                                        selectedCategory === 'All' && learningFilter === 'all'
                                            ? 'btn--active'
                                            : ''
                                    }`}
                                    onClick={() => {
                                        setSelectedCategory('All');
                                        setSelectedSuperCategory(null);
                                        setLearningFilter('all');
                                        setCheckedCards(new Set());
                                        setReviewedSet(new Set());
                                        setDeck([]);
                                        setTwoCards([]);
                                        applyFilterAndShuffle();
                                    }}
                                >
                                    <i className="icon-play-outline"></i> {t('all')} ({flashcards.length})
                                </button>
                            </li>
                            {categories.map((cat, index) => {
                                let count;
                                let knowCount;
                                if (cat === 'Without category') {
                                    // Poprawka: Fiszki bez category i bez superCategory
                                    count = flashcards.filter(fc =>
                                        (!fc.category || fc.category.trim() === '') && !fc.superCategory
                                    ).length;

                                    knowCount = flashcards.filter(fc =>
                                        (!fc.category || fc.category.trim() === '') &&
                                        !fc.superCategory &&
                                        fc.know
                                    ).length;
                                } else {
                                    // Liczymy tylko fiszki, które mają category === cat i nie mają superCategory
                                    count = flashcards.filter(fc => fc.category === cat && !fc.superCategory).length;
                                    knowCount = flashcards.filter(fc => fc.category === cat && fc.know && !fc.superCategory).length;
                                }

                                const hasSubcategories = flashcards.some(fc => fc.superCategory === cat);

                                return (
                                    <li key={cat} style={{ order: newOrders?.indexOf(cat) + 1 }}>
                                        {hasSubcategories ? (
                                            <>
                                                <button
                                                    onClick={() => {
                                                        // Toggle wyświetlania subkategorii
                                                        handleActiveSuperCategory(index);
                                                    }}
                                                    className={`bg-color-brow btn-super-category ${activeSuperCategory === index ? 'btn-super-category--active' : ''}`}
                                                >
                                                    <i className={activeSuperCategory === index ? 'icon-folder-open-empty' : 'icon-folder-empty'}></i> {cat}
                                                </button>
                                                {activeSuperCategory === index && (
                                                    <ul className="o-list-categories">
                                                        {flashcards
                                                            .filter(fc => fc.superCategory === cat)
                                                            .map(fc => fc.category)
                                                            .filter((value, i, self) => self.indexOf(value) === i)
                                                            .map(subcat => {
                                                                // Liczymy tylko fiszki, które mają category === subcat i superCategory === cat
                                                                const subcatCount = flashcards.filter(fc => fc.category === subcat && fc.superCategory === cat).length;
                                                                const knowSubcatCount = flashcards.filter(fc => fc.category === subcat && fc.superCategory === cat && fc.know).length;
                                                                return (
                                                                    <li key={subcat}>
                                                                        <button
                                                                            className={`btn bg-color-cream color-green-strong-dark ${selectedCategory === subcat && learningFilter === 'all' ? 'btn--active' : ''}`}
                                                                            onClick={() => {
                                                                                setSelectedCategory(subcat);
                                                                                setSelectedSuperCategory(cat); // Ustawiamy rodzicielską superCategory
                                                                                setLearningFilter('all');
                                                                                setCheckedCards(new Set());
                                                                                setReviewedSet(new Set());
                                                                                setDeck([]);
                                                                                setTwoCards([]);
                                                                                applyFilterAndShuffle();
                                                                            }}
                                                                        >
                                                                            <i className="icon-play-outline"></i> {(subcat === 'Without category' || subcat === '') ? t('without_category') : subcat} ({subcatCount}/<strong
                                                                            className="color-green-dark text-shadow-white">{knowSubcatCount}</strong>)

                                                                            {(subcatCount - knowSubcatCount > 0) ?
                                                                                <>
                                                                                    <sub
                                                                                        className="bg-color-green">{Math.ceil((knowSubcatCount * 100) / subcatCount)}%</sub>
                                                                                    <sup
                                                                                        className="bg-color-red">{subcatCount - knowSubcatCount}</sup>
                                                                                </>
                                                                                : <sub className="o-category-complited bg-color-green vertical-center-count"><i
                                                                                    className="icon-ok"></i></sub>
                                                                            }
                                                                        </button>
                                                                    </li>
                                                                );
                                                            })}
                                                    </ul>
                                                )}
                                            </>
                                        ) : (
                                            (count > 0) && (
                                                <button
                                                    className={`btn ${
                                                        selectedCategory === cat && learningFilter === 'all'
                                                            ? 'btn--active'
                                                            : ''
                                                    }`}
                                                    onClick={() => {
                                                        setSelectedCategory(cat);
                                                        setSelectedSuperCategory(null);
                                                        setLearningFilter('all');
                                                        setCheckedCards(new Set());
                                                        setReviewedSet(new Set());
                                                        setDeck([]);
                                                        setTwoCards([]);
                                                        applyFilterAndShuffle();
                                                    }}
                                                >
                                                    <i className="icon-play-outline"></i> {cat === 'Without category' ? t('without_category') : cat} ({count}/<strong
                                                    className="color-green-dark text-shadow-white">{knowCount}</strong>)
                                                    {(count - knowCount > 0) ?
                                                        <>
                                                            <sub
                                                                className={`bg-color-green`}>{Math.ceil((knowCount * 100) / count)}%</sub>
                                                            <sup className="bg-color-red">{count - knowCount}</sup>
                                                        </>
                                                        :
                                                        <sub className="o-category-complited bg-color-green vertical-center-count"><i
                                                            className="icon-ok"></i></sub>
                                                    }
                                                </button>
                                            )
                                        )}
                                    </li>
                                );
                            })}
                        </ul>
                    ) : (
                        <div className="o-no-flashcards">
                            <p>{t('no_flashcards')}</p>
                            <ul className="o-list-buttons-clear">
                                <li>
                                    <button onClick={() => {
                                        handleGenerateSampleFlashcards();
                                    }}>{t('generate_sample_flashcards')}</button>
                                </li>
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

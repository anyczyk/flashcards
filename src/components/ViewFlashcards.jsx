// ViewFlashcards.jsx
import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from "react-router-dom";
import { motion, AnimatePresence, useAnimation } from 'framer-motion';
import { speak, stopSpeaking } from "../utils/speak";
import { setLocalStorage, getLocalStorage, removeLocalStorage } from '../utils/storage';

function ViewFlashcards({ flashcards, categories, setFlashcardKnow }) {
    const { t } = useTranslation();
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [learningFilter, setLearningFilter] = useState(null); // 'all' lub 'learningOnly'
    const [orderedFlashcards, setOrderedFlashcards] = useState([]);
    const [checkedCards, setCheckedCards] = useState(new Set());
    const [animatingCards, setAnimatingCards] = useState({}); // Nowy stan dla animujących się kart
    const [draggingDirection, setDraggingDirection] = useState({}); // Nowy stan dla kierunku przeciągania
    const [isShuffling, setIsShuffling] = useState(false); // Nowy stan dla animacji tasowania
    const [reversFrontBack, setReversFrontBack] = useState(false);
    const [syntAudio, setSyntAudio] = useState(() => {
        const storedAudio = getLocalStorage('syntAudio');
        return storedAudio !== null ? storedAudio : true;
    });

    const controls = useAnimation(); // Kontroler animacji dla kontenera <ul>

    // Nowe stany do śledzenia przeglądanych fiszek i wyświetlania komunikatu
    const [reviewedSet, setReviewedSet] = useState(new Set());
    const [showCompleteMessage, setShowCompleteMessage] = useState(false);

    // Funkcja do zastosowania filtra i tasowania fiszek
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

        // Tasowanie listy za pomocą algorytmu Fisher-Yates
        for (let i = filtered.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [filtered[i], filtered[j]] = [filtered[j], filtered[i]];
        }

        setOrderedFlashcards(filtered);
    };

    useEffect(() => {
        setLocalStorage('syntAudio', syntAudio);
    }, [syntAudio]);

    // Tasowanie fiszek tylko przy zmianie kategorii lub filtra
    useEffect(() => {
        applyFilterAndShuffle();
    }, [selectedCategory, learningFilter]); // Usuń `flashcards` z zależności

    // Resetowanie checkedCards przy zmianie filtra lub kategorii
    useEffect(() => {
        setCheckedCards(new Set());
        setReviewedSet(new Set()); // Resetowanie przeglądanych fiszek
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
        reversFrontBack,
        syntAudio
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
        applyFilterAndShuffle();

        setIsShuffling(false);
        setReviewedSet(new Set()); // Resetowanie przeglądanych fiszek po tasowaniu
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
            // W trybie 'all' usuń fiszkę z listy
            setOrderedFlashcards(prev => prev.filter(card => card.id !== id));
        } else if (learningFilter === 'learningOnly') {
            // W trybie 'learningOnly' przenieś fiszkę na początek
            moveCardToFront(id);
        }
        // Resetujemy stan sprawdzenia
        setCheckedCards(prev => {
            const newSet = new Set(prev);
            newSet.delete(id);
            return newSet;
        });
        // Dodanie fiszki do przeglądanych
        if (learningFilter === 'all') {
            setReviewedSet(prev => new Set(prev).add(id));
        }
    };

    const knowIt = (id) => {
        // Ustawiamy know = true
        setFlashcardKnow(id, true);
        if (learningFilter === 'all') {
            // W trybie 'all' usuń fiszkę z listy
            setOrderedFlashcards(prev => prev.filter(card => card.id !== id));
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
        // Dodanie fiszki do przeglądanych
        if (learningFilter === 'all') {
            setReviewedSet(prev => new Set(prev).add(id));
        }
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

    // Monitorowanie, czy wszystkie fiszki zostały przeglądnięte w trybie 'all'
    useEffect(() => {
        if (learningFilter === 'all' && orderedFlashcards.length === 0) {
            setShowCompleteMessage(true);
        } else {
            setShowCompleteMessage(false);
        }
    }, [learningFilter, orderedFlashcards]);

    const reversCards = () => {
        setReversFrontBack(prev => !prev);
    };

    const audioOnOff = () => {
        setSyntAudio(prev => !prev);
    };

    const CardFrontOrBack = ({card, cardLang}) => {
      return (
          <div className="o-list-flashcards__text o-list-flashcards__front o-default-box">
              <p role="button"
                 onClick={() => handleSpeak(card, cardLang)}>
                                                    <span className="o-list-flashcards__lang"><span
                                                        className="o-list-flashcards__lang-code">{cardLang}</span><i
                                                        className="icon-volume"></i></span> {card}
              </p>
          </div>
      )
    };

    return (
        <div className="o-page-view-flashcards">
            <div className="o-page-view-flashcards__header">
                {selectedCategory !== null && (
                    <ul className="o-list-buttons-clear o-list-buttons-clear--nowrap o-default-box">
                        <li>
                            <button onClick={() => {
                                setSelectedCategory(null);
                                setLearningFilter(null);
                                setCheckedCards(new Set());
                                setReviewedSet(new Set()); // Resetowanie przeglądanych fiszek
                                setReversFrontBack(false);
                            }}>
                            Wszystkie Kategorie
                            </button>
                        </li>
                        <li>
                            <button className={reversFrontBack ? 'btn--active' : ''} onClick={reversCards}><i className="icon-switch"></i> Revers <sup>{reversFrontBack ? 'On' : 'Off'}</sup></button>
                        </li>
                        <li>
                            <button className={syntAudio ? 'btn--active' : ''} onClick={audioOnOff}><i className="icon-volume"></i> Audio <sup>{syntAudio ? 'On' : 'Off'}</sup></button>
                        </li>
                    </ul>
                )}
                {selectedCategory !== null && getFilteredFlashcardCount('all') > 0 ? (
                    <>
                        <h2 className="o-page-view-flashcards__title">
                            {selectedCategory === 'All'
                                ? t('all')
                                : (selectedCategory === 'Without category' ? t('without_category') : selectedCategory)} (
                            {selectedCategory === 'All'
                                ? flashcards.length
                                : selectedCategory === 'Without category'
                                    ? flashcards.filter(fc => !fc.category || fc.category.trim() === '').length
                                    : flashcards.filter(fc => fc.category === selectedCategory).length}
                            )
                        </h2>
                        <hr />
                        <ul className="o-list-buttons-clear o-list-buttons-clear--nowrap o-default-box">
                            {getFilteredFlashcardCount('learningOnly') < getFilteredFlashcardCount('all') && (
                                <li>
                                    <button
                                        className={`btn ${learningFilter === 'all' ? 'btn--active' : ''}`}
                                        onClick={() => {
                                            setLearningFilter('all');
                                            setCheckedCards(new Set());
                                            setReviewedSet(new Set()); // Resetowanie przeglądanych fiszek
                                        }}
                                    >
                                        Powtórz <sup>
                                        {learningFilter === 'all' ? orderedFlashcards.length : getFilteredFlashcardCount('all')}
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
                                            setReviewedSet(new Set()); // Resetowanie przeglądanych fiszek
                                        }}
                                    >
                                        Do nauki <sup>{getFilteredFlashcardCount('learningOnly')}</sup>
                                    </button>
                                </li>
                            )}
                            {!(learningFilter && orderedFlashcards.length === 0) && <li>
                                <button onClick={handleShuffle} disabled={isShuffling}>
                                    <i className="icon-spin4"></i> {isShuffling ? 'Resetuje...' : 'Resetuj'}
                                </button>
                            </li>}
                        </ul>
                    </>
                ) : null}
            </div>
            {/* Wyświetlanie komunikatu o zakończeniu przeglądania fiszek */}
            {showCompleteMessage && (
                <div className="o-complete-message">
                    <p>Przeglądnołeś wszystkie fiszki w tej kategorii.</p>
                    <ul className="o-list-buttons-clear">
                        <li>
                            <button onClick={() => {
                                setShowCompleteMessage(false);
                                setReviewedSet(new Set());
                                applyFilterAndShuffle();
                            }}>
                                Przeglądaj od nowa
                            </button>
                        </li>
                        {getFilteredFlashcardCount('learningOnly') > 0 && <li>
                            <button
                                onClick={() => {
                                    setLearningFilter('learningOnly');
                                    setCheckedCards(new Set());
                                    setReviewedSet(new Set()); // Resetowanie przeglądanych fiszek
                                }}
                            >
                                Przeglądaj tylko te których nie wiedziałeś
                            </button>
                        </li>}
                    </ul>
                </div>
            )}
            {selectedCategory === null ? (
                flashcards.length > 0 && <p>Wybierz kategorię, aby załadować fiszki.</p>
            ) : (
                learningFilter && (
                    (orderedFlashcards.length === 0 && learningFilter === "learningOnly") ? (
                        <p>Gratulacje, udało ci się zapamiętać wszystkie fiszki w kategorii!</p>
                    ) : (<div className="o-page-view-flashcards__content">
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
                                            dragConstraints={{left: 0, right: 0}}
                                            dragElastic={0.8}
                                            whileDrag={{
                                                rotate: draggingDirection[card.id] === 'prawo'
                                                    ? 5
                                                    : draggingDirection[card.id] === 'lewo'
                                                        ? -5
                                                        : 0
                                            }}
                                            onDrag={(event, info) => {
                                                const {offset} = info;
                                                const threshold = 20; // Minimalny przesunięcie do rozpoznania kierunku
                                                if (Math.abs(offset.x) > threshold) {
                                                    const direction = offset.x > 0 ? 'prawo' : 'lewo';
                                                    setDraggingDirection(prev => ({...prev, [card.id]: direction}));
                                                }
                                            }}
                                            onDragEnd={(event, info) => {
                                                const threshold = 100; // Próg w px
                                                const {offset} = info;
                                                const absX = Math.abs(offset.x);

                                                if (absX > threshold) { // Tylko przeciąganie w poziomie
                                                    const direction = offset.x > 0 ? 'prawo' : 'lewo';
                                                    handleSwipe(card.id, direction);
                                                }

                                                // Resetowanie kierunku przeciągania po zakończeniu animacji
                                                setDraggingDirection(prev => {
                                                    const newDrag = {...prev};
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
                                                        const newAnim = {...prev};
                                                        delete newAnim[card.id];
                                                        return newAnim;
                                                    });
                                                } else if (animatingCards[card.id] === 'animateRight') {
                                                    knowIt(card.id);
                                                    setAnimatingCards(prev => {
                                                        const newAnim = {...prev};
                                                        delete newAnim[card.id];
                                                        return newAnim;
                                                    });
                                                }

                                                // Resetowanie kierunku przeciągania po zakończeniu animacji
                                                setDraggingDirection(prev => {
                                                    const newDrag = {...prev};
                                                    delete newDrag[card.id];
                                                    return newDrag;
                                                });
                                            }}

                                            // transition={{
                                            //     type: "spring",
                                            //     stiffness: 300,
                                            //     damping: 30,
                                            //     duration: 0.3
                                            // }}

                                            style={{
                                                cursor: 'grab',
                                                listStyle: 'none',
                                                overflowY: 'auto', // Umożliwia przewijanie zawartości wewnątrz fiszki
                                            }}
                                        >

                                            {reversFrontBack ? <CardFrontOrBack card={card.back} cardLang={card.langBack} /> : <CardFrontOrBack card={card.front} cardLang={card.langFront} />}
                                            <hr/>
                                            {checkedCards.has(card.id) && (
                                                !reversFrontBack ? <CardFrontOrBack card={card.back} cardLang={card.langBack} /> : <CardFrontOrBack card={card.front} cardLang={card.langFront} />
                                            )}
                                            <div className="o-list-flashcards__know">
                                                <p className="o-list-flashcards__swipe-info-know-or-learn">
                                                    {card.know ? <span className="color-green">Już to znam?</span> :
                                                        <span className="color-red">Uczę się?</span>}
                                                </p>
                                                <div
                                                    className={`o-list-flashcards__swipe-info-know ${draggingDirection[card.id] === 'prawo' ? 'o-list-flashcards__swipe-info-know--visible' : ''}`}>
                                                    <p><i className="icon-ok"></i> Już to znam</p>
                                                </div>
                                                <div
                                                    className={`o-list-flashcards__swipe-info-learn ${draggingDirection[card.id] === 'lewo' ? 'o-list-flashcards__swipe-info-learn--visible' : ''}`}>
                                                    <p><i className="icon-graduation-cap"></i> Uczę się</p>
                                                </div>
                                                {!checkedCards.has(card.id) ? (
                                                    <button
                                                        className="o-list-flashcards__know-check btn--blue"
                                                        onClick={() => {
                                                            handleCheck(card.id);
                                                            if(syntAudio) {
                                                                if(reversFrontBack) {
                                                                    handleSpeak(card.front, card.langFront);
                                                                } else {
                                                                    handleSpeak(card.back, card.langBack);
                                                                }
                                                            }
                                                        }
                                                    }
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
                                    className={`btn ${selectedCategory === 'All' && learningFilter === 'all' ? 'btn--active' : ''}`}
                                    onClick={() => {
                                        setSelectedCategory('All');
                                        setLearningFilter('all');
                                        setCheckedCards(new Set());
                                        setReviewedSet(new Set()); // Resetowanie przeglądanych fiszek
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
                                                setReviewedSet(new Set()); // Resetowanie przeglądanych fiszek
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
                                <li><Link className="btn" to="/create"><i
                                    className="icon-plus"></i> {t('create_flashcard')}</Link></li>
                                <li><Link className="btn" to="/import-export"><i
                                    className="icon-export"></i> {t('import_export')}</Link></li>
                            </ul>
                        </div>
                    )}
                </>
            ) : null}
        </div>
    );

}

export default ViewFlashcards;

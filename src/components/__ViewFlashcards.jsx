// ViewFlashcards.jsx
import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from "react-router-dom";
import { motion, AnimatePresence, useAnimation } from 'framer-motion';
import { speak, stopSpeaking } from "../utils/speak";
import { setLocalStorage, getLocalStorage } from '../utils/storage';

function ViewFlashcards({ flashcards, categories, setFlashcardKnow }) {
    const { t } = useTranslation();
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [learningFilter, setLearningFilter] = useState(null);
    const [orderedFlashcards, setOrderedFlashcards] = useState([]);
    const [checkedCards, setCheckedCards] = useState(new Set());
    const [animatingCards, setAnimatingCards] = useState({});
    const [draggingDirection, setDraggingDirection] = useState({});
    const [isShuffling, setIsShuffling] = useState(false);
    const [reversFrontBack, setReversFrontBack] = useState(false);
    const [syntAudio, setSyntAudio] = useState(() => {
        const storedAudio = getLocalStorage('syntAudio');
        return storedAudio !== null ? storedAudio : true;
    });

    const controls = useAnimation();
    const [reviewedSet, setReviewedSet] = useState(new Set());
    const [showCompleteMessage, setShowCompleteMessage] = useState(false);

    // number of loaded cards for optimization
    const NR_LOADED_CARDS = 4;
    const [visibleCount, setVisibleCount] = useState(NR_LOADED_CARDS);
    const listRef = useRef(null);

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

        // Tasujemy listę tylko raz przy zmianie kategorii/filtra
        for (let i = filtered.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [filtered[i], filtered[j]] = [filtered[j], filtered[i]];
        }

        setOrderedFlashcards(filtered);
        setVisibleCount(NR_LOADED_CARDS);
    };

    useEffect(() => {
        setLocalStorage('syntAudio', syntAudio);
    }, [syntAudio]);

    useEffect(() => {
        if (selectedCategory !== null && learningFilter !== null) {
            // Przy zmianie kategorii/filtra wczytujemy i tasujemy raz
            applyFilterAndShuffle();
        }
    }, [selectedCategory, learningFilter]);

    useEffect(() => {
        setCheckedCards(new Set());
        setReviewedSet(new Set());
    }, [learningFilter, selectedCategory]);

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

    const handleSpeak = (text, lang) => {
        stopSpeaking();
        speak(text, lang);
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

    const handleShuffle = async () => {
        if (isShuffling) return;
        setIsShuffling(true);
        await controls.start("shuffling");
        // Przetasowanie po kliknięciu "Resetuj"
        applyFilterAndShuffle();
        setIsShuffling(false);
        setReviewedSet(new Set());
    };

    // Funckja do przeniesienia karty na początek listy
    const moveCardToFront = (id) => {
        setOrderedFlashcards(prev => {
            const idx = prev.findIndex(c => c.id === id);
            if (idx < 0) return prev;
            const card = prev[idx];
            const newList = [card, ...prev.slice(0, idx), ...prev.slice(idx+1)];
            return newList;
        });
    };

    // Uczy się:
    // - W trybie "all" usuwamy kartę
    // - W trybie "learningOnly" przenosimy kartę na początek listy
    const learnIt = (id) => {
        setFlashcardKnow(id, undefined);

        if (learningFilter === 'all') {
            setOrderedFlashcards(prev => prev.filter(card => card.id !== id));
            if (learningFilter === 'all') {
                setReviewedSet(prev => new Set(prev).add(id));
            }
        } else if (learningFilter === 'learningOnly') {
            // Przenosimy kartę na początek listy
            moveCardToFront(id);
        }

        setCheckedCards(prev => {
            const newSet = new Set(prev);
            newSet.delete(id);
            return newSet;
        });
    };

    // Znamy kartę -> usuwamy w obu trybach
    const knowIt = (id) => {
        setFlashcardKnow(id, true);
        setOrderedFlashcards(prev => prev.filter(card => card.id !== id));

        setCheckedCards(prev => {
            const newSet = new Set(prev);
            newSet.delete(id);
            return newSet;
        });
        if (learningFilter === 'all') {
            setReviewedSet(prev => new Set(prev).add(id));
        }
    };

    const handleSwipe = (id, direction) => {
        if (direction === 'prawo') {
            setAnimatingCards(prev => ({ ...prev, [id]: 'animateRight' }));
        } else if (direction === 'lewo') {
            setAnimatingCards(prev => ({ ...prev, [id]: 'animateLeft' }));
        }
        setCheckedCards(prev => {
            const newSet = new Set(prev);
            newSet.delete(id);
            return newSet;
        });
    };

    const handleCheck = (id) => {
        setCheckedCards(prev => new Set(prev).add(id));
    };

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

    useEffect(() => {
        if (learningFilter === 'all' && orderedFlashcards.length === 0 && selectedCategory !== null) {
            setShowCompleteMessage(true);
        } else {
            setShowCompleteMessage(false);
        }
    }, [learningFilter, orderedFlashcards, selectedCategory]);

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

    const handleScroll = () => {
        if (!listRef.current) return;
        const { scrollTop, clientHeight, scrollHeight } = listRef.current;
        if (scrollTop + clientHeight >= scrollHeight - 10) {
            setVisibleCount(prev => {
                const newCount = prev + NR_LOADED_CARDS;
                return newCount > orderedFlashcards.length ? orderedFlashcards.length : newCount;
            });
        }
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
                                setReviewedSet(new Set());
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
                                            setReviewedSet(new Set());
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
                                            setReviewedSet(new Set());
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
                                    setReviewedSet(new Set());
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
                    ) : (
                        <div className="o-page-view-flashcards__content" ref={listRef} onScroll={handleScroll}>
                            <motion.ul
                                className="o-list-flashcards"
                                variants={containerVariants}
                                initial="initial"
                                animate={controls}
                            >
                                <AnimatePresence mode="popLayout">
                                    {orderedFlashcards.slice(0, visibleCount).map((card) => (
                                        <motion.li
                                            className="o-list-flashcards__single-card"
                                            key={card.id}
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
                                                const threshold = 20;
                                                if (Math.abs(offset.x) > threshold) {
                                                    const direction = offset.x > 0 ? 'prawo' : 'lewo';
                                                    setDraggingDirection(prev => ({...prev, [card.id]: direction}));
                                                }
                                            }}
                                            onDragEnd={(event, info) => {
                                                const threshold = 100;
                                                const {offset} = info;
                                                const absX = Math.abs(offset.x);

                                                if (absX > threshold) {
                                                    const direction = offset.x > 0 ? 'prawo' : 'lewo';
                                                    handleSwipe(card.id, direction);
                                                }

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
                                                    // Uczę się
                                                    learnIt(card.id);
                                                } else if (animatingCards[card.id] === 'animateRight') {
                                                    // Już to znam
                                                    knowIt(card.id);
                                                }

                                                setAnimatingCards(prev => {
                                                    const newAnim = {...prev};
                                                    delete newAnim[card.id];
                                                    return newAnim;
                                                });
                                                setDraggingDirection(prev => {
                                                    const newDrag = {...prev};
                                                    delete newDrag[card.id];
                                                    return newDrag;
                                                });
                                            }}
                                            style={{
                                                cursor: 'grab',
                                                listStyle: 'none'
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
                                    className={`btn ${selectedCategory === 'All' && learningFilter === 'all' ? 'btn--active' : ''}`}
                                    onClick={() => {
                                        setSelectedCategory('All');
                                        setLearningFilter('all');
                                        setCheckedCards(new Set());
                                        setReviewedSet(new Set());
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
                                                setReviewedSet(new Set());
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

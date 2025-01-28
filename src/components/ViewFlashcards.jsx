// ViewFlashcards.jsx
import React, { useState, useEffect, useRef, useMemo, useCallback, useContext } from 'react';
import { useTranslation } from 'react-i18next';
import { speak, stopSpeaking } from "../utils/speak";
import { getLocalStorage } from '../utils/storage';
import useOrderedCategories from "../hooks/useOrderedCategories";
import SubNavigation from "./sub-components/ViewFlashcards/SubNavigation";
import SuggestionsAfterLesson from "./sub-components/ViewFlashcards/SuggestionsAfterLesson";
import FlashCards from "./sub-components/ViewFlashcards/FlashCards";
import CategoryList from "./sub-components/ViewFlashcards/CategoryList";
import { calculateReadingTimeInMs } from '../utils/calculateReadingTimeInMs';
import { FlashcardContext } from '../context/FlashcardContext';
import {parseCardText, stripFormattingTags} from '../utils/formatTextes';

function ViewFlashcards({ clearInsomnia, mainHomePageLoad, setMainHomePageLoad }) {
    const { t } = useTranslation();
    const {
        flashcards,
        categories,
        syntAudio,
        loadData,
        setFlashcardKnow,
        orderedCategories,
        setOrderedCategories,
        playFlashcards,
        setPlayFlashcards
    } = useContext(FlashcardContext);

    const newOrders = getLocalStorage('categoryOrder');

    const isAutoPlayCancelledRef = useRef(false);
    const autoPlayTimeoutRef = useRef(null);
    const autoPlayRunningRef = useRef(false);

    const [selectedCategory, setSelectedCategory] = useState(null);
    const [selectedSuperCategory, setSelectedSuperCategory] = useState(null);
    const [learningFilter, setLearningFilter] = useState(null);

    const [deck, setDeck] = useState([]);
    const [twoCards, setTwoCards] = useState([]);
    const twoCardsRef = useRef([]);

    const currentCardRef = useRef(null);

    useEffect(() => {
        if (!playFlashcards) {
            clearInsomnia();
        }
    }, [playFlashcards, clearInsomnia]);

    useEffect(() => {
        twoCardsRef.current = twoCards;
    }, [twoCards]);

    const [checkedCards, setCheckedCards] = useState(new Set());
    const [animatingCards, setAnimatingCards] = useState({});

    const syntAudioRef = useRef(syntAudio);

    useEffect(() => {
        syntAudioRef.current = syntAudio;
    }, [syntAudio]);

    const [reversFrontBack, setReversFrontBack] = useState(false);
    const [showCompleteMessage, setShowCompleteMessage] = useState(false);

    useOrderedCategories(categories, setOrderedCategories);
    const shuffleArray = (array) => {
        const newArray = [...array];
        for (let i = newArray.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
        }
        return newArray;
    };

    const filteredAndShuffled = useMemo(() => {
        let filtered = [];

        if (selectedCategory && selectedSuperCategory) {
            filtered = flashcards.filter(
                (fc) => fc.superCategory === selectedSuperCategory && fc.category === selectedCategory
            );
        } else if (selectedSuperCategory) {
            filtered = flashcards.filter((fc) => fc.superCategory === selectedSuperCategory);
        } else if (selectedCategory === 'All') {
            filtered = [...flashcards];
        } else if (selectedCategory) {
            const isSuperCategory = flashcards.some((fc) => fc.superCategory === selectedCategory);
            if (isSuperCategory) {
                filtered = flashcards.filter((fc) => fc.superCategory === selectedCategory);
            } else {
                filtered = flashcards.filter(
                    (fc) => fc.category === selectedCategory && !fc.superCategory
                );
            }
        }

        if (learningFilter === 'learningOnly') {
            filtered = filtered.filter((fc) => fc.know !== true);
        }

        const shuffled = shuffleArray(filtered);
        return shuffled;
    }, [flashcards, selectedCategory, selectedSuperCategory, learningFilter]);

    const applyFilterAndShuffle = useCallback(() => {
        if (filteredAndShuffled.length >= 2) {
            const [first, second, ...rest] = filteredAndShuffled;
            setTwoCards([first, second]);
            setDeck(rest);
        } else if (filteredAndShuffled.length === 1) {
            setTwoCards([filteredAndShuffled[0]]);
            setDeck([]);
        } else {
            setTwoCards([]);
            setDeck([]);
        }

        setCheckedCards(new Set());
    }, [filteredAndShuffled]);

    const speakText = (text, lang) => {
        return new Promise((resolve, reject) => {
            handleSpeak(text, lang, (error) => {
                if (error) {
                    reject(error);
                } else {
                    resolve();
                }
            });
        });
    };

    const startAutoPlay = async () => {
        if (!autoPlayRunningRef.current) return;

        const processNext = async () => {
            if (isAutoPlayCancelledRef.current || !autoPlayRunningRef.current) {
                return;
            }

            if (twoCardsRef.current.length === 0) {
                setPlayFlashcards(false);
                return;
            }

            const currentCard = twoCardsRef.current[twoCardsRef.current.length - 1];
            currentCardRef.current = currentCard.id;

            try {
                const firstSideText = reversFrontBack ? currentCard.back : currentCard.front;
                const firstSideLang = reversFrontBack ? currentCard.langBack : currentCard.langFront;

                let waiting1 = 1000;
                if (syntAudioRef.current) {
                    await speakText(stripFormattingTags(firstSideText), firstSideLang);
                    if (isAutoPlayCancelledRef.current) return;
                } else {
                    waiting1 = calculateReadingTimeInMs(firstSideText);
                }

                await new Promise((resolve) => {
                    autoPlayTimeoutRef.current = setTimeout(resolve, waiting1);
                });
                if (isAutoPlayCancelledRef.current) return;

                setCheckedCards((prev) => new Set(prev).add(currentCard.id));

                let waiting2 = 1000;
                if (syntAudioRef.current) {
                    const secondSideText = reversFrontBack ? currentCard.front : currentCard.back;
                    const secondSideLang = reversFrontBack ? currentCard.langFront : currentCard.langBack;
                    await speakText(stripFormattingTags(secondSideText), secondSideLang);
                    if (isAutoPlayCancelledRef.current) return;
                } else {
                    waiting2 = calculateReadingTimeInMs(firstSideText);
                }
                await new Promise((resolve) => {
                    autoPlayTimeoutRef.current = setTimeout(resolve, waiting2);
                });
                if (isAutoPlayCancelledRef.current) return;

                if (currentCard.know === true) {
                    setAnimatingCards((prev) => ({...prev, [currentCard.id]: 'animateRight'}));  // "Got it"
                } else {
                    setAnimatingCards((prev) => ({...prev, [currentCard.id]: 'animateLeft'}));   // "Still learning"
                }

                await new Promise((resolve) => {
                    autoPlayTimeoutRef.current = setTimeout(resolve, 900);
                });
                if (isAutoPlayCancelledRef.current) return;

                if (currentCard.know === true) {
                    knowIt(currentCard.id);
                } else {
                    learnIt(currentCard.id);
                }

                setTimeout(() => {
                    processNext();
                }, 600);
            } catch (error) {
                console.error('Error in autoplay', error);
            }
        };

        processNext();
    };

    const handlePlayFlashcards = () => {
        setPlayFlashcards((prevValue) => {
            const nextValue = !prevValue;
            if (nextValue) {
                isAutoPlayCancelledRef.current = false;
                autoPlayRunningRef.current = true;
                startAutoPlay();
                if (window.plugins && window.plugins.insomnia) {
                    window.plugins.insomnia.keepAwake();
                }
            } else {
                isAutoPlayCancelledRef.current = true;
                autoPlayRunningRef.current = false;
                clearTimeout(autoPlayTimeoutRef.current);
                stopSpeaking();
                clearInsomnia();
            }
            return nextValue;
        });
    };

    useEffect(() => {
        return () => {
            stopSpeaking();
            clearTimeout(autoPlayTimeoutRef.current);
        };
    }, []);

    useEffect(() => {
        if (selectedCategory !== null || selectedSuperCategory !== null) {
            applyFilterAndShuffle();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedCategory, selectedSuperCategory, learningFilter]);

    useEffect(() => {
        setCheckedCards(new Set());
    }, [learningFilter, selectedCategory, selectedSuperCategory]);

    useEffect(() => {
        stopSpeaking();
    }, [
        selectedCategory,
        selectedSuperCategory,
        learningFilter,
        reversFrontBack,
        syntAudio
    ]);

    useEffect(() => {
        return () => {
            stopSpeaking();
        };
    }, []);

    const handleSpeak = (text, lang, onEndCallback) => {
        stopSpeaking();
        speak(text, lang, onEndCallback);
    };

    const lastSpokenCardIdRef = useRef(null);
    useEffect(() => {
        if (!syntAudio) return;
        if (playFlashcards) return;

        if (twoCards.length > 0) {
            const topCard = twoCards[twoCards.length - 1];
            if (topCard.id !== lastSpokenCardIdRef.current) {
                stopSpeaking();
                lastSpokenCardIdRef.current = topCard.id;
                if (reversFrontBack) {
                    handleSpeak(stripFormattingTags(topCard.back), topCard.langBack);
                } else {
                    handleSpeak(stripFormattingTags(topCard.front), topCard.langFront);
                }
            }
        } else {
            stopSpeaking();
            lastSpokenCardIdRef.current = null;
        }
    }, [twoCards, syntAudio, reversFrontBack, playFlashcards]);

    const getFilteredFlashcardCount = (filter) => {
        let filtered = [];

        if (selectedCategory && selectedSuperCategory) {
            filtered = flashcards.filter(
                (fc) => fc.superCategory === selectedSuperCategory && fc.category === selectedCategory
            );
        } else if (selectedSuperCategory) {
            filtered = flashcards.filter((fc) => fc.superCategory === selectedSuperCategory);
        } else if (selectedCategory === 'All') {
            filtered = [...flashcards];
        } else if (selectedCategory) {
            const isSuperCategory = flashcards.some((fc) => fc.superCategory === selectedCategory);
            if (isSuperCategory) {
                filtered = flashcards.filter((fc) => fc.superCategory === selectedCategory);
            } else {
                filtered = flashcards.filter(
                    (fc) => fc.category === selectedCategory && !fc.superCategory
                );
            }
        }

        if (filter === 'learningOnly') {
            filtered = filtered.filter((fc) => fc.know !== true);
        }

        return filtered.length;
    };

    const removeBottomCardFromUI = (id) => {
        setTwoCards((prevTwo) => {
            if (prevTwo.length === 2) {
                const [oldTop, oldBottom] = prevTwo;
                if (oldBottom.id === id) {
                    const newDeck = [...deck];
                    if (newDeck.length > 0) {
                        const newCard = newDeck.shift();
                        setDeck(newDeck);
                        return [newCard, oldTop];
                    } else {
                        return [oldTop];
                    }
                } else {
                    return prevTwo.filter((c) => c.id !== id);
                }
            } else if (prevTwo.length === 1) {
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
                return [];
            }
        });

        setCheckedCards((prev) => {
            const newSet = new Set(prev);
            newSet.delete(id);
            return newSet;
        });
    };

    const learnIt = (id) => {
        setFlashcardKnow(id, undefined);
        removeBottomCardFromUI(id);
    };

    const knowIt = (id) => {
        setFlashcardKnow(id, true);
        removeBottomCardFromUI(id);
    };

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
        setReversFrontBack((prev) => !prev);
    };

    const buildLessonsList = () => {
        const baseCategories = categories.filter((cat) => cat !== 'All');

        let mainLessons = baseCategories.map((cat) => ({
            superCategory: null,
            category: cat,
        }));

        let subLessons = [];
        const uniqueSuperCats = [
            ...new Set(
                flashcards
                    .filter((fc) => fc.superCategory)
                    .map((fc) => fc.superCategory)
            ),
        ];

        uniqueSuperCats.forEach((superCat) => {
            const catSet = new Set(
                flashcards
                    .filter((fc) => fc.superCategory === superCat)
                    .map((fc) => fc.category)
            );
            [...catSet].forEach((ct) => {
                subLessons.push({
                    superCategory: superCat,
                    category: ct,
                });
            });
        });

        let finalList = [
            {
                superCategory: null,
                category: 'All',
            },
        ];
        finalList = finalList.concat(mainLessons);
        finalList = finalList.concat(subLessons);

        if (newOrders && newOrders.length > 0) {
            finalList.sort((a, b) => {
                let nameA = a.superCategory
                    ? a.superCategory
                    : a.category;
                let nameB = b.superCategory
                    ? b.superCategory
                    : b.category;

                let indexA = newOrders.indexOf(nameA);
                let indexB = newOrders.indexOf(nameB);

                if (indexA === -1) indexA = 9999;
                if (indexB === -1) indexB = 9999;

                return indexA - indexB;
            });
        }

        return finalList;
    };

    const handleNextLesson = () => {
        const lessonsList = buildLessonsList();

        let currentIndex = lessonsList.findIndex(
            (lesson) =>
                lesson.superCategory === selectedSuperCategory &&
                lesson.category === selectedCategory
        );

        if (currentIndex < 0) {
            currentIndex = -1;
        }

        let nextIndex = currentIndex + 1;
        while (nextIndex < lessonsList.length) {
            const nextLesson = lessonsList[nextIndex];
            const isSubcategoryInDB = flashcards.some(
                (fc) => fc.superCategory === nextLesson.category
            );

            if (isSubcategoryInDB) {
                nextIndex++;
                continue;
            }

            setSelectedCategory(nextLesson.category);
            setSelectedSuperCategory(
                nextLesson.superCategory && nextLesson.superCategory.trim() !== ''
                    ? nextLesson.superCategory
                    : null
            );
            setLearningFilter('all');
            setCheckedCards(new Set());
            setDeck([]);
            setTwoCards([]);
            return;
        }
        alert(t('missing_next_lesson_in_sequence'));
    };

    const handleMainHomePageLoad = () => {
        setSelectedCategory(null);
        setSelectedSuperCategory(null);
        setLearningFilter(null);
        setCheckedCards(new Set());
        setReversFrontBack(false);
        setPlayFlashcards(false);
        setDeck([]);
        setTwoCards([]);
        clearInsomnia();
        setMainHomePageLoad(false);
    };

    useEffect(() => {
        handleMainHomePageLoad();
    }, [mainHomePageLoad]);

    return (
        <div className="o-page-view-flashcards">
            <SubNavigation
                selectedCategory={selectedCategory}
                selectedSuperCategory={selectedSuperCategory}
                getFilteredFlashcardCount={getFilteredFlashcardCount}
                learningFilter={learningFilter}
                setLearningFilter={setLearningFilter}
                setCheckedCards={setCheckedCards}
                applyFilterAndShuffle={applyFilterAndShuffle}
                playFlashcards={playFlashcards}
                handlePlayFlashcards={handlePlayFlashcards}
                deck={deck}
                twoCards={twoCards}
                reversFrontBack={reversFrontBack}
                flashcards={flashcards}

                handleMainHomePageLoad={handleMainHomePageLoad}
                reversCards={reversCards}
            />

            <SuggestionsAfterLesson
                getFilteredFlashcardCount={getFilteredFlashcardCount}
                setLearningFilter={setLearningFilter}
                setCheckedCards={setCheckedCards}
                applyFilterAndShuffle={applyFilterAndShuffle}
                handleNextLesson={handleNextLesson}

                showCompleteMessage={showCompleteMessage}
                setShowCompleteMessage={setShowCompleteMessage}
            />

            <FlashCards
                selectedCategory={selectedCategory}
                selectedSuperCategory={selectedSuperCategory}
                getFilteredFlashcardCount={getFilteredFlashcardCount}
                learningFilter={learningFilter}
                setLearningFilter={setLearningFilter}
                setCheckedCards={setCheckedCards}
                applyFilterAndShuffle={applyFilterAndShuffle}
                playFlashcards={playFlashcards}
                handlePlayFlashcards={handlePlayFlashcards}
                deck={deck}
                twoCards={twoCards}
                reversFrontBack={reversFrontBack}
                handleNextLesson={handleNextLesson}
                loadData={loadData}

                syntAudioRef={syntAudioRef}
                isAutoPlayCancelledRef={isAutoPlayCancelledRef}
                setPlayFlashcards={setPlayFlashcards}
                syntAudio={syntAudio}
                twoCardsRef={twoCardsRef}
                handleSpeak={handleSpeak}
                checkedCards={checkedCards}
                animatingCards={animatingCards}
                setAnimatingCards={setAnimatingCards}
                learnIt={learnIt}
                knowIt={knowIt}
                setTwoCards={setTwoCards}
                setDeck={setDeck}
            />

            <CategoryList
                learningFilter={learningFilter}
                setTwoCards={setTwoCards}
                setDeck={setDeck}
                setCheckedCards={setCheckedCards}
                setLearningFilter={setLearningFilter}
                flashcards={flashcards}
                selectedSuperCategory={selectedSuperCategory}
                selectedCategory={selectedCategory}
                loadData={loadData}

                setSelectedSuperCategory={setSelectedSuperCategory}
                setSelectedCategory={setSelectedCategory}
                orderedCategories={orderedCategories}
            />
        </div>
    );
}

export default ViewFlashcards;

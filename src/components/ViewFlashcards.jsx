// ViewFlashcards.jsx
import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import {
    addMultipleFlashcardsToDB,
    getAllFlashcards,
    editFlashcardInDB
} from '../db';
import { Link } from "react-router-dom";
import { motion, AnimatePresence, useAnimation } from 'framer-motion';
import { speak, stopSpeaking } from "../utils/speak";
import { setLocalStorage, getLocalStorage } from '../utils/storage';
import sampleData from '../data/sample-data.json';

function ViewFlashcards({ clearInsomnia, loadData, flashcards, categories, setFlashcardKnow, syntAudio, playFlashcards, setPlayFlashcards, setMainHomePageLoad, mainHomePageLoad }) {
    const { t } = useTranslation();

    const newOrders = getLocalStorage('categoryOrder');
    const [openCardId, setOpenCardId] = useState(false);
    const [openCard, setOpenCard] = useState(false);
    const [whiteSpaceNowrap, setWhiteSpaceNowrap] = useState(false);

    // Stan wybranej kategorii i superkategorii
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [selectedSuperCategory, setSelectedSuperCategory] = useState(null);
    const [learningFilter, setLearningFilter] = useState(null);

    // Stany do szybkiej edycji
    const [quickEdit, setQuickEdit] = useState({});

    // Superkategorie rozwijalne
    const [activeSuperCategory, setActiveSuperCategory] = useState(null);

    // Talia kart i dwie karty na wierzchu
    const [deck, setDeck] = useState([]);
    const [twoCards, setTwoCards] = useState([]);
    const twoCardsRef = useRef([]);

    useEffect(() => {
        if (!playFlashcards) {
            clearInsomnia();
        }
    }, [playFlashcards, clearInsomnia]);

    // Synchronizacja twoCardsRef z twoCards
    useEffect(() => {
        twoCardsRef.current = twoCards;
    }, [twoCards]);

    const [checkedCards, setCheckedCards] = useState(new Set());
    const [animatingCards, setAnimatingCards] = useState({});
    const [draggingDirection, setDraggingDirection] = useState({});

    // Flagi jednorazowe
    const [isShuffling, setIsShuffling] = useState(false);
    const [reversFrontBack, setReversFrontBack] = useState(false);

    // Animacje
    const controls = useAnimation();

    // Inne
    const [reviewedSet, setReviewedSet] = useState(new Set());
    const [showCompleteMessage, setShowCompleteMessage] = useState(false);

    // --- REFS i timery do auto-play ---
    const autoPlayTimeoutRef = useRef(null);
    const isAutoPlayCancelledRef = useRef(false);
    const autoPlayRunningRef = useRef(false); // Nowy ref do śledzenia, czy auto-play jest aktywny
    const currentCardRef = useRef(null); // Ref do śledzenia aktualnej karty

    // --- REF dla syntAudio ---
    const syntAudioRef = useRef(syntAudio);

    useEffect(() => {
        syntAudioRef.current = syntAudio;
    }, [syntAudio]);

    // -----------------------------------

    useEffect(() => {
        const handlePause = () => {
            if(playFlashcards) {
                handlePlayFlashcards();
            }
        }

        const pausePlayingFlashcards = window.cordova ? 'pause' : 'visibilitychange'

        document.addEventListener(pausePlayingFlashcards, handlePause);

        return () => {
            document.removeEventListener(pausePlayingFlashcards, handlePause);
        };
    }, [playFlashcards]);

    useEffect(() => {
        return () => {
            stopSpeaking();
            clearTimeout(autoPlayTimeoutRef.current);
        };
    }, []);

    const handleActiveSuperCategory = (index) => {
        setActiveSuperCategory(activeSuperCategory === index ? null : index);
    };

    /**
     * Funkcja importująca przykładowe fiszki i zapisująca
     * w localStorage (klucz: "categoryOrder") tablicę unikalnych:
     *   - `category` (tylko jeśli brak superCategory),
     *   - `superCategory` (bez powtórzeń).
     */
    const handleGenerateSampleFlashcards = async () => {
        try {
            const existingFlashcards = await getAllFlashcards();
            if (existingFlashcards.length === 0) {
                // Dodajemy fiszki z sampleData do bazy
                await addMultipleFlashcardsToDB(sampleData);

                // NOWY KOD: Zapisz "categoryOrder" do localStorage (bez powtórzeń)
                const categoryOrderSet = new Set();

                sampleData.forEach((item) => {
                    // Jeśli fiszka ma superCategory (i nie jest puste) => dodajemy do zbioru superCategory
                    if (item.superCategory && item.superCategory.trim() !== "") {
                        categoryOrderSet.add(item.superCategory);
                    }
                    // Jeśli fiszka NIE ma superCategory => dodajemy do zbioru "category" (lub 'Without category')
                    else {
                        const catValue = item.category && item.category.trim() !== ''
                            ? item.category
                            : 'Without category';
                        categoryOrderSet.add(catValue);
                    }
                });

                setLocalStorage('categoryOrder', Array.from(categoryOrderSet));

                if (loadData) {
                    await loadData();
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
            filtered = flashcards.filter(
                (fc) => fc.superCategory === selectedSuperCategory && fc.category === selectedCategory
            );
        } else if (selectedSuperCategory) {
            filtered = flashcards.filter((fc) => fc.superCategory === selectedSuperCategory);
        } else if (selectedCategory === 'All') {
            filtered = [...flashcards];
        } else if (selectedCategory === 'Without category') {
            filtered = flashcards.filter(
                (fc) => (!fc.category || fc.category.trim() === '') && !fc.superCategory
            );
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
        setDeck(shuffled);

        // Wyciągamy z potasowanej talii do twoCards
        if (shuffled.length >= 2) {
            const [first, second, ...rest] = shuffled;
            setTwoCards([first, second]);
            setDeck(rest);
        } else if (shuffled.length === 1) {
            setTwoCards([shuffled[0]]);
            setDeck([]);
        } else {
            setTwoCards([]);
            setDeck([]);
        }
    };

    useEffect(() => {
        if (selectedCategory !== null || selectedSuperCategory !== null) {
            applyFilterAndShuffle();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedCategory, selectedSuperCategory, learningFilter]);

    // Reset, gdy zmieniamy filtr/kategorię
    useEffect(() => {
        setCheckedCards(new Set());
        setReviewedSet(new Set());
    }, [learningFilter, selectedCategory, selectedSuperCategory]);

    // Stop speaking przy większych zmianach
    useEffect(() => {
        stopSpeaking();
    }, [
        selectedCategory,
        selectedSuperCategory,
        learningFilter,
        isShuffling,
        reversFrontBack,
        syntAudio
    ]);

    useEffect(() => {
        return () => {
            stopSpeaking();
        };
    }, []);

    /**
     * handleSpeak – pozwala przekazać callback onEnd
     */
    const handleSpeak = (text, lang, onEndCallback) => {
        stopSpeaking();
        speak(text, lang, onEndCallback);
    };

    /**
     * Promise-wrapping TTS z callbackiem onend.
     * Umożliwia nam zrobić ładne `await speakText(...)`.
     */
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

    /**
     * Mechanizm TTS przy normalnym (ręcznym) przerzucaniu kart,
     * ALE tylko, gdy tryb auto-play jest wyłączony (bo w auto-play mamy osobny flow).
     */
    const lastSpokenCardIdRef = useRef(null);
    useEffect(() => {
        if (!syntAudio) return;
        if (playFlashcards) return; // nie dublujemy odczytu w trybie auto-play

        if (twoCards.length > 0) {
            const topCard = twoCards[twoCards.length - 1];
            if (topCard.id !== lastSpokenCardIdRef.current) {
                stopSpeaking();
                lastSpokenCardIdRef.current = topCard.id;
                if (reversFrontBack) {
                    handleSpeak(topCard.back, topCard.langBack);
                } else {
                    handleSpeak(topCard.front, topCard.langFront);
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
        } else if (selectedCategory === 'Without category') {
            filtered = flashcards.filter(
                (fc) => (!fc.category || fc.category.trim() === '') && !fc.superCategory
            );
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

    const hasLearningCards = flashcards.some((fc) => {
        if (selectedCategory && selectedSuperCategory) {
            return (
                fc.superCategory === selectedSuperCategory &&
                fc.category === selectedCategory &&
                fc.know !== true
            );
        }
        if (selectedSuperCategory) {
            return fc.superCategory === selectedSuperCategory && fc.know !== true;
        }
        if (selectedCategory === 'All') {
            return fc.know !== true;
        }
        if (selectedCategory === 'Without category') {
            return (
                (!fc.category || fc.category.trim() === '') &&
                !fc.superCategory &&
                fc.know !== true
            );
        }
        if (selectedCategory) {
            const isSuperCategory = flashcards.some((f) => f.superCategory === selectedCategory);
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

        setReviewedSet((prev) => new Set(prev).add(id));
        setCheckedCards((prev) => {
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
        if (direction === 'lewo') {
            setAnimatingCards((prev) => ({ ...prev, [id]: 'animateLeft' }));
        } else if (direction === 'prawo') {
            setAnimatingCards((prev) => ({ ...prev, [id]: 'animateRight' }));
        }
        setCheckedCards((prev) => {
            const newSet = new Set(prev);
            newSet.delete(id);
            return newSet;
        });
    };

    const handleCheck = (id) => {
        setCheckedCards((prev) => new Set(prev).add(id));
        // Jeżeli auto-play jest wyłączony, to normalnie odczytujemy drugą stronę (jeśli syntAudio = true)
        if (syntAudioRef.current && !playFlashcards) {
            const card = twoCards.find((c) => c.id === id);
            if (card) {
                if (reversFrontBack) {
                    handleSpeak(card.front, card.langFront);
                } else {
                    handleSpeak(card.back, card.langBack);
                }
            }
        }
    };

    const variants = {
        animateLeft: {
            x: -650,
            rotate: -5,
            transition: {
                type: "tween",
                duration: 0.4,
                ease: "easeInOut",
            },
        },
        animateRight: {
            x: 650,
            rotate: 5,
            transition: {
                type: "tween",
                duration: 0.4,
                ease: "easeInOut",
            },
        },
        exit: {
            opacity: 0.999,
            transition: {
                duration: 0.4,
                ease: "easeInOut",
            },
        },
    };

    const containerVariants = {
        // initial: {
        //     x: 0,
        //     rotate: 0,
        // },
        // shuffling: {
        //     x: [-10, 10, -10, 10, -5, 5, 0],
        //     rotate: [-5, 5, -5, 5, -2.5, 2.5, 0],
        //     transition: {
        //         duration: 0.3,
        //         ease: "easeInOut",
        //     },
        // },
    };

    // Komunikat - koniec fiszek
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

    const CardFrontOrBack = ({ card, cardLang }) => {
        return (
            <div className="o-list-flashcards__text o-list-flashcards__front o-default-box">
                <p role="button" onClick={() => handleSpeak(card, cardLang)}>
                    <span className="o-list-flashcards__lang">
                        <span className="o-list-flashcards__lang-code">{cardLang}</span>
                        <i className="icon-volume"></i>
                    </span>
                    {card}
                </p>
            </div>
        );
    };

    // -----------------------------------------------------
    // Funkcje do budowania listy lekcji (Next Lesson)
    // -----------------------------------------------------
    const buildLessonsList = () => {
        // 1. Zbiór kategorii bez superkategorii:
        const baseCategories = categories.filter(
            (cat) => cat !== 'Without category' && cat !== 'All'
        );

        // 2. Zbudujmy listę obiektów {superCategory: null, category: cat}:
        let mainLessons = baseCategories.map((cat) => ({
            superCategory: null,
            category: cat,
        }));

        // Dodaj "Without category", jeśli jest
        if (categories.includes('Without category')) {
            mainLessons.push({
                superCategory: null,
                category: 'Without category',
            });
        }

        // 3. Szukamy wszystkich superCategory w flashcards
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

        // 4. Połączmy subLessons z mainLessons
        let finalList = [
            {
                superCategory: null,
                category: 'All',
            },
        ];
        finalList = finalList.concat(mainLessons);
        finalList = finalList.concat(subLessons);

        // Sort wg newOrders (jeśli istnieje)
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

        // Zaczynamy od "następnej" lekcji
        let nextIndex = currentIndex + 1;

        // Dopóki mamy lekcje w lessonsList...
        while (nextIndex < lessonsList.length) {
            const nextLesson = lessonsList[nextIndex];
            console.log('nextLesson:', nextLesson);

            // Sprawdzamy w bazie, czy nextLesson.category występuje jako superCategory
            const isSubcategoryInDB = flashcards.some(
                (fc) => fc.superCategory === nextLesson.category
            );

            // Jeżeli tak, to znaczy, że w rzeczywistości jest to subkategoria
            // - pomijamy tę lekcję i idziemy do kolejnej
            if (isSubcategoryInDB) {
                nextIndex++;
                continue;
            }

            // Jeśli nie jest subkategorią, ustawiamy stan i wychodzimy z funkcji
            setSelectedCategory(nextLesson.category);
            setSelectedSuperCategory(
                nextLesson.superCategory && nextLesson.superCategory.trim() !== ''
                    ? nextLesson.superCategory
                    : null
            );
            setLearningFilter('all');
            setCheckedCards(new Set());
            setReviewedSet(new Set());
            setDeck([]);
            setTwoCards([]);
            return; // Wracamy, bo znaleźliśmy właściwą "następną" lekcję
        }

        // Jeśli pętla się skończyła, znaczy, że nie znaleźliśmy lekcji bez superCategory
        alert(t('missing_next_lesson_in_sequence'));
    };

    // -----------------------------------------------------
    // QuickEdit (edycja fiszki w modalu)
    // -----------------------------------------------------
    const handleOpenQuickEdit = (card) => {
        setCheckedCards((prev) => new Set(prev).add(card.id));
        setQuickEdit((prev) => ({
            ...prev,
            [card.id]: {
                isEditing: true,
                front: card.front,
                back: card.back,
            },
        }));
    };

    const handleCloseQuickEdit = (cardId) => {
        setQuickEdit((prev) => {
            const newState = { ...prev };
            delete newState[cardId];
            return newState;
        });
    };

    const handleQuickEditChange = (cardId, field, value) => {
        setQuickEdit((prev) => {
            const newState = { ...prev };
            if (!newState[cardId]) {
                newState[cardId] = { isEditing: true, front: '', back: '' };
            }
            newState[cardId][field] = value;
            return newState;
        });
    };

    const handleSaveQuickEdit = async (card) => {
        const { front, back } = quickEdit[card.id];
        try {
            await editFlashcardInDB(
                card.id,
                front,
                back,
                card.category,
                card.know,
                card.langFront,
                card.langBack,
                card.superCategory
            );

            if (loadData) {
                await loadData();
            }

            setTwoCards((prevTwoCards) =>
                prevTwoCards.map((c) => (c.id === card.id ? { ...c, front, back } : c))
            );
            setDeck((prevDeck) =>
                prevDeck.map((c) => (c.id === card.id ? { ...c, front, back } : c))
            );

            handleCloseQuickEdit(card.id);
        } catch (error) {
            console.error('Błąd przy zapisie karty:', error);
        }
    };

    // -----------------------------------------------------
    // AUTO-PLAY: funkcjonalność automatycznego przeglądu
    // -----------------------------------------------------
    const handlePlayFlashcards = () => {
        setPlayFlashcards((prevValue) => {
            const nextValue = !prevValue;
            if (nextValue) {
                // Uruchamiamy autoplay
                isAutoPlayCancelledRef.current = false;
                autoPlayRunningRef.current = true;
                startAutoPlay();
                if (window.plugins && window.plugins.insomnia) {
                    window.plugins.insomnia.keepAwake();
                }
            } else {
                // Pauzujemy autoplay
                isAutoPlayCancelledRef.current = true;
                autoPlayRunningRef.current = false;
                clearTimeout(autoPlayTimeoutRef.current);
                stopSpeaking();
                clearInsomnia();
            }
            return nextValue;
        });
    };

    const startAutoPlay = async () => {
        if (!autoPlayRunningRef.current) return;

        const processNext = async () => {
            if (isAutoPlayCancelledRef.current || !autoPlayRunningRef.current) {
                console.log('Auto-play zatrzymany.');
                return;
            }

            if (twoCardsRef.current.length === 0) {
                console.log('Brak kart do przetworzenia.');
                setPlayFlashcards(false);
                return;
            }

            const currentCard = twoCardsRef.current[twoCardsRef.current.length - 1];

            console.log("Przetwarzanie karty:", currentCard);
            currentCardRef.current = currentCard.id;
            console.log(`Przetwarzanie karty: ${currentCard.id}`);

            try {
                // 1) Odczyt pierwszej strony (front/back - zależy od rewers)
                const firstSideText = reversFrontBack ? currentCard.back : currentCard.front;
                const firstSideLang = reversFrontBack ? currentCard.langBack : currentCard.langFront;

                if (syntAudioRef.current) {
                    console.log(`Odczyt pierwszej strony karty: ${currentCard.id}`);
                    await speakText(firstSideText, firstSideLang);
                    if (isAutoPlayCancelledRef.current) return;
                }

                // **Dodanie opóźnienia 1 sekundy przed odsłonięciem drugiej strony**
                console.log(`Czekanie 1 sekundy przed odsłonięciem drugiej strony karty: ${currentCard.id}`);
                await new Promise((resolve) => {
                    autoPlayTimeoutRef.current = setTimeout(resolve, 1000);
                });
                if (isAutoPlayCancelledRef.current) return;

                // 2) Symulujemy kliknięcie "Check" -> pokazuje drugą stronę
                setCheckedCards((prev) => new Set(prev).add(currentCard.id));
                console.log(`Sprawdzenie karty: ${currentCard.id}`);

                // 3) Odczyt drugiej strony
                if (syntAudioRef.current) {
                    const secondSideText = reversFrontBack ? currentCard.front : currentCard.back;
                    const secondSideLang = reversFrontBack ? currentCard.langFront : currentCard.langBack;
                    console.log(`Odczyt drugiej strony karty: ${currentCard.id}`);
                    await speakText(secondSideText, secondSideLang);
                    if (isAutoPlayCancelledRef.current) return;
                }

                // 4) Czekamy 1 sekundę (możesz dostosować czas jeśli potrzebujesz)
                console.log(`Czekanie 1 sekundy na kartę: ${currentCard.id}`);
                await new Promise((resolve) => {
                    autoPlayTimeoutRef.current = setTimeout(resolve, 1000);
                    console.log("Waiting 1 second");
                });
                if (isAutoPlayCancelledRef.current) return;

                // 5) Automatyczny "still learning" lub "got it" – zależy czy card.know jest true
                if (currentCard.know === true) {
                    console.log(`Automatyczne oznaczenie "Got it" dla karty: ${currentCard.id}`);
                    setAnimatingCards((prev) => ({ ...prev, [currentCard.id]: 'animateRight' }));  // "Got it"
                } else {
                    console.log(`Automatyczne oznaczenie "Still learning" dla karty: ${currentCard.id}`);
                    setAnimatingCards((prev) => ({ ...prev, [currentCard.id]: 'animateLeft' }));   // "Still learning"
                }

                // 6) Czekamy na zakończenie animacji
                console.log(`Czekanie na zakończenie animacji dla karty: ${currentCard.id}`);
                await new Promise((resolve) => {
                    autoPlayTimeoutRef.current = setTimeout(resolve, 900);
                });
                if (isAutoPlayCancelledRef.current) return;

                // 7) Usuwamy kartę i przechodzimy do następnej
                console.log(`Usuwanie karty: ${currentCard.id}`);
                if (currentCard.know === true) {
                    knowIt(currentCard.id);
                } else {
                    learnIt(currentCard.id);
                }

                // 8) Kontynuujemy auto-play po krótkim opóźnieniu, aby pozwolić React na aktualizację stanu
                setTimeout(() => {
                    processNext();
                    console.log("Przechodzenie do następnej karty...");
                }, 600);
            } catch (error) {
                console.error('Błąd w auto-play:', error);
            }
        };

        processNext();
    };

    const handleMainHomePageLoad = () => {
        setSelectedCategory(null);
        setSelectedSuperCategory(null);
        setLearningFilter(null);
        setCheckedCards(new Set());
        setReviewedSet(new Set());
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
            <div className="o-page-view-flashcards__header">
                {(selectedCategory !== null || selectedSuperCategory !== null) &&
                getFilteredFlashcardCount('all') > 0 ? (
                    <>
                        <h2
                            className={`o-page-view-flashcards__title ${
                                whiteSpaceNowrap ? 'white-space-nowrap' : ''
                            }`}
                        >
                            <span
                                type="button"
                                className="o-page-view-flashcards__title-categories"
                                onClick={handleMainHomePageLoad}
                            >
                                {t('categories')}
                            </span>
                            {' / '}
                            <span
                                onClick={() => setWhiteSpaceNowrap((prev) => !prev)}
                            >
                                {selectedSuperCategory ? `${selectedSuperCategory} / ` : ''}
                                {selectedCategory === 'All'
                                    ? t('all')
                                    : selectedCategory === 'Without category'
                                        ? t('without_category')
                                        : selectedCategory}

                                {' ('}
                                {selectedSuperCategory !== null
                                    ? flashcards.filter(
                                        (fc) =>
                                            fc.superCategory === selectedSuperCategory &&
                                            fc.category === selectedCategory
                                    ).length
                                    : selectedCategory === 'All'
                                        ? flashcards.length
                                        : selectedCategory === 'Without category'
                                            ? flashcards.filter(
                                                (fc) =>
                                                    (!fc.category || fc.category.trim() === '') &&
                                                    !fc.superCategory
                                            ).length
                                            : flashcards.filter(
                                                (fc) => fc.category === selectedCategory && !fc.superCategory
                                            ).length}
                                {')'}
                            </span>
                        </h2>
                        <hr />
                        <ul className="o-page-view-flashcards__tools o-list-buttons-clear o-list-buttons-clear--nowrap o-default-box">
                            {getFilteredFlashcardCount('learningOnly') <
                                getFilteredFlashcardCount('all') && (
                                    <li>
                                        <button
                                            className={`btn ${
                                                learningFilter === 'all' ? 'btn--active' : ''
                                            }`}
                                            onClick={() => {
                                                setLearningFilter('all');
                                                setCheckedCards(new Set());
                                                setReviewedSet(new Set());
                                                applyFilterAndShuffle();
                                            }}
                                            disabled={playFlashcards ? 'disabled' : '' }
                                        >
                                            {t('review')}{' '}
                                            <sup>
                                                {learningFilter === 'all'
                                                    ? deck.length + twoCards.length
                                                    : getFilteredFlashcardCount('all')}
                                            </sup>
                                        </button>
                                    </li>
                                )}
                            {hasLearningCards && (
                                <li>
                                    <button
                                        className={`btn ${
                                            learningFilter === 'learningOnly' ? 'btn--active' : ''
                                        }`}
                                        onClick={() => {
                                            setLearningFilter('learningOnly');
                                            setCheckedCards(new Set());
                                            setReviewedSet(new Set());
                                            applyFilterAndShuffle();
                                        }}
                                        disabled={playFlashcards ? 'disabled' : '' }
                                    >
                                        {t('study')}{' '}
                                        <sub>{getFilteredFlashcardCount('learningOnly')}{!(learningFilter === 'all') ? `/${deck.length + twoCards.length}` : ''}</sub>
                                        <sup>
                                            {Math.ceil(
                                                ((getFilteredFlashcardCount('all') -
                                                        getFilteredFlashcardCount('learningOnly')) *
                                                    100) /
                                                getFilteredFlashcardCount('all')
                                            )}
                                            %
                                        </sup>
                                    </button>
                                </li>
                            )}
                            {!(learningFilter && twoCards.length === 0 && deck.length === 0) && (
                                <>
                                    <li className="flex-none">
                                        <button
                                            className={`o-list-buttons-clear__single-icon ${playFlashcards ? 'btn--active' : ''}`}
                                            aria-label="Play/Pause"
                                            onClick={handlePlayFlashcards}
                                        >
                                            <i className={playFlashcards ? 'icon-pause' : 'icon-play'}></i>
                                        </button>
                                    </li>
                                    <li className="flex-none">
                                        <button
                                            aria-label="Revers"
                                            className={`btn-revers o-list-buttons-clear__single-icon ${
                                                reversFrontBack ? 'btn-revers--active btn--active' : ''
                                            }`}
                                            onClick={reversCards}
                                            disabled={playFlashcards ? 'disabled' : ''}
                                        >
                                            <i className="icon-switch"></i>
                                            <sup>{reversFrontBack ? 'On' : 'Off'}</sup>
                                        </button>
                                    </li>
                                    {/*<li className="o-list-buttons-clear__single-icon o-list-buttons-clear__single-icon--restart">*/}
                                    {/*    <button*/}
                                    {/*        aria-label="Restart / Tasowanie"*/}
                                    {/*        onClick={handleShuffle}*/}
                                    {/*        disabled={isShuffling || playFlashcards}*/}
                                    {/*    >*/}
                                    {/*        <i className="icon-spin4"></i>*/}
                                    {/*    </button>*/}
                                    {/*</li>*/}
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
                        <li>
                            <button onClick={handleNextLesson}>{t('next_lesson')}</button>
                        </li>
                    </ul>
                </div>
            )}

            {selectedCategory !== null || selectedSuperCategory !== null ? (
                learningFilter && (
                    twoCards.length === 0 && deck.length === 0 && learningFilter === "learningOnly" ? (
                        <>
                            {getFilteredFlashcardCount('learningOnly') > 0 ? (
                                <>
                                    <p>
                                        {t('in_this_category_you_still_have_flashcards_to_learn')} (
                                        {getFilteredFlashcardCount('learningOnly')})
                                    </p>
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
                                    </ul>
                                </>
                            ) : (
                                <>
                                    <p>{t('congratulations_text')}</p>
                                </>
                            )}
                            <p>
                                <button onClick={handleNextLesson}>{t('next_lesson')}</button>
                            </p>
                        </>
                    ) : (
                        <div onClick={() => {
                            playFlashcards ? handlePlayFlashcards() : false;
                        }} className={`o-page-view-flashcards__content ${playFlashcards ? 'pointer-events-none' : ''}`}>
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
                                                            : 0,
                                            }}
                                            onDrag={(event, info) => {
                                                const { offset } = info;
                                                const threshold = 20;
                                                if (Math.abs(offset.x) > threshold) {
                                                    const direction = offset.x > 0 ? 'prawo' : 'lewo';
                                                    setDraggingDirection((prev) => ({
                                                        ...prev,
                                                        [card.id]: direction,
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

                                                setDraggingDirection((prev) => {
                                                    const newDrag = { ...prev };
                                                    delete newDrag[card.id];
                                                    return newDrag;
                                                });
                                            }}
                                            variants={variants}
                                            animate={animatingCards[card.id]}
                                            exit="exit"
                                            onAnimationComplete={() => {
                                                if (animatingCards[card.id] === 'animateLeft') {
                                                    learnIt(card.id);
                                                } else if (animatingCards[card.id] === 'animateRight') {
                                                    knowIt(card.id);
                                                }

                                                setAnimatingCards((prev) => {
                                                    const newAnim = { ...prev };
                                                    delete newAnim[card.id];
                                                    return newAnim;
                                                });
                                                setDraggingDirection((prev) => {
                                                    const newDrag = { ...prev };
                                                    delete newDrag[card.id];
                                                    return newDrag;
                                                });
                                            }}
                                            style={{
                                                cursor: 'grab',
                                                listStyle: 'none',
                                                zIndex: animatingCards[card.id] ? 2 : 1,
                                            }}
                                        >
                                            <div
                                                className={`o-list-flashcards__swipe-info-know-or-learn ${
                                                    card.know ? 'bg-color-green' : 'bg-color-red'
                                                }`}
                                            ></div>

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
                                            {checkedCards.has(card.id) &&
                                                (reversFrontBack ? (
                                                    <CardFrontOrBack
                                                        card={card.front}
                                                        cardLang={card.langFront}
                                                    />
                                                ) : (
                                                    <CardFrontOrBack
                                                        card={card.back}
                                                        cardLang={card.langBack}
                                                    />
                                                ))}
                                            <div className="o-list-flashcards__know">
                                                <div
                                                    className={`o-list-flashcards__swipe-info-know ${
                                                        draggingDirection[card.id] === 'prawo'
                                                            ? 'o-list-flashcards__swipe-info-know--visible'
                                                            : ''
                                                    }`}
                                                >
                                                    <p>
                                                        <i className="icon-ok"></i> {t('got_it')}
                                                    </p>
                                                </div>
                                                <div
                                                    className={`o-list-flashcards__swipe-info-learn ${
                                                        draggingDirection[card.id] === 'lewo'
                                                            ? 'o-list-flashcards__swipe-info-learn--visible'
                                                            : ''
                                                    }`}
                                                >
                                                    <p>
                                                        <i className="icon-graduation-cap"></i> {t('still_learning')}
                                                    </p>
                                                </div>

                                                {!playFlashcards ?
                                                    <ul className="o-list-buttons-clear position-relative">
                                                        <li className="o-button-single-edit">
                                                            <button
                                                                onClick={() => {
                                                                    handleOpenQuickEdit(card);
                                                                    setOpenCardId(card.id);
                                                                    setOpenCard(card);
                                                                }}
                                                                className="btn--single-edit"
                                                            >
                                                                <i className="icon-pencil"></i>
                                                                <span>{t('edit')}</span>
                                                            </button>
                                                        </li>
                                                        {!checkedCards.has(card.id) ? (
                                                            <li className="o-button-single-check">
                                                                <button
                                                                    className="o-list-flashcards__know-check btn--blue"
                                                                    onClick={() => {
                                                                        handleCheck(card.id);
                                                                    }}
                                                                >
                                                                    {t('check')}
                                                                </button>
                                                            </li>
                                                        ) : (
                                                            <>
                                                                <li>
                                                                    <button
                                                                        className="btn--red"
                                                                        onClick={() => {
                                                                            setDraggingDirection((prev) => ({
                                                                                ...prev,
                                                                                [card.id]: 'lewo',
                                                                            }));
                                                                            setAnimatingCards((prev) => ({
                                                                                ...prev,
                                                                                [card.id]: 'animateLeft',
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
                                                                            setDraggingDirection((prev) => ({
                                                                                ...prev,
                                                                                [card.id]: 'prawo',
                                                                            }));
                                                                            setAnimatingCards((prev) => ({
                                                                                ...prev,
                                                                                [card.id]: 'animateRight',
                                                                            }));
                                                                        }}
                                                                    >
                                                                        {t('got_it')}
                                                                    </button>
                                                                </li>
                                                            </>
                                                        )}
                                                    </ul>
                                                    : <div className="o-card-lock"><i className="icon-lock-2"></i></div>}
                                            </div>
                                        </motion.li>
                                    ))}
                                </AnimatePresence>
                            </motion.ul>

                            {/* Modal Quick Edit (jeśli isEditing = true) */}
                            {quickEdit[openCardId]?.isEditing && (
                                <div className="o-modal">
                                    <div
                                        className="o-modal__bg-cancel"
                                        onClick={() => handleCloseQuickEdit(openCardId)}
                                        type="button"
                                        aria-label={t('cancel')}
                                    />
                                    <div className="o-modal__container">
                                        <p className={reversFrontBack ? 'order-2' : 'order-1'}>
                                            <label
                                                className="color-white"
                                                htmlFor={`front-${openCardId}`}
                                            >
                                                {t('front')}:
                                            </label>
                                            <textarea
                                                id={`front-${openCardId}`}
                                                value={quickEdit[openCardId].front}
                                                onChange={(e) => handleQuickEditChange(openCardId, 'front', e.target.value)}
                                            />
                                        </p>
                                        <p className={reversFrontBack ? 'order-1' : 'order-2'}>
                                            <label
                                                className="color-white"
                                                htmlFor={`back-${openCardId}`}
                                            >
                                                {t('back')}:
                                            </label>
                                            <textarea
                                                id={`back-${openCardId}`}
                                                value={quickEdit[openCardId].back}
                                                onChange={(e) =>
                                                    handleQuickEditChange(openCardId, 'back', e.target.value)
                                                }
                                            />
                                        </p>
                                        <ul className="o-list-buttons-clear o-list-buttons-clear--nowrap order-3">
                                            <li>
                                                <button
                                                    onClick={() => handleSaveQuickEdit(openCard)}
                                                    disabled={
                                                        !quickEdit[openCardId].front.trim() ||
                                                        !quickEdit[openCardId].back.trim()
                                                    }
                                                >
                                                    <i className="icon-floppy-1"></i> {t('save')}
                                                </button>
                                            </li>
                                            <li>
                                                <button
                                                    onClick={() => handleCloseQuickEdit(openCardId)}
                                                >
                                                    <i className="icon-cancel-circled"></i> {t('cancel')}
                                                </button>
                                            </li>
                                        </ul>
                                    </div>
                                </div>
                            )}
                        </div>
                    )
                )
            ) : null}

            {selectedCategory === null && selectedSuperCategory === null ? (
                <>
                    {flashcards.length > 0 ? (
                        <ul className="o-list-categories">
                            <li className="order-0">
                                <button
                                    className={`btn btn--dark-black-opacity ${
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
                                    <span>
                                        {(() => {
                                            const knowCount = flashcards.filter(fc => fc.know).length;
                                            const count = flashcards.length;
                                            const unknownCount = count - knowCount;
                                            const knowPercentage = count > 0 ? Math.ceil((knowCount * 100) / count) : 0;
                                            return (
                                                <>
                                                    <i className="icon-play-outline"></i> {t('all')} (<strong>{knowCount}</strong>/{count})

                                                    {unknownCount > 0 ? (
                                                        <>
                                                            <sub className="bg-color-green">
                                                                {knowPercentage}%
                                                            </sub>
                                                            <sup className="bg-color-red">
                                                                {unknownCount}
                                                            </sup>
                                                        </>
                                                    ) : (
                                                        <sub
                                                            className="o-category-complited bg-color-green vertical-center-count">
                                                            <i className="icon-ok"></i>
                                                        </sub>
                                                    )}
                                                </>
                                            );
                                        })()}
                                    </span>
                                </button>
                            </li>
                            {categories.map((cat, index) => {
                                let count;
                                let knowCount;
                                if (cat === 'Without category') {
                                    count = flashcards.filter(
                                        (fc) =>
                                            (!fc.category || fc.category.trim() === '') &&
                                            !fc.superCategory
                                    ).length;
                                    knowCount = flashcards.filter(
                                        (fc) =>
                                            (!fc.category || fc.category.trim() === '') &&
                                            !fc.superCategory &&
                                            fc.know
                                    ).length;
                                } else {
                                    count = flashcards.filter(
                                        (fc) => fc.category === cat && !fc.superCategory
                                    ).length;
                                    knowCount = flashcards.filter(
                                        (fc) => fc.category === cat && fc.know && !fc.superCategory
                                    ).length;
                                }

                                const hasSubcategories = flashcards.some(
                                    (fc) => fc.superCategory === cat
                                );

                                return (
                                    <li key={cat} style={{order: (newOrders?.indexOf(cat) ?? 0) + 1}}>
                                        {hasSubcategories ? (
                                            <>
                                                <button
                                                    onClick={() => {
                                                        handleActiveSuperCategory(index);
                                                    }}
                                                    className={`bg-color-brow btn-super-category ${
                                                        activeSuperCategory === index
                                                            ? 'btn-super-category--active'
                                                            : ''
                                                    }`}
                                                >
                                                    <i
                                                        className={
                                                            activeSuperCategory === index
                                                                ? 'icon-folder-open-empty'
                                                                : 'icon-folder-empty'
                                                        }
                                                    ></i>{' '}
                                                    {cat}
                                                </button>
                                                {activeSuperCategory === index && (
                                                    <ul className="o-list-categories">
                                                        {[...new Set(
                                                            flashcards
                                                                .filter((fc) => fc.superCategory === cat)
                                                                .map((fc) => fc.category)
                                                        )].map((subcat) => {
                                                            const subcatCount = flashcards.filter(
                                                                (fc) =>
                                                                    fc.category === subcat &&
                                                                    fc.superCategory === cat
                                                            ).length;
                                                            const knowSubcatCount = flashcards.filter(
                                                                (fc) =>
                                                                    fc.category === subcat &&
                                                                    fc.superCategory === cat &&
                                                                    fc.know
                                                            ).length;
                                                            return (
                                                                <li key={subcat}>
                                                                    <button
                                                                        className={`btn bg-color-cream color-green-strong-dark ${
                                                                            selectedCategory === subcat &&
                                                                            learningFilter === 'all'
                                                                                ? 'btn--active'
                                                                                : ''
                                                                        }`}
                                                                        onClick={() => {
                                                                            setSelectedCategory(subcat);
                                                                            setSelectedSuperCategory(cat);
                                                                            setLearningFilter('all');
                                                                            setCheckedCards(new Set());
                                                                            setReviewedSet(new Set());
                                                                            setDeck([]);
                                                                            setTwoCards([]);
                                                                            applyFilterAndShuffle();
                                                                        }}
                                                                    >
                                                                        <span>
                                                                            <i className="icon-play-outline"></i>{' '}
                                                                            {subcat === 'Without category' ||
                                                                            subcat === ''
                                                                                ? t('without_category')
                                                                                : subcat}{' '}
                                                                            (<strong className="color-green-dark">{knowSubcatCount}</strong>/{subcatCount})
                                                                            {subcatCount - knowSubcatCount > 0 ? (
                                                                                <>
                                                                                    <sub className="bg-color-green">
                                                                                        {Math.ceil(
                                                                                            (knowSubcatCount * 100) /
                                                                                            subcatCount
                                                                                        )}
                                                                                        %
                                                                                    </sub>
                                                                                    <sup className="bg-color-red">
                                                                                        {subcatCount - knowSubcatCount}
                                                                                    </sup>
                                                                                </>
                                                                            ) : (
                                                                                <sub
                                                                                    className="o-category-complited bg-color-green vertical-center-count">
                                                                                    <i className="icon-ok"></i>
                                                                                </sub>
                                                                            )}
                                                                        </span>
                                                                    </button>
                                                                </li>
                                                            );
                                                        })}
                                                    </ul>
                                                )}
                                            </>
                                        ) : (
                                            count > 0 && (
                                                <>
                                                    <button
                                                        className={`btn ${
                                                            selectedCategory === cat &&
                                                            learningFilter === 'all'
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
                                                        <span>
                                                            <i className="icon-play-outline"></i>
                                                            {cat === 'Without category'
                                                                ? t('without_category')
                                                                : cat}{' '}
                                                            (<strong className="color-green-dark">{knowCount}</strong>/{count})
                                                            {count - knowCount > 0 ? (
                                                                <>
                                                                    <sub className="bg-color-green">
                                                                        {Math.ceil((knowCount * 100) / count)}%
                                                                    </sub>
                                                                    <sup className="bg-color-red">
                                                                        {count - knowCount}
                                                                    </sup>
                                                                </>
                                                            ) : (
                                                                <sub
                                                                    className="o-category-complited bg-color-green vertical-center-count">
                                                                    <i className="icon-ok"></i>
                                                                </sub>
                                                            )}
                                                        </span>
                                                    </button>
                                                </>
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
                                    <button
                                        className="btn--green"
                                        onClick={handleGenerateSampleFlashcards}
                                    >
                                        {t('generate_sample_flashcards')}
                                    </button>
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

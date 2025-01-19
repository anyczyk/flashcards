// FlashCards.jsx
import React, {useEffect, useRef, useState, useCallback, useMemo} from "react";
import { AnimatePresence, motion, useAnimation } from "framer-motion";
import { useTranslation } from 'react-i18next';
import { editFlashcardInDB } from "../../../db";
import useWcagModal from "../../../hooks/useWcagModal";
import { showInterstitial } from '../../../services/admobService';

const FlashCards = ({
                        syntAudioRef,
                        handlePlayFlashcards,
                        selectedCategory,
                        selectedSuperCategory,
                        learningFilter,
                        twoCards,
                        deck,
                        getFilteredFlashcardCount,
                        setLearningFilter,
                        setCheckedCards,
                        applyFilterAndShuffle,
                        handleNextLesson,
                        playFlashcards,
                        animatingCards,
                        learnIt,
                        knowIt,
                        setAnimatingCards,
                        reversFrontBack,
                        handleSpeak,
                        checkedCards,
                        loadData,
                        setTwoCards,
                        setDeck
                    }) => {
    const { t } = useTranslation();
    const [draggingDirection, setDraggingDirection] = useState({});
    const [openCardId, setOpenCardId] = useState(null);
    const [openCard, setOpenCard] = useState(null);
    const [quickEdit, setQuickEdit] = useState({});
    const modalRef = useRef(null);
    const controls = useAnimation();

    useWcagModal(quickEdit, setQuickEdit, modalRef);

    useEffect(() => {
        const handlePause = () => {
            if (playFlashcards) {
                handlePlayFlashcards();
            }
        };

        const pausePlayingFlashcards = window.cordova ? 'pause' : 'visibilitychange';

        document.addEventListener(pausePlayingFlashcards, handlePause);

        return () => {
            document.removeEventListener(pausePlayingFlashcards, handlePause);
        };
    }, [playFlashcards, handlePlayFlashcards]);

    const handleOpenQuickEdit = useCallback((card) => {
        setCheckedCards(prev => new Set(prev).add(card.id));
        setQuickEdit(prev => ({
            ...prev,
            [card.id]: {
                isEditing: true,
                front: card.front,
                back: card.back,
                frontDesc: card.frontDesc,
                backDesc: card.backDesc,
            },
        }));
        setOpenCardId(card.id);
        setOpenCard(card);
    }, [setCheckedCards]);

    const handleCloseQuickEdit = useCallback((cardId) => {
        setQuickEdit(prev => {
            const newState = { ...prev };
            delete newState[cardId];
            return newState;
        });
        setOpenCardId(null);
        setOpenCard(null);
    }, []);

    const handleQuickEditChange = useCallback((cardId, field, value) => {
        setQuickEdit(prev => ({
            ...prev,
            [cardId]: {
                ...prev[cardId],
                [field]: value,
            },
        }));
    }, []);

    const handleSaveQuickEdit = useCallback(async (card) => {
        const { front, back, frontDesc, backDesc } = quickEdit[card.id];
        try {
            await editFlashcardInDB(
                card.id,
                front,
                back,
                card.category,
                card.know,
                card.langFront,
                card.langBack,
                card.superCategory,
                frontDesc,
                backDesc
            );

            if (loadData) {
                await loadData();
            }

            setTwoCards(prevTwoCards =>
                prevTwoCards.map(c => (c.id === card.id ? { ...c, front, back, frontDesc, backDesc } : c))
            );
            setDeck(prevDeck =>
                prevDeck.map(c => (c.id === card.id ? { ...c, front, back, frontDesc, backDesc } : c))
            );

            handleCloseQuickEdit(card.id);
        } catch (error) {
            console.error('Error:', error);
        }
    }, [quickEdit, loadData, setTwoCards, setDeck, handleCloseQuickEdit]);

    const handleCheck = useCallback((id) => {
        setCheckedCards(prev => new Set(prev).add(id));
        if (syntAudioRef.current && !playFlashcards) {
            const card = twoCards.find(c => c.id === id);
            if (card) {
                if (reversFrontBack) {
                    handleSpeak(card.front, card.langFront);
                } else {
                    handleSpeak(card.back, card.langBack);
                }
            }
        }
    }, [syntAudioRef, playFlashcards, twoCards, reversFrontBack, handleSpeak, setCheckedCards]);

    const handleSwipe = useCallback((id, direction) => {
        if (direction === 'lewo') {
            setAnimatingCards(prev => ({ ...prev, [id]: 'animateLeft' }));
        } else if (direction === 'prawo') {
            setAnimatingCards(prev => ({ ...prev, [id]: 'animateRight' }));
        }
    }, [setAnimatingCards]);

    const variants = useMemo(() => ({
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
                type: "tween",
                duration: 0.4,
                ease: "easeInOut",
            },
        },
    }), []);

    const filteredFlashcardCount = useMemo(() => getFilteredFlashcardCount('learningOnly'), [getFilteredFlashcardCount]);


    const CardFrontOrBack = useCallback(({ card, cardLang }) => {
        return (
            <div className="o-list-flashcards__text o-list-flashcards__front o-default-box">
                <p
                    role="button"
                    onClick={() => handleSpeak(card, cardLang)}
                >
                <span className="o-list-flashcards__lang">
                    <span className="o-list-flashcards__lang-code">{cardLang}</span>
                    <i className="icon-volume" />
                </span>
                    {card}
                </p>
            </div>
        );
    }, [handleSpeak]);

    const CardFrontDescOrBackDesc = useCallback(({ card, cardLang }) => {
        return (
            card && <p
                role="button"
                onClick={() => handleSpeak(card, cardLang)}
            >
                <span className="o-list-flashcards__lang">
                    <span className="o-list-flashcards__lang-code">{cardLang}</span>
                    <i className="icon-volume"/>
                </span>
                {card}
            </p>
        );
    }, [handleSpeak]);


    return ((selectedCategory !== null || selectedSuperCategory !== null) && learningFilter ? (
            twoCards.length === 0 && deck.length === 0 && learningFilter === "learningOnly" ?
                <>
                    {filteredFlashcardCount > 0 ? (
                        <>
                            <p>
                            {t('in_this_category_you_still_have_flashcards_to_learn')} (
                                {filteredFlashcardCount})
                            </p>
                            <ul className="o-list-buttons-clear">
                                <li className="w-100">
                                    <button
                                        className="btn--red w-100"
                                        onClick={() => {
                                            setLearningFilter('learningOnly');
                                            setCheckedCards(new Set());
                                            applyFilterAndShuffle();
                                            showInterstitial();
                                        }}
                                    >
                                        {t('repeat_the_lesson_once_again')}
                                    </button>
                                </li>
                            </ul>
                        </>
                    ) : (
                        <p>{t('congratulations_text')}</p>
                    )}
                    <p>
                        <button className="btn--green w-100" onClick={()=>{
                            showInterstitial();
                            handleNextLesson();
                        }}>{t('next_lesson')}</button>
                    </p>
                </> : <div
                    onClick={() => {
                        if (playFlashcards) {
                            handlePlayFlashcards();
                        }
                    }}
                    className={`o-page-view-flashcards__content ${playFlashcards ? 'pointer-events-none' : ''}`}
                >
                    <motion.ul
                        className="o-list-flashcards"
                        initial="initial"
                        animate={controls}
                    >
                        <AnimatePresence>
                            {twoCards.map(card => {
                                const cardText = reversFrontBack ? card.back : card.front;
                                const cardLang = reversFrontBack ? card.langBack : card.langFront;
                                const cardTextDesc = reversFrontBack ? card.backDesc : card.frontDesc;

                                return (
                                    <motion.li
                                        className="o-list-flashcards__single-card"
                                        key={card.id}
                                        drag="x"
                                        dragConstraints={{ left: 0, right: 0 }}
                                        dragElastic={1}
                                        whileDrag={{
                                            scale: 1.03,
                                            rotate:
                                                draggingDirection[card.id] === 'prawo'
                                                    ? 5
                                                    : draggingDirection[card.id] === 'lewo'
                                                        ? -5
                                                        : 0,
                                        }}
                                        onDrag={(event, info) => {
                                            const { offset } = info;
                                            const threshold = 0;
                                            if (Math.abs(offset.x) > threshold) {
                                                const direction = offset.x > 0 ? 'prawo' : 'lewo';
                                                setDraggingDirection(prev => ({
                                                    ...prev,
                                                    [card.id]: direction,
                                                }));
                                            }
                                        }}
                                        onDragEnd={(event, info) => {
                                            const threshold = 50;
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
                                            if (animatingCards[card.id] === 'animateLeft') {
                                                learnIt(card.id);
                                            } else if (animatingCards[card.id] === 'animateRight') {
                                                knowIt(card.id);
                                            }

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
                                            zIndex: animatingCards[card.id] ? 2 : 1,
                                        }}
                                    >
                                        <div
                                            className={`o-list-flashcards__swipe-info-know-or-learn ${
                                                card.know ? 'bg-color-green' : 'bg-color-red'
                                            }`}
                                        ></div>

                                        <CardFrontOrBack
                                            card={cardText}
                                            cardLang={cardLang}
                                        />
                                        <hr />
                                        {checkedCards.has(card.id) ? (
                                            reversFrontBack ? (
                                                <CardFrontOrBack
                                                    card={card.front}
                                                    cardLang={card.langFront}
                                                />
                                            ) : (
                                                <CardFrontOrBack
                                                    card={card.back}
                                                    cardLang={card.langBack}
                                                />
                                            )
                                        ) : <p className="o-list-flashcards__lang o-list-flashcards__lang-code text-center">
                                            {reversFrontBack ? card.langFront : card.langBack}
                                        </p>
                                        }


                                        {(card.frontDesc || card.backDesc) && <div className="o-list-flashcards__desc">
                                            <CardFrontDescOrBackDesc
                                                card={cardTextDesc}
                                                cardLang={cardLang}
                                            />

                                            {checkedCards.has(card.id) ? <><hr/>{(
                                                reversFrontBack ? (
                                                    <CardFrontDescOrBackDesc
                                                        card={card.frontDesc}
                                                        cardLang={card.langFront}
                                                    />
                                                ) : (
                                                    <CardFrontDescOrBackDesc
                                                        card={card.backDesc}
                                                        cardLang={card.langBack}
                                                    />
                                                )
                                            )}</> : ''}
                                        </div>}

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

                                            {!playFlashcards ? (
                                                <ul dir="ltr" className="o-list-buttons-clear position-relative">
                                                    <li className="o-button-single-edit">
                                                        <button
                                                            onClick={() => handleOpenQuickEdit(card)}
                                                            className="btn--single-edit"
                                                            tabIndex={card.id === twoCards[twoCards.length - 1]?.id ? "0" : "-1"}
                                                        >
                                                            <i className="icon-pencil"></i>
                                                            <span>{t('edit')}</span>
                                                        </button>
                                                    </li>
                                                    {!checkedCards.has(card.id) ? (
                                                        <li className="o-button-single-check">
                                                            <button
                                                                className="o-list-flashcards__know-check btn--blue"
                                                                onClick={() => handleCheck(card.id)}
                                                                tabIndex={card.id === twoCards[twoCards.length - 1]?.id ? "0" : "-1"}
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
                                                                        handleSwipe(card.id, 'lewo');
                                                                    }}
                                                                >
                                                                    {t('still_learning')}
                                                                </button>
                                                            </li>
                                                            <li>
                                                                <button
                                                                    className="btn--green"
                                                                    onClick={() => {
                                                                        handleSwipe(card.id, 'prawo');
                                                                    }}
                                                                >
                                                                    {t('got_it')}
                                                                </button>
                                                            </li>
                                                        </>
                                                    )}
                                                </ul>
                                            ) : (
                                                <div className="o-card-lock"><i className="icon-lock-2"></i></div>
                                            )}
                                        </div>
                                    </motion.li>
                                );
                            })}
                        </AnimatePresence>
                    </motion.ul>

                    {openCardId && quickEdit[openCardId]?.isEditing &&
                        <div className="o-modal">
                            <div
                                className="o-modal__bg-cancel"
                                onClick={() => handleCloseQuickEdit(openCardId)}
                                role="button"
                                aria-label={t('cancel')}
                            />
                            <div
                                className="o-modal__container w-100"
                                ref={modalRef}
                                role="dialog"
                                aria-modal="true"
                                aria-labelledby="modal-title"
                            >
                                <p className={reversFrontBack ? 'order-3' : 'order-1'}>
                                    <label
                                        className="color-white"
                                        htmlFor={`front-${openCardId}`}
                                    >
                                        {t('front')}:
                                    </label>
                                    <textarea
                                        className="o-default-box"
                                        id={`front-${openCardId}`}
                                        value={quickEdit[openCardId].front}
                                        onChange={(e) => handleQuickEditChange(openCardId, 'front', e.target.value)}
                                    />
                                    <label
                                        className="color-white"
                                        htmlFor={`front-desc-${openCardId}`}
                                    >
                                        {t('description')}:
                                    </label>
                                    <textarea
                                        id={`front-desc-${openCardId}`}
                                        value={quickEdit[openCardId].frontDesc}
                                        onChange={(e) => handleQuickEditChange(openCardId, 'frontDesc', e.target.value)}
                                    />
                                </p>
                                <hr className="order-2" />
                                <p className={reversFrontBack ? 'order-1' : 'order-3'}>
                                    <label
                                        className="color-white"
                                        htmlFor={`back-${openCardId}`}
                                    >
                                        {t('back')}:
                                    </label>
                                    <textarea
                                        className="o-default-box"
                                        id={`back-${openCardId}`}
                                        value={quickEdit[openCardId].back}
                                        onChange={(e) =>
                                            handleQuickEditChange(openCardId, 'back', e.target.value)
                                        }
                                    />
                                    <label
                                        className="color-white"
                                        htmlFor={`back-desc-${openCardId}`}
                                    >
                                        {t('description')}:
                                    </label>
                                    <textarea
                                        id={`back-desc-${openCardId}`}
                                        value={quickEdit[openCardId].backDesc}
                                        onChange={(e) =>
                                            handleQuickEditChange(openCardId, 'backDesc', e.target.value)
                                        }
                                    />
                                </p>
                                <ul className="o-list-buttons-clear o-list-buttons-clear--nowrap order-4">
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
                    }
                </div>) : null
    );
};

export default FlashCards;

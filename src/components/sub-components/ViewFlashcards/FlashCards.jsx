import React from "react";
import {AnimatePresence, motion} from "framer-motion";
import { useTranslation } from 'react-i18next';

const FlashCards = ({
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
                        controls,
                        draggingDirection,
                        setDraggingDirection,
                        handleSwipe,
                        animatingCards,
                        learnIt,
                        knowIt,
                        setAnimatingCards,
                        reversFrontBack,
                        handleSpeak,
                        checkedCards,
                        handleOpenQuickEdit,
                        setOpenCardId,
                        setOpenCard,
                        handleCheck,
                        quickEdit,
                        openCardId,
                        handleCloseQuickEdit,
                        modalRef,
                        handleQuickEditChange,
                        handleSaveQuickEdit,
                        openCard
                    }) => {
    const { t } = useTranslation();

    const CardFrontOrBack = React.memo(({ card, cardLang }) => {
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
    });

    return (
        selectedCategory !== null || selectedSuperCategory !== null ? (
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
                                    <li className="w-100">
                                        <button
                                            className="btn--red w-100"
                                            onClick={() => {
                                                setLearningFilter('learningOnly');
                                                setCheckedCards(new Set());
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
                            <button className="btn--green w-100" onClick={handleNextLesson}>{t('next_lesson')}</button>
                        </p>
                    </>
                ) : (
                    <div onClick={() => {
                        playFlashcards ? handlePlayFlashcards() : false;
                    }} className={`o-page-view-flashcards__content ${playFlashcards ? 'pointer-events-none' : ''}`}>
                        <motion.ul
                            className="o-list-flashcards"
                            initial="initial"
                            animate={controls}
                        >
                            <AnimatePresence>
                                {twoCards.map((card) => (
                                    <motion.li
                                        className={`o-list-flashcards__single-card`}
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
                                                setDraggingDirection((prev) => ({
                                                    ...prev,
                                                    [card.id]: direction,
                                                }));
                                            }
                                        }}
                                        onDragEnd={(event, info) => {
                                            const threshold = 50; // 100 here delayed
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
                                                                onClick={() => {
                                                                    handleCheck(card.id);
                                                                }}
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
                                <div className="o-modal__container"
                                     ref={modalRef}
                                     role="dialog"
                                     aria-modal="true"
                                     aria-labelledby="modal-title"
                                >
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
        ) : null
    );
};
export default FlashCards;
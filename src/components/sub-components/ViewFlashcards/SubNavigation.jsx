import React, {useState} from "react";
import { useTranslation } from 'react-i18next';

const SubNavigation = ({
                           selectedCategory,
                           selectedSuperCategory,
                           getFilteredFlashcardCount,
                           handleMainHomePageLoad,
                           flashcards,
                           learningFilter,
                           setLearningFilter,
                           setCheckedCards,
                           applyFilterAndShuffle,
                           playFlashcards,
                           deck,
                           twoCards,
                           handlePlayFlashcards,
                           reversFrontBack,
                           reversCards
}) => {
    const { t } = useTranslation();
    const [whiteSpaceNowrap, setWhiteSpaceNowrap] = useState(true);

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

    return (
        <div className="o-page-view-flashcards__header">
            {(selectedCategory !== null || selectedSuperCategory !== null) &&
            getFilteredFlashcardCount('all') > 0 ? (
                <>
                    <h2
                        className={`o-page-view-flashcards__title ${
                            whiteSpaceNowrap ? 'white-space-nowrap' : ''
                        }`}
                    >
                        <button
                            type="button"
                            className="o-page-view-flashcards__title-categories"
                            onClick={handleMainHomePageLoad}
                        >
                            {t('categories')}
                        </button>
                        {' / '}
                        <span
                            onClick={() => setWhiteSpaceNowrap((prev) => !prev)}
                        >
                                {selectedSuperCategory ? `${selectedSuperCategory} / ` : ''}

                            {selectedSuperCategory && !selectedCategory
                                ? t('all')
                                : (selectedCategory === 'All')
                                    ? t('all')
                                    : selectedCategory === 'Without category'
                                        ? t('without_category')
                                        : selectedCategory}

                            {' ('}
                            {
                                selectedSuperCategory !== null
                                    ? (selectedCategory === null || selectedCategory === 'All'
                                        ? flashcards.filter(fc => fc.superCategory === selectedSuperCategory).length
                                        : flashcards.filter(fc =>
                                            fc.superCategory === selectedSuperCategory &&
                                            fc.category === selectedCategory
                                        ).length)
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
                                            ).length
                            }
                            {')'}
                            </span>
                    </h2>
                    <hr/>
                    <ul className="o-page-view-flashcards__tools o-list-buttons-clear o-list-buttons-clear--nowrap o-default-box">
                        <li>
                            <button
                                className={`btn--icon w-100 ${
                                    learningFilter === 'all' ? 'btn--active' : ''
                                }`}
                                onClick={() => {
                                    setLearningFilter('all');
                                    setCheckedCards(new Set());
                                    applyFilterAndShuffle();
                                }}
                                disabled={playFlashcards ? 'disabled' : ''}
                            >
                                <i className="icon-single-card"></i>
                                <span>{t('review')}</span>
                                <sup>
                                    {learningFilter === 'all'
                                        ? deck.length + twoCards.length
                                        : getFilteredFlashcardCount('all')}
                                </sup>
                            </button>
                        </li>
                        {hasLearningCards && (
                            <li>
                                <button
                                    className={`btn--icon w-100 ${
                                        learningFilter === 'learningOnly' ? 'btn--active' : ''
                                    }`}
                                    onClick={() => {
                                        setLearningFilter('learningOnly');
                                        setCheckedCards(new Set());
                                        applyFilterAndShuffle();
                                    }}
                                    disabled={playFlashcards ? 'disabled' : ''}
                                >
                                    <i className="icon-graduation-cap"></i> <span>{t('study')}</span>
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
                                <li>
                                    <button
                                        className={`btn--icon w-100 ${playFlashcards ? 'btn--active' : ''}`}
                                        aria-label="Play/Pause"
                                        onClick={handlePlayFlashcards}
                                    >
                                        <i className={playFlashcards ? 'icon-pause' : 'icon-play'}></i>
                                        {/*<span>{playFlashcards ? t('pause') : t('play')}</span>*/}
                                    </button>
                                </li>
                                <li>
                                    <button
                                        aria-label="Revers"
                                        className={`btn-revers btn--icon w-100 ${
                                            reversFrontBack ? 'btn-revers--active btn--active' : ''
                                        }`}
                                        onClick={reversCards}
                                        disabled={playFlashcards ? 'disabled' : ''}
                                    >
                                        <i className="icon-switch"></i>
                                        <span>{t('revers')}</span>
                                        <sup>{reversFrontBack ? 'On' : 'Off'}</sup>
                                    </button>
                                </li>
                            </>
                        )}
                    </ul>
                </>
            ) : null}
        </div>
    );
};
export default SubNavigation;
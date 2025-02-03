import React, {useContext} from "react";
import { useTranslation } from 'react-i18next';
import { showInterstitial } from '../../../services/admobService';
import {FlashcardContext} from "../../../context/FlashcardContext";

const SuggestionsAfterLesson = ({showCompleteMessage, setShowCompleteMessage, applyFilterAndShuffle, getFilteredFlashcardCount, setLearningFilter, setCheckedCards, handleNextLesson}) => {
    const { t } = useTranslation();
    const { isPremium } = useContext(FlashcardContext);
    return (
        showCompleteMessage && (
            <div className="o-complete-message">
                <p>{t('new_viewed_all_flashcards')}</p>
                <ul className="o-list-buttons-clear">
                    <li className="w-100">
                        <button
                            className="btn--blue w-100"
                            onClick={() => {
                                setShowCompleteMessage(false);
                                applyFilterAndShuffle();
                                showInterstitial(isPremium);
                            }}
                        >
                            {t('review_again')}
                        </button>
                    </li>
                    {getFilteredFlashcardCount('learningOnly') > 0 && (
                        <li className="w-100">
                            <button className="btn--red w-100"
                                    onClick={() => {
                                        setLearningFilter('learningOnly');
                                        setCheckedCards(new Set());
                                        applyFilterAndShuffle();
                                        showInterstitial(isPremium);
                                    }}
                            >
                                {t('review_only_the_ones_you_didnt_know')}
                            </button>
                        </li>
                    )}
                    <li className="w-100">
                        <button className="btn--green w-100" onClick={()=>{
                            handleNextLesson();
                            showInterstitial(isPremium);
                        }}>{t('next_lesson')}</button>
                    </li>
                </ul>
            </div>
        )
    );
};
export default SuggestionsAfterLesson;
// Search.jsx

import React, { useCallback, useContext, useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { FlashcardContext } from "../context/FlashcardContext";
import { EditSearchContext } from "../context/EditSearchContext";
import { debounce } from "../utils/debounce";
import FlashCardListEdit from "./sub-components/common/FlashCardListEdit";

const removeCustomTags = (text = "") => {
    return text
        // usuń dokładnie [b], [/b], [i], [/i]
        .replace(/\[\/?b\]/gi, "")
        .replace(/\[\/?i\]/gi, "");
}

function Search() {
    const { t } = useTranslation();
    const { flashcards } = useContext(FlashcardContext);

    const {
        editMode, setEditMode,
        editFront, setEditFront,
        editFrontDesc, setEditFrontDesc,
        editBack, setEditBack,
        editBackDesc, setEditBackDesc,
        editCategory, setEditCategory,
        editSuperCategory, setEditSuperCategory,
        editKnow, setEditKnow,
        editType, setEditType,
        selectedCards, setSelectedCards,
        editFrontLang, setEditFrontLang,
        editBackLang, setEditBackLang,
        showStillLearning,
        availableLanguages,
        visibleModalSingle, setVisibleModalSingle,
        cancelEditing,
        backToEditlist
    } = useContext(EditSearchContext);

    const refInputSearch = useRef();
    const [searchTerm, setSearchTerm] = useState('');
    const [results, setResults] = useState([]);
    const [searchRestart, setSearchRestart] = useState(false);

    const performSearch = useCallback(
        debounce((term) => {
            const trimmedTerm = term.trim();

            if (trimmedTerm.length < 2) {
                setResults([]);
                return;
            }

            const lowerTerm = trimmedTerm.toLowerCase();
            // const filtered = flashcards.filter(
            //     (card) =>
            //         (card.front && card.front.toLowerCase().includes(lowerTerm)) ||
            //         (card.back && card.back.toLowerCase().includes(lowerTerm)) ||
            //         (card.frontDesc && card.frontDesc.toLowerCase().includes(lowerTerm)) ||
            //         (card.backDesc && card.backDesc.toLowerCase().includes(lowerTerm)) ||
            //         (card.front && card.front.toLowerCase().includes(lowerTerm))
            //         // || (card.category && card.category.toLowerCase().includes(lowerTerm)) ||
            //         // (card.superCategory && card.superCategory.toLowerCase().includes(lowerTerm))
            // );
            const filtered = flashcards.filter((card) => {

                const front = removeCustomTags(card.front || "").toLowerCase();
                const back = removeCustomTags(card.back || "").toLowerCase();
                const frontDesc = removeCustomTags(card.frontDesc || "").toLowerCase();
                const backDesc = removeCustomTags(card.backDesc || "").toLowerCase();
                return (
                    front.includes(lowerTerm) ||
                    back.includes(lowerTerm) ||
                    frontDesc.includes(lowerTerm) ||
                    backDesc.includes(lowerTerm)
                );
            });
            setResults(filtered);
        }, 500),
        [flashcards]
    );

    const handleChange = (e) => {
        const term = e.target.value;
        setSearchTerm(term);
        performSearch(term);
    };

    useEffect(() => {
        if (searchRestart) {
            performSearch(searchTerm);
            setSearchRestart(false);
        }
    }, [searchRestart, performSearch, searchTerm]);

    return (
        <div className="o-page-search">
            <h2>{t('search')}</h2>
            <hr />
            <div className="o-default-box">
                <label htmlFor="o-input-search">{t('search_the_database')}</label>
                <div className="o-default-box">
                    <input
                        id="o-input-search"
                        className="w-100"
                        type="text"
                        value={searchTerm}
                        onChange={handleChange}
                        placeholder={`${t('search')}...`}
                        ref={refInputSearch}
                    />
                </div>
                <FlashCardListEdit
                    backToEditlist={backToEditlist}
                    setEditMode={setEditMode}
                    setSelectedCards={setSelectedCards}
                    availableLanguages={availableLanguages}
                    filteredFlashcards={results} // Użycie wyników wyszukiwania
                    showStillLearning={showStillLearning}
                    editMode={editMode}
                    cancelEditing={cancelEditing}
                    visibleModalSingle={visibleModalSingle}
                    setVisibleModalSingle={setVisibleModalSingle}
                    editFront={editFront}
                    editFrontDesc={editFrontDesc}
                    setEditFront={setEditFront}
                    setEditFrontDesc={setEditFrontDesc}
                    editFrontLang={editFrontLang}
                    setEditFrontLang={setEditFrontLang}
                    editBack={editBack}
                    editBackDesc={editBackDesc}
                    setEditBack={setEditBack}
                    setEditBackDesc={setEditBackDesc}
                    editBackLang={editBackLang}
                    setEditBackLang={setEditBackLang}
                    editCategory={editCategory}
                    setEditCategory={setEditCategory}
                    editSuperCategory={editSuperCategory}
                    setEditSuperCategory={setEditSuperCategory}
                    editKnow={editKnow}
                    setEditKnow={setEditKnow}
                    editType={editType}
                    setEditType={setEditType}
                    selectedCards={selectedCards}
                    typePage={'search'}
                    setSearchRestart={setSearchRestart}
                />
            </div>
        </div>
    );
}

export default Search;

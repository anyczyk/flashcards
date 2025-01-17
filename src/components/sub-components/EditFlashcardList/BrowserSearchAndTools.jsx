// BrowserSearchAndTools.jsx

import React, { useState, useRef, useEffect, useContext } from 'react';
import { useTranslation } from 'react-i18next';
import useWcagModal from '../../../hooks/useWcagModal';
import { FlashcardContext } from "../../../context/FlashcardContext";
import cardsExport from "../../../utils/cardsExport";
import { removeItemFromLocalStorage } from "../../../utils/storage";

const BrowserSearchAndTools = ({
                                   setSelectedCards,
                                   backToEditlist,
                                   filteredFlashcards,
                                   selectedCards,
                                   showStillLearning,
                                   setShowStillLearning,
                                   cancelEditing
                               }) => {
    const { t } = useTranslation(); // Hook translation
    const {
        flashcards
    } = useContext(FlashcardContext);
    const { removeFlashcard } = useContext(FlashcardContext);
    const [searchTerm, setSearchTerm] = useState('');
    const refSearch = useRef(null);
    const [oSearch, setOSearch] = useState(false);
    const prevScrollY = useRef(window.scrollY);
    const positionY = useRef(0);
    const isTicking = useRef(false); // Dla throttlingu
    const modalRef = useRef(null);
    const [visibleModalAll, setVisibleModalAll] = useState(null);

    const areAllSelected =
        selectedCards.length > 0 &&
        selectedCards.length === filteredFlashcards.length;

    useEffect(() => {
        if (refSearch.current) {
            const rect = refSearch.current.getBoundingClientRect();
            positionY.current = rect.top + window.scrollY - 64;
        }
    }, []);

    const handleScroll = () => {
        if (!isTicking.current) {
            window.requestAnimationFrame(() => {
                const currentScrollY = window.scrollY;
                const directionDown = currentScrollY > prevScrollY.current;

                if (directionDown) {
                    if (currentScrollY > positionY.current && !oSearch) {
                        setOSearch(true);
                    }
                } else {
                    if (currentScrollY < positionY.current && oSearch) {
                        setOSearch(false);
                    }
                }
                prevScrollY.current = currentScrollY;
                isTicking.current = false;
            });
            isTicking.current = true;
        }
    };

    useEffect(() => {
        window.addEventListener("scroll", handleScroll);
        return () => {
            window.removeEventListener("scroll", handleScroll);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [oSearch]);

    const handleSearch = () => {
        if (searchTerm.trim() === '') return;
        window.find(
            searchTerm,
            false,
            false,
            true,
            false,
            false,
            false
        );
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') {
            handleSearch();
        }
    };

    useWcagModal(visibleModalAll, setVisibleModalAll, modalRef);
    function getSubCategoriesObject() {
        const subCatStr = localStorage.getItem('subCategoriesOrderStorage');
        return subCatStr ? JSON.parse(subCatStr) : {};
    }

    function encodeSuperCategoryKey(superCategory) {
        return 'subCategoryOrder_' + btoa(unescape(encodeURIComponent(superCategory)));
    }

    function saveSubCategoriesObject(obj) {
        localStorage.setItem('subCategoriesOrderStorage', JSON.stringify(obj));
    }

    function removeCategoryFromSuperCategory(superCat, categoryName) {
        const subObj = getSubCategoriesObject();
        const subKey = encodeSuperCategoryKey(superCat);
        if (subObj[subKey]) {
            const idx = subObj[subKey].indexOf(categoryName);
            if (idx !== -1) {
                console.log("ccc");
                subObj[subKey].splice(idx, 1);
                saveSubCategoriesObject(subObj);
            }
        }
    }

    const removeSelectedCards = () => {
        const categoriesInSuperCatCount = flashcards.filter(fc => fc.superCategory === filteredFlashcards[0].superCategory).length;

        if (areAllSelected && filteredFlashcards.length === categoriesInSuperCatCount && filteredFlashcards[0].superCategory) {
            removeItemFromLocalStorage("categoryOrder", filteredFlashcards[0].superCategory);
        } else if (areAllSelected && filteredFlashcards[0].superCategory === '') {
            removeItemFromLocalStorage("categoryOrder", filteredFlashcards[0].category);
        }

        let backToList = areAllSelected;
        selectedCards.forEach(id => {
            if (filteredFlashcards.some(fc => fc.id === id)) {
                removeFlashcard(id);
            }
        });
        setSelectedCards([]);
        if (backToList) {
            removeCategoryFromSuperCategory(filteredFlashcards[0].superCategory, filteredFlashcards[0].category);
            backToEditlist();
        }
    };

    const copySelectedCards = () => {
        const cardsToCopy = filteredFlashcards.filter(fc => selectedCards.includes(fc.id));
        const jsonData = JSON.stringify(cardsToCopy, null, 2);
        navigator.clipboard.writeText(jsonData).then(() => {
            alert(t('copied_selected_flashcards_to_clipboard'));
        });
    };

    const handleExport = async () => {
        try {
            const cardsToExport = filteredFlashcards.filter(fc => selectedCards.includes(fc.id));
            await cardsExport(cardsToExport);
        } catch (error) {
            console.error(t('an_error_occurred_while_exporting_the_flashcards'), error);
            alert(t('an_error_occurred_while_exporting_the_flashcards'));
        }
    };

    const selectAll = () => {
        if (filteredFlashcards.length === 0) return;
        const allVisibleIds = filteredFlashcards.map(fc => fc.id);
        setSelectedCards(allVisibleIds);
    };

    const deselectAll = () => {
        setSelectedCards([]);
    };

    return (
        <div onClick={cancelEditing} className="o-search-wrap">
            <div ref={refSearch} className={`o-search o-default-box ${oSearch ? 'o-search--fixed' : ''}`}>
                <ul className="o-list-buttons-clear o-list-buttons-clear--nowrap o-default-box">
                    <li className="d-flex align-items-center w-100">
                        <input
                            type="search"
                            placeholder={t('search')}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            onKeyDown={handleKeyDown}
                            style={{ width: '100%' }}
                        />
                    </li>
                    <li className="flex-none">
                        <button className="btn--icon" aria-label="Search" onClick={handleSearch}>
                            <i className="icon-search"></i>
                        </button>
                    </li>
                    <li className="flex-none">
                        <button
                            onClick={() => setShowStillLearning(prevState => !prevState)}
                            className={`btn--icon ${showStillLearning ? 'btn--active' : ''}`}
                        >
                            <i className="icon-graduation-cap"></i> <span>{t('show_still_learning')}</span>
                        </button>
                    </li>
                    {filteredFlashcards.length > 0 && (
                        <li className="flex-none">
                            <button
                                className={`btn--icon ${areAllSelected ? 'btn--active' : ''}`}
                                onClick={selectAll}
                            >
                                <i className="icon-ok-circled"></i> <span>{t('select_all')}</span>
                            </button>
                        </li>
                    )}
                </ul>

                {(selectedCards.length > 0 && filteredFlashcards.length > 0) && (
                    <>
                        <hr className="mt-1" />
                        <ul className="o-list-buttons-clear justify-content-right">
                            <li>
                                <button className="btn--icon" onClick={deselectAll}>
                                    <i className="icon-ok-circled2"></i> <span>{t('deselect_all')}</span>
                                </button>
                            </li>
                            <li>
                                <button className="btn--icon btn--green" onClick={copySelectedCards}>
                                    <i className="icon-docs"></i> <span>{t('copy_selected')}</span>
                                </button>
                            </li>
                            <li>
                                <button className="btn--icon btn--yellow" onClick={handleExport}>
                                    <i className="icon-export"></i> <span>{t('export_selected')}</span>
                                </button>
                            </li>
                            <li>
                                <button
                                    className="btn--red btn--icon"
                                    onClick={() => setVisibleModalAll(true)}
                                >
                                    <i className="icon-trash-empty"></i> <span>{t('remove_selected')}</span>
                                </button>
                                {visibleModalAll && (
                                    <div className="o-modal">
                                        <div
                                            className="o-modal__bg-cancel"
                                            type="button"
                                            aria-label={t('cancel')}
                                            onClick={() => setVisibleModalAll(false)}
                                        ></div>
                                        <div
                                            className="o-modal__container"
                                            ref={modalRef}
                                            role="dialog"
                                            aria-modal="true"
                                            aria-labelledby="modal-title"
                                        >
                                            <p>{t('are_you_sure_delete_flashcards')}</p>
                                            <ul className="o-list-buttons-clear o-list-buttons-clear--nowrap">
                                                <li>
                                                    <button
                                                        className="btn--red"
                                                        onClick={() => {
                                                            removeSelectedCards();
                                                            setVisibleModalAll(false);
                                                        }}
                                                    >
                                                        <i className="icon-trash-empty"></i>{' '}
                                                        {t('confirm')}
                                                    </button>
                                                </li>
                                                <li>
                                                    <button onClick={() => setVisibleModalAll(false)}>
                                                        <i className="icon-cancel-circled"></i>{' '}
                                                        {t('cancel')}
                                                    </button>
                                                </li>
                                            </ul>
                                        </div>
                                    </div>
                                )}
                            </li>
                        </ul>
                    </>
                )}
            </div>
        </div>
    );
};

export default BrowserSearchAndTools;

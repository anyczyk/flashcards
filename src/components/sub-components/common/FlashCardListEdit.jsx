// FlashCardListEdit.jsx

import React, { useCallback, useContext, useEffect, useState,useRef } from "react";
import SelectCodeLanguages from "./SelectCodeLanguages";
import { useTranslation } from "react-i18next";
import { FlashcardContext } from "../../../context/FlashcardContext";
import SelectSuperCategory from "./SelectSuperCategory";
import { getAllFlashcards } from "../../../db";
import SelectCategory from "./SelectCategory";
import { useNavigate } from 'react-router-dom';
function encodeSuperCategoryKey(superCategory) {
    return 'subCategoryOrder_' + btoa(unescape(encodeURIComponent(superCategory)));
}
function getSubCategoriesObject() {
    const subCatStr = localStorage.getItem('subCategoriesOrderStorage');
    return subCatStr ? JSON.parse(subCatStr) : {};
}

const FlashCardListEdit = ({
                               typePage,
                               setSearchRestart,
                               backToEditlist,
                               setEditMode,
                               setSelectedCards,
                               availableLanguages,
                               filteredFlashcards,
                               showStillLearning,
                               editMode,
                               cancelEditing,
                               visibleModalSingle,
                               setVisibleModalSingle,
                               editFront,
                               setEditFront,
                               editFrontLang,
                               setEditFrontLang,
                               editBack,
                               setEditBack,
                               editBackLang,
                               setEditBackLang,
                               editCategory,
                               setEditCategory,
                               editSuperCategory,
                               setEditSuperCategory,
                               editKnow,
                               setEditKnow,
                               selectedCards
                           }) => {
    const { t } = useTranslation();
    const { removeFlashcard, editFlashcard, superCategoriesArray, setOrderedCategories, flashcards, rtlCodeLangs } = useContext(FlashcardContext);
    const navigate = useNavigate();

    const [oldCategory, setOldCategory] = useState('');
    const [oldSuperCategory, setOldSuperCategory] = useState('');

    const [currentSelectSuperCategory, setCurrentSelectSuperCategory] = useState('');
    const [categoriesDependentOnSuperCategory, setCategoriesDependentOnSuperCategory] = useState([]);

    const cardRefs = useRef({});

    const loadDataSelectors = useCallback(async () => {
        const data = await getAllFlashcards();

        if (editSuperCategory.trim() !== '') {
            const catDependSuperCategory = new Set(
                data
                    .filter(fc => fc.category && fc.category.trim() !== '' && fc.superCategory === editSuperCategory)
                    .map(fc => fc.category)
            );
            setCategoriesDependentOnSuperCategory([...catDependSuperCategory]);
        } else {
            const catDependSuperCategory = new Set(
                data
                    .filter(fc => fc.category && fc.category.trim() !== '' && fc.superCategory === currentSelectSuperCategory)
                    .map(fc => fc.category)
            );
            setCategoriesDependentOnSuperCategory([...catDependSuperCategory]);
        }
    }, [editSuperCategory, currentSelectSuperCategory]);

    useEffect(() => {
        loadDataSelectors();
    }, [loadDataSelectors]);


    useEffect(() => {
        if (editMode && cardRefs.current[editMode]) {
            const element = cardRefs.current[editMode];
            const elementRect = element.getBoundingClientRect();
            const absoluteElementTop = elementRect.top + window.pageYOffset;
            const offset = typePage === 'search' ? 68 : 146;
            const scrollToPosition = absoluteElementTop - offset;

            window.scrollTo({
                top: scrollToPosition,
                behavior: 'smooth',
            });
        }
    }, [editMode]);

    const toggleSelectCard = (cardId) => {
        setSelectedCards(prev => {
            if (prev.includes(cardId)) {
                return prev.filter(id => id !== cardId);
            } else {
                return [...prev, cardId];
            }
        });
    };

    const showModalConfirmRemove = (id) => {
        setVisibleModalSingle((prevState) => ({
            ...prevState,
            [id]: !prevState[id], // toggle
        }));
    };
    function saveSubCategoriesObject(obj) {
        localStorage.setItem('subCategoriesOrderStorage', JSON.stringify(obj));
    }

    function removeSuperCategoryKeyFromLocalStorage(superCat) {
        const subObj = getSubCategoriesObject();
        const oldKey = encodeSuperCategoryKey(superCat);
        if (subObj[oldKey]) {
            delete subObj[oldKey];
            saveSubCategoriesObject(subObj);
        }
    }

    const removeCategoryFromSuperCategory = (superCat, categoryName) => {
        const subObj = getSubCategoriesObject();
        const subKey = encodeSuperCategoryKey(superCat);
        if (subObj[subKey]) {
            const idx = subObj[subKey].indexOf(categoryName);
            if (idx !== -1) {
                subObj[subKey].splice(idx, 1);
                localStorage.setItem('subCategoriesOrderStorage', JSON.stringify(subObj));
            }
        }
    };

    const addCategoryToSuperCategory = (superCat, categoryName) => {
        const subObj = getSubCategoriesObject();
        const subKey = encodeSuperCategoryKey(superCat);
        if (!subObj[subKey]) {
            subObj[subKey] = [];
        }
        if (!subObj[subKey].includes(categoryName)) {
            subObj[subKey].unshift(categoryName);
        }
        localStorage.setItem('subCategoriesOrderStorage', JSON.stringify(subObj));
    };

    const removeItemFromArray = (arr, item) => {
        const idx = arr.indexOf(item);
        if (idx !== -1) arr.splice(idx, 1);
    };

    const submitEdit = async (id) => {
        if (editFront.trim() && editBack.trim()) {
            const finalKnow = editKnow ? true : undefined;
            await editFlashcard(
                id,
                editFront,
                editBack,
                editCategory.trim(),
                finalKnow,
                editFrontLang.trim(),
                editBackLang.trim(),
                editSuperCategory.trim()
            );

            const allFlashcards = await getAllFlashcards();
            if (oldSuperCategory !== editSuperCategory.trim()) {
                if (oldSuperCategory) {
                    const otherCards = allFlashcards.filter(fc =>
                        fc.category === oldCategory &&
                        fc.superCategory === oldSuperCategory &&
                        fc.id !== id
                    );
                    if (otherCards.length === 0) {
                        removeCategoryFromSuperCategory(oldSuperCategory, oldCategory || 'Without category');
                    }
                }
                if (editSuperCategory.trim()) {
                    const newCat = editCategory.trim() !== '' ? editCategory.trim() : 'Without category';
                    addCategoryToSuperCategory(editSuperCategory.trim(), newCat);
                }
            }
            else {
                if (oldCategory !== editCategory.trim() && editSuperCategory.trim()) {
                    const otherCards = allFlashcards.filter(fc =>
                        fc.category === oldCategory &&
                        fc.superCategory === oldSuperCategory &&
                        fc.id !== id
                    );
                    if (otherCards.length === 0) {
                        removeCategoryFromSuperCategory(editSuperCategory.trim(), oldCategory || 'Without category');
                    }
                    const newCat = editCategory.trim() !== '' ? editCategory.trim() : 'Without category';
                    addCategoryToSuperCategory(editSuperCategory.trim(), newCat);
                }
            }
            const savedOrder = localStorage.getItem('categoryOrder');
            let arr = savedOrder ? JSON.parse(savedOrder) : [];
            if (!oldSuperCategory && oldCategory) {
                removeItemFromArray(arr, oldCategory);
            }

            if (!editSuperCategory.trim() && editCategory.trim()) {
                removeItemFromArray(arr, editCategory.trim());
                arr.unshift(editCategory.trim());
            }
            localStorage.setItem('categoryOrder', JSON.stringify(arr));
            setOrderedCategories(prev => {
                const updated = prev.map(cat => (cat === oldCategory ? editCategory.trim() : cat));
                return [...new Set(updated)];
            });

            cancelEditing();

            if(typePage === 'search') {
                setSearchRestart(true);
            }
        }
    };

    const startEditing = (card) => {
        setEditMode(card.id);
        setEditFront(card.front);
        setEditBack(card.back);
        setEditCategory(card.category || '');
        setEditKnow(card.know === true);
        setEditFrontLang(card.langFront);
        setEditBackLang(card.langBack);
        setEditSuperCategory(card.superCategory || '');
        setVisibleModalSingle({});

        setOldCategory(card.category || '');
        setOldSuperCategory(card.superCategory || '');
    };

    const setCardRef = useCallback((id) => (element) => {
        cardRefs.current[id] = element;
    }, []);

    const filteredObj = filteredFlashcards.filter(fc => (showStillLearning ? !fc.know : true));

    // console.log("filteredObj", filteredObj);

    return (filteredObj.length > 0 ?
            <>
                <p>{typePage === 'search' ? t('number_of_flashcards_found') : t('number_of_flashcards')}:  {filteredObj.length}</p>
                <ul
                    onClick={(e) => {
                        if (editMode && !e.target.closest('.o-card--active')) {
                            cancelEditing();
                        }
                    }}
                    className={`o-list-edit-flashcards ${editMode ? 'o-list-edit-flashcards--edit-state' : ''}`}
                >
                    {typePage === 'main-edit' &&
                        <li className="o-button-add-flashcard">
                            <button
                                onClick={() => navigate(`/create?addFirstOrLast=first&superCategory=${filteredObj[0].superCategory}&category=${filteredObj[0].category}`)}
                                type="button"
                                className="justify-content-center color-green-strong-dark btn--cream"
                                aria-label={t('add_flashcard')}
                            >
                                <i className="icon-plus"></i>
                            </button>
                        </li>
                    }
                    {filteredObj.map((card, index) => (
                        <li ref={setCardRef(card.id)}
                            className={`o-card ${editMode === card.id ? 'o-card--active' : ''}`} key={card.id}>
                            <ul
                                className={`o-list-buttons ${
                                    card.know ? 'bg-color-green-dark-opacity-03' : 'bg-color-red-opacity-03'
                                }`}
                            >
                                {editMode === card.id ? (
                                    <>
                                        <li>
                                            <button className="btn--icon" onClick={cancelEditing}>
                                                <i className="icon-cancel-circled"></i>
                                            </button>
                                        </li>
                                    </>
                                ) : (
                                    <>
                                        <li>
                                            {visibleModalSingle[index] ? (
                                                <ul className="o-list-buttons-clear">
                                                    <li>
                                                        <button
                                                            className="btn--red"
                                                            onClick={() => {
                                                                removeFlashcard(card.id);
                                                                setSelectedCards(prev => prev.filter(selId => selId !== card.id));
                                                                showModalConfirmRemove(index);

                                                                const selectedCard = flashcards.find(fc => fc.id === card.id);
                                                                if (selectedCard) {
                                                                    const {category, superCategory} = selectedCard;
                                                                    const countInCategory = flashcards.filter(fc => fc.category === category).length;
                                                                    const countInSuperCategory = flashcards.filter(fc => fc.superCategory === superCategory).length;
                                                                    if (countInCategory === 1) {
                                                                        if (countInSuperCategory > 1) {
                                                                            removeCategoryFromSuperCategory(superCategory, category);
                                                                        } else if (countInSuperCategory === 1) {
                                                                            removeSuperCategoryKeyFromLocalStorage(superCategory);
                                                                        }
                                                                        backToEditlist();
                                                                    }

                                                                } else {
                                                                    console.log("Can't find flashcard from this id.");
                                                                }
                                                                if (typePage === 'search') {
                                                                    setTimeout(function () {
                                                                        setSearchRestart(true);
                                                                    }, 300);
                                                                }
                                                            }}
                                                        >
                                                            <i className="icon-trash-empty"></i> {t('confirm')}
                                                        </button>
                                                    </li>
                                                    <li>
                                                        <button onClick={() => showModalConfirmRemove(index)}>
                                                            <i className="icon-cancel-circled"></i> {t('cancel')}
                                                        </button>
                                                    </li>
                                                </ul>
                                            ) : (
                                                <button
                                                    className="btn--red"
                                                    onClick={() => {
                                                        setVisibleModalSingle({});
                                                        showModalConfirmRemove(index);
                                                    }}
                                                >
                                                    <i className="icon-trash-empty"></i> {t('remove')}
                                                </button>
                                            )}
                                        </li>
                                    </>
                                )}
                                {typePage === 'main-edit' && <li className="ml-auto">
                                    <label className="o-checkbox">
                                        <input
                                            type="checkbox"
                                            checked={selectedCards.includes(card.id)}
                                            onChange={() => toggleSelectCard(card.id)}
                                        />
                                        <i className="o-checkbox__icon icon-ok"></i>
                                    </label>
                                </li>}
                            </ul>

                            {editMode === card.id ? (
                                <div className="o-card__content o-card--active">
                                    <p>
                                        <strong>ID:</strong> {card.id}
                                    </p>
                                    <hr/>
                                    <p>
                                        <label htmlFor={`o-edit-front-${card.id}`}>{t('front')}:</label>
                                        <textarea
                                            value={editFront}
                                            className="o-default-box"
                                            onChange={(e) => setEditFront(e.target.value)}
                                            rows="2"
                                            cols="30"
                                            id={`o-edit-front-${card.id}`}
                                            dir={rtlCodeLangs.includes(editFrontLang) ? 'rtl' : 'ltr'}
                                            required
                                        />
                                        <label htmlFor={`o-edit-front-lang-${card.id}`}>
                                            {t('language_code')}:
                                        </label>
                                        <SelectCodeLanguages
                                            availableLanguages={availableLanguages}
                                            value={editFrontLang}
                                            id={`o-edit-front-lang-${card.id}`}
                                            setFunction={setEditFrontLang}
                                        />
                                    </p>
                                    <hr/>
                                    <p>
                                        <label htmlFor={`o-edit-back-${card.id}`}>{t('back')}:</label>
                                        <textarea
                                            className="o-default-box"
                                            value={editBack}
                                            onChange={(e) => setEditBack(e.target.value)}
                                            rows="2"
                                            cols="30"
                                            id={`o-edit-back-${card.id}`}
                                            dir={rtlCodeLangs.includes(editBackLang) ? 'rtl' : 'ltr'}
                                            required
                                        />
                                        <label htmlFor={`o-edit-back-lang-${card.id}`}>
                                            {t('language_code')}:
                                        </label>
                                        <SelectCodeLanguages
                                            availableLanguages={availableLanguages}
                                            value={editBackLang}
                                            id={`o-edit-back-lang-${card.id}`}
                                            setFunction={setEditBackLang}
                                        />
                                    </p>
                                    <hr/>
                                    <SelectSuperCategory
                                        superCategory={editSuperCategory}
                                        setSuperCategory={setEditSuperCategory}
                                        superCategoriesArray={superCategoriesArray}
                                        setCurrentSelectSuperCategory={setCurrentSelectSuperCategory}
                                    />
                                    <hr/>
                                    <SelectCategory
                                        category={editCategory}
                                        setCategory={setEditCategory}
                                        categoriesDependentOnSuperCategory={categoriesDependentOnSuperCategory}
                                    />
                                    <hr/>
                                    <p>
                                        <label htmlFor={`o-edit-know-${card.id}`}>{t('know')}:</label>
                                        &nbsp;
                                        <label className="o-checkbox">
                                            <input
                                                type="checkbox"
                                                checked={editKnow}
                                                onChange={(e) => setEditKnow(e.target.checked)}
                                                id={`o-edit-know-${card.id}`}
                                            />
                                            <i className="o-checkbox__icon icon-ok"></i>
                                        </label>
                                    </p>
                                    <hr/>
                                    <ul className="o-list-buttons-clear o-list-buttons-clear--nowrap">
                                        <li>
                                            <button disabled={!editFront.trim() || !editBack.trim()} className="btn--green" onClick={() => submitEdit(card.id)}>
                                                <i className="icon-floppy-1"></i> {t('save')}
                                            </button>
                                        </li>
                                        <li>
                                            <button onClick={cancelEditing}>
                                                <i className="icon-cancel-circled"></i> {t('cancel')}
                                            </button>
                                        </li>
                                    </ul>
                                </div>
                            ) : (
                                <div className="o-card__content">
                                    <p>
                                        <strong>ID:</strong> {card.id}
                                    </p>
                                    <hr/>
                                    <h3>{t('front')}:</h3>
                                    <p className="o-card__content-edit o-card__content-edit--front">
                                        {card.front}
                                    </p>
                                    <p>
                                        <strong>{t('language_code')}:</strong>{' '}
                                        {card.langFront !== '' ? card.langFront : t('no_data')}
                                    </p>
                                    <hr/>
                                    <h3>{t('back')}:</h3>
                                    <p className="o-card__content-edit o-card__content-edit--back">
                                        {card.back}
                                    </p>
                                    <p>
                                        <strong>{t('language_code')}:</strong>{' '}
                                        {card.langBack !== '' ? card.langBack : t('no_data')}
                                    </p>
                                    <hr/>
                                    <p>
                                        <strong>{t('category')}:</strong>{' '}
                                        {card.category && card.category.trim() !== ''
                                            ? card.category
                                            : t('without_category')}
                                    </p>
                                    <hr/>
                                    <p>
                                        <strong>{t('super_category')}:</strong>{' '}
                                        {card.superCategory && card.superCategory.trim() !== ''
                                            ? card.superCategory
                                            : t('without_super_category')}
                                    </p>
                                    <hr/>
                                    <p>
                                        <button onClick={() => startEditing(card)}>
                                            <i className="icon-pencil"></i> {t('edit')}
                                        </button>
                                    </p>
                                </div>
                            )}
                        </li>
                    ))}
                </ul>
            </>
            : <p>{t('no_results')}</p>
    );
};

export default FlashCardListEdit;

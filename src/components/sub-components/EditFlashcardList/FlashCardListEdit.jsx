import React, { useCallback, useContext, useEffect, useState } from "react";
import SelectCodeLanguages from "../common/SelectCodeLanguages";
import { useTranslation } from "react-i18next";
import { FlashcardContext } from "../../../context/FlashcardContext";
import SelectSuperCategory from "../common/SelectSuperCategory";
import { getAllFlashcards } from "../../../db";
import SelectCategory from "../common/SelectCategory";

const FlashCardListEdit = ({
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
    const { removeFlashcard, editFlashcard, superCategoriesArray } = useContext(FlashcardContext);

    const [currentSelectSuperCategory, setCurrentSelectSuperCategory] = useState('');
    const [categoriesDependentOnSuperCategory, setCategoriesDependentOnSuperCategory] = useState([]);

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

    const submitEdit = (id) => {
        if (editFront.trim() && editBack.trim()) {
            const finalKnow = editKnow ? true : undefined;
            editFlashcard(
                id,
                editFront,
                editBack,
                editCategory.trim(),
                finalKnow,
                editFrontLang.trim(),
                editBackLang.trim(),
                editSuperCategory.trim()
            );
            cancelEditing();
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
    };

    return (
        <ul
            onClick={(e) => {
                if (editMode && !e.target.closest('.o-card--active')) {
                    cancelEditing();
                }
            }}
            className={`o-list-edit-flashcards ${editMode ? 'o-list-edit-flashcards--edit-state' : ''}`}
        >
            {filteredFlashcards
                .filter(fc => (showStillLearning ? !fc.know : true))
                .map((card, index) => (
                    <li className={`o-card ${editMode === card.id ? 'o-card--active' : ''}`} key={card.id}>
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
                            <li className="ml-auto">
                                <label className="o-checkbox">
                                    <input
                                        type="checkbox"
                                        checked={selectedCards.includes(card.id)}
                                        onChange={() => toggleSelectCard(card.id)}
                                    />
                                    <i className="o-checkbox__icon icon-ok"></i>
                                </label>
                            </li>
                        </ul>

                        {editMode === card.id ? (
                            <div className="o-card__content">
                                <p>
                                    <strong>ID:</strong> {card.id}
                                </p>
                                <hr />
                                <p>
                                    <label htmlFor={`o-edit-front-${card.id}`}>{t('front')}:</label>
                                    <textarea
                                        value={editFront}
                                        className="o-default-box"
                                        onChange={(e) => setEditFront(e.target.value)}
                                        rows="2"
                                        cols="30"
                                        id={`o-edit-front-${card.id}`}
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
                                <hr />
                                <p>
                                    <label htmlFor={`o-edit-back-${card.id}`}>{t('back')}:</label>
                                    <textarea
                                        className="o-default-box"
                                        value={editBack}
                                        onChange={(e) => setEditBack(e.target.value)}
                                        rows="2"
                                        cols="30"
                                        id={`o-edit-back-${card.id}`}
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
                                <hr />
                                <SelectSuperCategory
                                    superCategory={editSuperCategory}
                                    setSuperCategory={setEditSuperCategory}
                                    superCategoriesArray={superCategoriesArray}
                                    setCurrentSelectSuperCategory={setCurrentSelectSuperCategory}
                                />
                                <hr />
                                <SelectCategory
                                    category={editCategory}
                                    setCategory={setEditCategory}
                                    categoriesDependentOnSuperCategory={categoriesDependentOnSuperCategory}
                                />
                                <hr />
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
                                <hr />
                                <ul className="o-list-buttons-clear o-list-buttons-clear--nowrap">
                                    <li>
                                        <button className="btn--green" onClick={() => submitEdit(card.id)}>
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
    );
};

export default FlashCardListEdit;

// CategoryListDragDrop.jsx

import { useNavigate } from 'react-router-dom';
import React, { useContext, useState, useEffect, useCallback } from "react";
import {
    DragDropContext,
    Draggable,
    Droppable
} from "@hello-pangea/dnd";
import { topScroll } from "../../../utils/topScroll";
import { useTranslation } from 'react-i18next';
import { FlashcardContext } from '../../../context/FlashcardContext';

function encodeSuperCategoryKey(superCategory) {
    return 'subCategoryOrder_' + btoa(unescape(encodeURIComponent(superCategory)));
}

const CategoryListDragDrop = ({
                                  selectedCategory,
                                  setSelectedSuperCategory,
                                  selectedSuperCategory,
                                  setSelectedCards,
                                  setOpenModalEdit,
                                  setNameNew,
                                  setNameOld,
                                  setNameSuperCategory,
                                  setNameType,
                                  setNameNewSuperCategory,
                                  setSelectedCategory,
                                  toolsItemActive,
                                  setToolsItemActive
                              }) => {
    const { t } = useTranslation();
    const { flashcards, orderedCategories, setOrderedCategories } = useContext(FlashcardContext);
    const navigate = useNavigate();

    // Która superkategoria jest aktualnie rozwinięta
    const [activeSuperCategory, setActiveSuperCategory] = useState(null);

    // Stan zawierający obiekt subCategoriesOrderStorage
    const [subCategoriesOrder, setSubCategoriesOrder] = useState(() => {
        try {
            const stored = localStorage.getItem('subCategoriesOrderStorage');
            return stored ? JSON.parse(stored) : {};
        } catch {
            return {};
        }
    });

    const saveSubCategoriesOrder = useCallback((newState) => {
        setSubCategoriesOrder(newState);
        localStorage.setItem('subCategoriesOrderStorage', JSON.stringify(newState));
    }, []);

    useEffect(() => {
        const savedSuperCategoryName = localStorage.getItem('openDropdownSuperCategory');
        if (savedSuperCategoryName) {
            const foundIndex = orderedCategories.findIndex(cat => cat === savedSuperCategoryName);
            if (foundIndex !== -1) {
                setActiveSuperCategory(foundIndex);
            }
        }
    }, [orderedCategories]);

    const handleOnDragEnd = (result) => {
        if (!result.destination) return;

        const { source, destination, type } = result;

        if (type === "CATEGORIES") {
            const reordered = Array.from(orderedCategories);
            const [moved] = reordered.splice(source.index, 1);
            reordered.splice(destination.index, 0, moved);

            setOrderedCategories(reordered);
            localStorage.setItem('categoryOrder', JSON.stringify(reordered));
        } else if (type.startsWith("SUBCATEGORIES")) {
            const superCat = type.replace("SUBCATEGORIES_", "");
            const subCatKey = encodeSuperCategoryKey(superCat);

            const currentOrder =
                subCategoriesOrder[subCatKey] ||
                getInitialSubcategoriesOrder(superCat, flashcards);

            const newOrder = Array.from(currentOrder);
            const [moved] = newOrder.splice(source.index, 1);
            newOrder.splice(destination.index, 0, moved);

            const updated = {
                ...subCategoriesOrder,
                [subCatKey]: newOrder
            };
            saveSubCategoriesOrder(updated);
        }
    };

    const getInitialSubcategoriesOrder = (superCat, allFlashcards) => {
        return allFlashcards
            .filter(fc => fc.superCategory === superCat)
            .map(fc => {
                const realCategory =
                    fc.category && fc.category.trim() !== "" ? fc.category : "Without category";
                return realCategory;
            })
            .filter((value, i, self) => self.indexOf(value) === i);
    };

    const handleActiveSuperCategory = (index) => {
        setActiveSuperCategory(activeSuperCategory === index ? null : index);
        const catName = orderedCategories[index];
        if (activeSuperCategory === index) {
            localStorage.setItem('openDropdownSuperCategory', '');
        } else {
            localStorage.setItem('openDropdownSuperCategory', catName);
        }
    };

    const ButtonOpenModalMainList = ({
                                         classes,
                                         aNameType,
                                         aNameNew,
                                         aNameOld,
                                         aToolsItemActive,
                                         aNameSuperCategory,
                                         aNameNewSuperCategory,
                                         index
                                     }) => (
        <button
            className={`btn--icon ${classes} ${(index === toolsItemActive) ? 'btn--active' : ''}`}
            onClick={() => {
                setNameType(aNameType);
                setOpenModalEdit(true);
                setNameNew(aNameNew);
                setNameOld(aNameOld);
                setToolsItemActive(aToolsItemActive);
                setNameSuperCategory(aNameSuperCategory);
                setNameNewSuperCategory(aNameNewSuperCategory);
            }}
            aria-label={t('edit_category')}
        >
            <i className="icon-pencil"></i>
        </button>
    );

    return (
        <DragDropContext onDragEnd={handleOnDragEnd}>
            <Droppable droppableId="categories" type="CATEGORIES">
                {(provided) => (
                    <ul
                        className="o-list-categories o-list-categories--edit"
                        {...provided.droppableProps}
                        ref={provided.innerRef}
                        dir="ltr"
                    >
                        <li className="o-button-add-flashcard">
                            <button
                                onClick={() => navigate('/create?addFirstOrLast=first&superCategory=')}
                                type="button"
                                className="justify-content-center"
                                aria-label={t('add_flashcard')}
                            >
                                <i className="icon-plus"></i>
                            </button>
                        </li>

                        {orderedCategories.map((cat, index) => {
                            const hasSubCategories = flashcards.some(fc => fc.superCategory === cat);

                            let count;
                            let knowCount;
                            if (cat === 'Without category') {
                                count = flashcards.filter(
                                    fc => (!fc.category || fc.category.trim() === '') && !fc.superCategory
                                ).length;
                                knowCount = flashcards.filter(
                                    fc => (!fc.category || fc.category.trim() === '') && !fc.superCategory && fc.know
                                ).length;
                            } else {
                                count = flashcards.filter(
                                    fc => fc.category === cat && !fc.superCategory
                                ).length;
                                knowCount = flashcards.filter(
                                    fc => fc.category === cat && fc.know && !fc.superCategory
                                ).length;
                            }

                            if (!hasSubCategories && count === 0) {
                                return null;
                            }

                            return (
                                <Draggable key={cat} draggableId={cat} index={index}>
                                    {(provided) => (
                                        <li
                                            ref={provided.innerRef}
                                            {...provided.draggableProps}
                                            {...provided.dragHandleProps}
                                            className={!hasSubCategories ? 'd-flex gap-1' : ''}
                                        >
                                            {hasSubCategories ? (
                                                <>
                                                    <div className="d-flex gap-1">
                                                        <ButtonOpenModalMainList
                                                            classes={'bg-color-brow'}
                                                            aNameType={'super-category'}
                                                            aNameNew={cat}
                                                            aNameOld={cat}
                                                            aToolsItemActive={index}
                                                            aNameSuperCategory={''}
                                                            aNameNewSuperCategory={''}
                                                            index={index}
                                                        />

                                                        {(() => {
                                                            const knowCountSuper = flashcards.filter(
                                                                fc => fc.know && fc.superCategory === cat
                                                            ).length;
                                                            const countSuper = flashcards.filter(
                                                                fc => fc.superCategory === cat
                                                            ).length;
                                                            const unknownCountSuper = countSuper - knowCountSuper;
                                                            const knowPercentageSuper = countSuper > 0
                                                                ? Math.ceil((knowCountSuper * 100) / countSuper)
                                                                : 0;

                                                            return (
                                                                <button
                                                                    className={
                                                                        "bg-color-brow btn-super-category " +
                                                                        (activeSuperCategory === index ? 'btn-super-category--active' : '')
                                                                    }
                                                                    onClick={() => handleActiveSuperCategory(index)}
                                                                >
                                  <span>
                                    <i
                                        className={
                                            activeSuperCategory === index
                                                ? 'icon-folder-open-empty'
                                                : 'icon-folder-empty'
                                        }
                                    ></i>{' '}
                                      {cat}{' '}
                                      (<strong>{knowCountSuper}</strong>/{countSuper})
                                      {unknownCountSuper > 0 ? (
                                          <>
                                              <sub className="bg-color-green">
                                                  {knowPercentageSuper}%
                                              </sub>
                                              <sup className="bg-color-red">
                                                  {unknownCountSuper}
                                              </sup>
                                          </>
                                      ) : (
                                          <sub className="o-category-complited bg-color-green vertical-center-count">
                                              <i className="icon-ok"></i>
                                          </sub>
                                      )}
                                  </span>
                                                                </button>
                                                            );
                                                        })()}
                                                    </div>

                                                    {activeSuperCategory === index && (
                                                        <Droppable
                                                            droppableId={`subCategories__${cat}`}
                                                            type={`SUBCATEGORIES_${cat}`}
                                                        >
                                                            {(subProvided) => {
                                                                const subCatKey = encodeSuperCategoryKey(cat);
                                                                const userDefinedOrder =
                                                                    subCategoriesOrder[subCatKey] ||
                                                                    getInitialSubcategoriesOrder(cat, flashcards);

                                                                return (
                                                                    <ul
                                                                        className="o-list-categories"
                                                                        ref={subProvided.innerRef}
                                                                        {...subProvided.droppableProps}
                                                                    >
                                                                        <li className="o-button-add-flashcard">
                                                                            <button
                                                                                onClick={() =>
                                                                                    navigate(`/create?addFirstOrLast=first&superCategory=${cat}`)
                                                                                }
                                                                                type="button"
                                                                                className="justify-content-center color-green-strong-dark btn--cream"
                                                                            >
                                                                                <i className="icon-plus"></i>
                                                                            </button>
                                                                        </li>
                                                                        {userDefinedOrder.map((subCat, subIndex) => {
                                                                            const subCatCount = flashcards.filter(fc => {
                                                                                const realCategory =
                                                                                    fc.category && fc.category.trim() !== ""
                                                                                        ? fc.category
                                                                                        : 'Without category';
                                                                                return (
                                                                                    realCategory === subCat &&
                                                                                    fc.superCategory === cat
                                                                                );
                                                                            }).length;

                                                                            const knowSubCatCount = flashcards.filter(fc => {
                                                                                const realCategory =
                                                                                    fc.category && fc.category.trim() !== ""
                                                                                        ? fc.category
                                                                                        : 'Without category';
                                                                                return (
                                                                                    realCategory === subCat &&
                                                                                    fc.superCategory === cat &&
                                                                                    fc.know
                                                                                );
                                                                            }).length;

                                                                            return (
                                                                                <Draggable
                                                                                    key={subCat}
                                                                                    draggableId={`${cat}--${subCat}`}
                                                                                    index={subIndex}
                                                                                >
                                                                                    {(subDragProvided) => (
                                                                                        <li
                                                                                            className="d-flex gap-1"
                                                                                            ref={subDragProvided.innerRef}
                                                                                            {...subDragProvided.draggableProps}
                                                                                            {...subDragProvided.dragHandleProps}
                                                                                        >
                                                                                            <ButtonOpenModalMainList
                                                                                                classes={'bg-color-cream color-green-strong-dark'}
                                                                                                aNameType={'category-inside-super-category'}
                                                                                                aNameNew={subCat}
                                                                                                aNameOld={subCat}
                                                                                                aToolsItemActive={subCat}
                                                                                                aNameSuperCategory={cat}
                                                                                                aNameNewSuperCategory={cat}
                                                                                                index={index}
                                                                                            />

                                                                                            <button
                                                                                                className={
                                                                                                    "btn bg-color-cream color-green-strong-dark " +
                                                                                                    (
                                                                                                        selectedCategory === subCat &&
                                                                                                        selectedSuperCategory === cat
                                                                                                            ? 'btn--active'
                                                                                                            : ''
                                                                                                    )
                                                                                                }
                                                                                                onClick={() => {
                                                                                                    setSelectedCategory(subCat);
                                                                                                    setSelectedSuperCategory(cat);
                                                                                                    setSelectedCards([]);
                                                                                                    topScroll();
                                                                                                }}
                                                                                            >
                                                <span>
                                                  <i className="icon-wrench"></i>{' '}
                                                    {subCat === 'Without category'
                                                        ? t('without_category')
                                                        : subCat}{' '}
                                                    (<strong>
                                                    {knowSubCatCount}
                                                  </strong>/{subCatCount})
                                                    {subCatCount - knowSubCatCount > 0 ? (
                                                        <>
                                                            <sub className="bg-color-green">
                                                                {Math.ceil((knowSubCatCount * 100) / subCatCount)}%
                                                            </sub>
                                                            <sup className="bg-color-red">
                                                                {subCatCount - knowSubCatCount}
                                                            </sup>
                                                        </>
                                                    ) : (
                                                        <sub
                                                            className="o-category-complited bg-color-green vertical-center-count"
                                                        >
                                                            <i className="icon-ok"></i>
                                                        </sub>
                                                    )}
                                                </span>
                                                                                            </button>
                                                                                            <span
                                                                                                className="o-list-categories__move">{t('move')}</span>
                                                                                        </li>
                                                                                    )}
                                                                                </Draggable>
                                                                            );
                                                                        })}
                                                                        <li className="o-button-add-flashcard">
                                                                            <button
                                                                                onClick={() =>
                                                                                    navigate(`/create?addFirstOrLast=last&superCategory=${cat}`)
                                                                                }
                                                                                type="button"
                                                                                className="justify-content-center color-green-strong-dark btn--cream"
                                                                            >
                                                                                <i className="icon-plus"></i>
                                                                            </button>
                                                                        </li>
                                                                        {subProvided.placeholder}
                                                                    </ul>
                                                                );
                                                            }}
                                                        </Droppable>
                                                    )}
                                                </>
                                            ) : (
                                                <>
                                                    <ButtonOpenModalMainList
                                                        classes={''}
                                                        aNameType={'category-without-super-category'}
                                                        aNameNew={cat}
                                                        aNameOld={cat}
                                                        aToolsItemActive={index}
                                                        aNameSuperCategory={''}
                                                        aNameNewSuperCategory={''}
                                                        index={index}
                                                    />
                                                    <button
                                                        className={
                                                            "btn " +
                                                            (
                                                                selectedCategory === cat &&
                                                                selectedSuperCategory === null
                                                                    ? 'btn--active'
                                                                    : ''
                                                            )
                                                        }
                                                        onClick={() => {
                                                            setSelectedCategory(cat);
                                                            setSelectedSuperCategory(null);
                                                            setSelectedCards([]);
                                                            topScroll();
                                                        }}
                                                    >
                            <span>
                              <i className="icon-wrench"></i>{' '}
                                {cat === 'Without category'
                                    ? t('without_category')
                                    : cat}{' '}
                                (<strong>
                                {knowCount}
                              </strong>/{count})
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
                                            )}
                                            <span className="o-list-categories__move">{t('move')}</span>
                                        </li>
                                    )}
                                </Draggable>
                            );
                        })}
                        <li className="o-button-add-flashcard">
                            <button
                                onClick={() => navigate('/create?addFirstOrLast=last&superCategory=')}
                                type="button"
                                className="justify-content-center"
                                aria-label={t('add_flashcard')}
                            >
                                <i className="icon-plus"></i>
                            </button>
                        </li>
                        {provided.placeholder}
                    </ul>
                )}
            </Droppable>
        </DragDropContext>
    );
};

export default CategoryListDragDrop;

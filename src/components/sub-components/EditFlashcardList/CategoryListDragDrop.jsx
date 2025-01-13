// CategoryListDragDrop.jsx

import { useNavigate } from 'react-router-dom';
import React, { useContext, useState, useEffect } from "react";
import { DragDropContext, Draggable, Droppable } from "@hello-pangea/dnd";
import { topScroll } from "../../../utils/topScroll";
import { useTranslation } from 'react-i18next';
import { FlashcardContext } from '../../../context/FlashcardContext';

const CategoryListDragDrop = ({
                                  setCategoriesInSuperCategoryCount,
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
    const {
        flashcards,
        orderedCategories,
        setOrderedCategories
    } = useContext(FlashcardContext);

    const navigate = useNavigate();

    const [activeSuperCategory, setActiveSuperCategory] = useState(null);

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

        const reorderedCategories = Array.from(orderedCategories);
        const [movedCategory] = reorderedCategories.splice(result.source.index, 1);
        reorderedCategories.splice(result.destination.index, 0, movedCategory);

        setOrderedCategories(reorderedCategories);
        localStorage.setItem('categoryOrder', JSON.stringify(reorderedCategories));
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
                                     }) => {
        return (
            <button
                className={`btn--icon ${classes} ${index === toolsItemActive ? 'btn--active' : ''}`}
                onClick={() => {
                    setNameType(aNameType);
                    setOpenModalEdit(true);
                    setNameNew(aNameNew);
                    setNameOld(aNameOld);
                    setToolsItemActive(aToolsItemActive);
                    setNameSuperCategory(aNameSuperCategory);
                    setNameNewSuperCategory(aNameNewSuperCategory);
                }}
            >
                <i className="icon-pencil"></i>
            </button>
        );
    };

    return (
        <DragDropContext onDragEnd={handleOnDragEnd}>
            <Droppable droppableId="categories">
                {(provided) => (
                    <ul
                        className="o-list-categories o-list-categories--edit"
                        {...provided.droppableProps}
                        ref={provided.innerRef}
                    >
                        <li className="o-button-add-flashcard">
                            <button
                                onClick={() => navigate('/create?superCategory=')}
                                type="button"
                                className="justify-content-center"
                            >
                                <i className="icon-plus"></i>
                            </button>
                        </li>

                        {orderedCategories.map((cat, index) => {
                            const hasSubCategories = flashcards.some(fc => fc.superCategory === cat);

                            let count;
                            let knowCount;

                            if (cat === 'Without category') {
                                count = flashcards.filter(fc =>
                                    (!fc.category || fc.category.trim() === '') && !fc.superCategory
                                ).length;
                                knowCount = flashcards.filter(fc =>
                                    (!fc.category || fc.category.trim() === '') &&
                                    !fc.superCategory &&
                                    fc.know
                                ).length;
                            } else {
                                count = flashcards.filter(fc =>
                                    fc.category === cat && !fc.superCategory
                                ).length;
                                knowCount = flashcards.filter(fc =>
                                    fc.category === cat &&
                                    fc.know &&
                                    !fc.superCategory
                                ).length;
                            }

                            if (!hasSubCategories && count === 0) {
                                return null;
                            }

                            return (
                                <Draggable key={cat} draggableId={cat} index={index}>
                                    {(provided) => (
                                        <li
                                            key={index}
                                            ref={provided.innerRef}
                                            {...provided.draggableProps}
                                            {...provided.dragHandleProps}
                                            className={!hasSubCategories ? 'd-flex gap-1' : ''}
                                        >
                                            {hasSubCategories ? (
                                                <>
                                                    {/* Edycja superkategorii */}
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
                                                                        (activeSuperCategory === index
                                                                            ? 'btn-super-category--active'
                                                                            : '')
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
                                      (<strong className="color-black">{knowCountSuper}</strong>/{countSuper})
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
                                                        <ul className="o-list-categories">
                                                            {flashcards
                                                                .filter(fc => fc.superCategory === cat)
                                                                .map(fc => {
                                                                    const realCategory = (fc.category && fc.category.trim() !== "")
                                                                        ? fc.category
                                                                        : 'Without category';
                                                                    return realCategory;
                                                                })
                                                                // Usunięcie duplikatów
                                                                .filter((value, i, self) => self.indexOf(value) === i)
                                                                .map(subCat => {
                                                                    // Zliczanie fiszek, które mają superCategory == cat
                                                                    // i category == subCat (lub 'Without category'):
                                                                    const subCatCount = flashcards.filter(fc => {
                                                                        const realCategory = (fc.category && fc.category.trim() !== "")
                                                                            ? fc.category
                                                                            : 'Without category';
                                                                        return (
                                                                            realCategory === subCat &&
                                                                            fc.superCategory === cat
                                                                        );
                                                                    }).length;

                                                                    const knowSubCatCount = flashcards.filter(fc => {
                                                                        const realCategory = (fc.category && fc.category.trim() !== "")
                                                                            ? fc.category
                                                                            : 'Without category';
                                                                        return (
                                                                            realCategory === subCat &&
                                                                            fc.superCategory === cat &&
                                                                            fc.know
                                                                        );
                                                                    }).length;

                                                                    return (
                                                                        <li className="d-flex gap-1" key={subCat}>
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
                                                : subCat} (
                                          <strong className="color-green-dark">
                                            {knowSubCatCount}
                                          </strong>
                                          /{subCatCount})
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
                                                                        </li>
                                                                    );
                                                                })}
                                                            <li className="o-button-add-flashcard">
                                                                <button
                                                                    onClick={() => navigate(`/create?superCategory=${cat}`)}
                                                                    type="button"
                                                                    className="justify-content-center color-green-strong-dark btn--cream"
                                                                >
                                                                    <i className="icon-plus"></i>
                                                                </button>
                                                            </li>
                                                        </ul>
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
                                    : cat} (
                              <strong className="color-green-dark">
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
                                    <sub className="o-category-complited bg-color-green vertical-center-count">
                                        <i className="icon-ok"></i>
                                    </sub>
                                )}
                            </span>
                                                    </button>
                                                </>
                                            )}
                                            <span className="o-list-categories__move">Move</span>
                                        </li>
                                    )}
                                </Draggable>
                            );
                        })}
                        {provided.placeholder}
                    </ul>
                )}
            </Droppable>
        </DragDropContext>
    );
};

export default CategoryListDragDrop;

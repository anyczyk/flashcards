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

    const { t } = useTranslation(); // Hook do tłumaczeń
    const {
        flashcards,
        orderedCategories,
        setOrderedCategories
    } = useContext(FlashcardContext);

    const navigate = useNavigate();

    // Stan określający indeks aktualnie otwartej superkategorii (folderu).
    const [activeSuperCategory, setActiveSuperCategory] = useState(null);

    // PRZY PIERWSZYM RENDERZE wczytujemy z localStorage, jaka superkategoria była otwarta
    // i ustawiamy activeSuperCategory, aby została automatycznie otwarta.
    useEffect(() => {
        const savedSuperCategoryName = localStorage.getItem('openDropdownSuperCategory');
        if (savedSuperCategoryName) {
            // Sprawdzamy, czy w orderedCategories istnieje taki "cat"
            // i pobieramy jego index:
            const foundIndex = orderedCategories.findIndex(cat => cat === savedSuperCategoryName);
            if (foundIndex !== -1) {
                setActiveSuperCategory(foundIndex);
            }
        }
    }, [orderedCategories]);

    // Funkcja wywoływana po zakończeniu "Drag & Drop"
    const handleOnDragEnd = (result) => {
        if (!result.destination) return;

        const reorderedCategories = Array.from(orderedCategories);
        const [movedCategory] = reorderedCategories.splice(result.source.index, 1);
        reorderedCategories.splice(result.destination.index, 0, movedCategory);

        setOrderedCategories(reorderedCategories);
        localStorage.setItem('categoryOrder', JSON.stringify(reorderedCategories));
    };

    // Funkcja otwierająca/zamykająca superkategorię (folder).
    const handleActiveSuperCategory = (index) => {
        // Jeżeli klikamy już otwartą superkategorię, to ją zamykamy (ustawiamy null),
        // w przeciwnym razie otwieramy tę nową:
        setActiveSuperCategory(activeSuperCategory === index ? null : index);

        // Zapisanie do localStorage nazwy superkategorii (lub pustej, jeśli zamykamy):
        const catName = orderedCategories[index];
        if (activeSuperCategory === index) {
            // Była już otwarta, więc ją zamykamy:
            localStorage.setItem('openDropdownSuperCategory', '');
        } else {
            localStorage.setItem('openDropdownSuperCategory', catName);
        }
    };

    // Przycisk do otwierania modala z edycją
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
                        {/* Przyciski dodawania fiszek (globalnie, na górze listy) */}
                        <li className="o-button-add-flashcard">
                            <button
                                onClick={() => navigate('/create?superCategory=')}
                                type="button"
                                className="justify-content-center"
                            >
                                <i className="icon-plus"></i>
                            </button>
                        </li>

                        {/* Renderowanie poszczególnych kategorii z orderedCategories */}
                        {orderedCategories.map((cat, index) => {
                            // Czy jest to "super-kategoria" (czyli czy istnieją fiszki z superCategory == cat)?
                            const hasSubCategories = flashcards.some(fc => fc.superCategory === cat);

                            // Liczba fiszek w danej kategorii (bez superCategory):
                            let count;
                            let knowCount;

                            if (cat === 'Without category') {
                                // Fiszki całkowicie bez kategorii i bez superCategory:
                                count = flashcards.filter(fc =>
                                    (!fc.category || fc.category.trim() === '') && !fc.superCategory
                                ).length;
                                knowCount = flashcards.filter(fc =>
                                    (!fc.category || fc.category.trim() === '') &&
                                    !fc.superCategory &&
                                    fc.know
                                ).length;
                            } else {
                                // Fiszki z category == cat, ale bez superCategory:
                                count = flashcards.filter(fc =>
                                    fc.category === cat && !fc.superCategory
                                ).length;
                                knowCount = flashcards.filter(fc =>
                                    fc.category === cat &&
                                    fc.know &&
                                    !fc.superCategory
                                ).length;
                            }

                            // *** POPRAWKA ***
                            // Jeśli dana kategoria:
                            //  - nie jest superkategorią (hasSubCategories === false)
                            //  - i nie ma żadnych fiszek (count === 0)
                            // => pomijamy renderowanie tej pozycji (zwracamy null).
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
                                            // Jeśli brak podkategorii, to wyświetlamy przyciski w jednej linii:
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

                                                        {/* Wyliczenie stanu wiedzy dla wszystkich fiszek w superkategorii */}
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

                                                    {/* Podlista kategorii wewnątrz superkategorii (jeśli folder otwarty) */}
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
                                                // Jeśli NIE ma subkategorii, to wyświetlamy kategorię w głównej liście (tylko gdy count > 0).
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

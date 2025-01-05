// EditFlashcardList.jsx
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import cardsExport from '../utils/cardsExport';
import { Link } from "react-router-dom";
import { loadLanguages } from '../utils/loadLanguages';
import SelectCodeLanguages from './sub-components/SelectCodeLanguages';
import {
    DragDropContext,
    Droppable,
    Draggable,
} from '@hello-pangea/dnd';
import { topScroll } from "../utils/topScroll";
import BrowserSearchAndTools from "./sub-components/BrowserSearchAndTools";
import useWcagModal from '../hooks/useWcagModal';

function EditFlashcardList({ flashcards, removeFlashcard, editFlashcard, categories, loadData, setPreloader, preloader }) {
    const { t, i18n } = useTranslation(); // Hook translation
    const [editMode, setEditMode] = useState(null);
    const [editFront, setEditFront] = useState('');
    const [editBack, setEditBack] = useState('');
    const [editCategory, setEditCategory] = useState('');
    const [editSuperCategory, setEditSuperCategory] = useState('');
    const [editKnow, setEditKnow] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [selectedSuperCategory, setSelectedSuperCategory] = useState(null); // Nowy stan
    const [selectedCards, setSelectedCards] = useState([]);
    const [editFrontLang, setEditFrontLang] = useState('');
    const [editBackLang, setEditBackLang] = useState('');

    const modalRef = useRef(null);

    // superCategory dropdown
    const [activeSuperCategory, setActiveSuperCategory] = useState(null);

    /* edit categories */
    const [openModalEdit, setOpenModalEdit] = useState(false);

    const [nameOld, setNameOld] = useState('');
    const [nameNew, setNameNew] = useState('');

    const [nameSuperCategory, setNameSuperCategory] = useState('');

    const[nameNewSuperCategory, setNameNewSuperCategory] = useState('');

    const [nameType, setNameType] = useState('');

    const [confirmRemove, setConfirmRemove] = useState(false);

    const [toolsItemActive, setToolsItemActive] = useState(null);

    const [globalRestart,setGlobalRestart ] = useState(false);
    const [globalRemove, setGlobalRemove] = useState(false);

    /* end edit */

    const [availableLanguages, setAvailableLanguages] = useState([]);
    const [orderedCategories, setOrderedCategories] = useState([]);

    const [visibleModalSingle, setVisibleModalSingle] = useState({});

    const showModalConfirmRemove = (id) => {
        setVisibleModalSingle((prevState) => ({
            ...prevState,
            [id]: !prevState[id], // toggle
        }));
    };

    useEffect(() => {
        const fetchLanguages = async () => {
            try {
                const languages = await loadLanguages();
                setAvailableLanguages(languages);
            } catch (error) {
                console.error("Error loading languages:", error);
                setAvailableLanguages(['en-US']);
            }
        };

        fetchLanguages();
    }, []);

    useEffect(() => {
        // Inicjalizacja orderedCategories na podstawie props.categories i zapisanej kolejności
        const loadCategoryOrder = () => {
            const savedOrder = localStorage.getItem('categoryOrder');
            if (savedOrder) {
                const orderIds = JSON.parse(savedOrder);
                // Zakładając, że kategorie są unikalnymi nazwami lub identyfikatorami
                const ordered = orderIds
                    .map(id => categories.find(cat => cat === id))
                    .filter(cat => cat !== undefined);
                // Dodaj kategorie, które mogły zostać dodane później
                const remaining = categories.filter(cat => !orderIds.includes(cat));
                return [...ordered, ...remaining];
            }
            return categories;
        };
        setOrderedCategories(loadCategoryOrder());
    }, [categories]);

    const handleOnDragEnd = (result) => {
        if (!result.destination) return;

        const reorderedCategories = Array.from(orderedCategories);
        const [movedCategory] = reorderedCategories.splice(result.source.index, 1);
        reorderedCategories.splice(result.destination.index, 0, movedCategory);

        setOrderedCategories(reorderedCategories);
        localStorage.setItem('categoryOrder', JSON.stringify(reorderedCategories));
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

    const cancelEditing = () => {
        setEditMode(null);
        setEditFront('');
        setEditBack('');
        setEditCategory('');
        setEditKnow(false);
        setEditFrontLang('');
        setEditBackLang('');
        setEditSuperCategory('');
    };

    const submitEdit = (id) => {
        if (editFront.trim() && editBack.trim()) {
            const finalKnow = editKnow ? true : undefined;
            editFlashcard(id, editFront, editBack, editCategory.trim(), finalKnow, editFrontLang.trim(), editBackLang.trim(), editSuperCategory.trim());
            cancelEditing();
        }
    };

    // ----------------------
    //  Filtrowanie fiszek
    // ----------------------
    const filteredFlashcards = useMemo(() => {
        let filtered = [];

        if (selectedSuperCategory !== null && selectedCategory !== null) {
            // Jeśli wybrano superCategory i subcategory, filtrujemy fiszki z oboma warunkami
            filtered = flashcards.filter(fc =>
                fc.superCategory === selectedSuperCategory && fc.category === selectedCategory
            );
        } else if (selectedSuperCategory !== null) {
            // Jeśli wybrano tylko superCategory, filtrujemy fiszki z tą superCategory
            filtered = flashcards.filter(fc => fc.superCategory === selectedSuperCategory);
        } else if (selectedCategory === 'All') {
            filtered = [...flashcards];
        } else if (selectedCategory === 'Without category') {
            // [Zmiana] Tylko fiszki, które nie mają category i nie mają superCategory
            filtered = flashcards.filter(fc =>
                (!fc.category || fc.category.trim() === '') && !fc.superCategory
            );
        } else {
            // Jeśli wybrano kategorię bez superCategory, filtrujemy fiszki z tą kategorią i bez superCategory
            filtered = flashcards.filter(fc => fc.category === selectedCategory && !fc.superCategory);
        }

        return filtered;
    }, [selectedCategory, selectedSuperCategory, flashcards]);

    const toggleSelectCard = (cardId) => {
        setSelectedCards(prev => {
            if (prev.includes(cardId)) {
                return prev.filter(id => id !== cardId);
            } else {
                return [...prev, cardId];
            }
        });
    };

    const removeSelectedCards = () => {
        selectedCards.forEach(id => removeFlashcard(id));
        setSelectedCards([]);
    };

    const copySelectedCards = () => {
        const cardsToCopy = flashcards.filter(fc => selectedCards.includes(fc.id));
        const jsonData = JSON.stringify(cardsToCopy, null, 2);
        navigator.clipboard.writeText(jsonData).then(() => {
            alert("Skopiowano wybrane fiszki do schowka!");
        });
    };

    const handleExport = async () => {
        try {
            const cardsToExport = flashcards.filter(fc => selectedCards.includes(fc.id));
            await cardsExport(cardsToExport);
        } catch (error) {
            console.error("Błąd podczas eksportu fiszek:", error);
            alert("Wystąpił błąd podczas eksportu fiszek.");
        }
    };

    const selectAll = () => {
        const allVisibleIds = filteredFlashcards.map(fc => fc.id);
        setSelectedCards(allVisibleIds);
    };

    const deselectAll = () => {
        setSelectedCards([]);
    };

    const getFilteredFlashcardCount = useMemo(() => {
        return filteredFlashcards.length;
    }, [filteredFlashcards]);


    const handleQuickEdit = (newName) => {
        setNameNew(newName);
    };

    const handleQuickEditForSuperCategory = (newName) => {
          setNameNewSuperCategory(newName);
    };

    const cancelModal = () => {
        // reset states
        setNameNew('');
        setNameOld('');
        setNameType('');
        setNameSuperCategory('');
        setNameNewSuperCategory('');
        setConfirmRemove(false);
        setToolsItemActive(null);

        setGlobalRemove(false);
        setGlobalRestart(false);

        // close modal
        setOpenModalEdit(false);
    };

    useWcagModal(openModalEdit, cancelModal, modalRef);

    const handleQuickEditSave = async (type, action) => {
        setPreloader(true);
        const promises = flashcards.map(card => {
            if (type === 'super-category') {
                if (card.superCategory === nameOld) {
                    if (action === 'remove') {
                        return removeFlashcard(card.id);  // Zwracamy Promise
                    } else {
                        return editFlashcard(
                            card.id,
                            card.front,
                            card.back,
                            card.category,
                            (action === 'reset') ? '' : card.know,
                            card.langFront,
                            card.langBack,
                            (action === 'reset') ? card.superCategory : nameNew
                        ); // Zwracamy Promise
                    }
                }
            }
            else if (type === 'category-without-super-category') {
                if (card.category === nameOld && card.superCategory === '') {
                    if (action === 'remove') {
                        return removeFlashcard(card.id);
                    } else {
                        return editFlashcard(
                            card.id,
                            card.front,
                            card.back,
                            (action === 'reset') ? card.category : nameNew,
                            (action === 'reset') ? '' : card.know,
                            card.langFront,
                            card.langBack,
                            nameNewSuperCategory
                        );
                    }
                }
                else if (card.category === '' && card.superCategory === '' && nameOld === 'Without category') {
                    if (action === 'remove') {
                        return removeFlashcard(card.id);
                    } else {
                        return editFlashcard(
                            card.id,
                            card.front,
                            card.back,
                            card.category,
                            (action === 'reset') ? '' : card.know,
                            card.langFront,
                            card.langBack,
                            card.superCategory
                        );
                    }
                }
            }
            else if (type === 'category-inside-super-category') {
                if (card.category === nameOld && card.superCategory === nameSuperCategory) {
                    if (action === 'remove') {
                        return removeFlashcard(card.id);
                    } else {
                        return editFlashcard(
                            card.id,
                            card.front,
                            card.back,
                            (action === 'reset') ? card.category : nameNew,
                            (action === 'reset') ? '' : card.know,
                            card.langFront,
                            card.langBack,
                            nameNewSuperCategory
                        );
                    }
                }
            }
            else if (type === 'reset-all-flashcards') {
                return editFlashcard(
                    card.id,
                    card.front,
                    card.back,
                    card.category,
                    '',
                    card.langFront,
                    card.langBack,
                    card.superCategory
                );
            }

            // Jeśli żadne warunki nie są spełnione, nic nie robimy (zwrot "null" lub "undefined" – ale wtedy warto go odfiltrować niżej)
            return null;
        });

        // 2. Odfiltrowujemy ewentualne null/undefined (jeśli jakiś card nie wymaga operacji)
        const filteredPromises = promises.filter(Boolean);

        // 3. Czekamy aż *wszystkie* Promisy się wykonają (usuną / zedytują)
        await Promise.all(filteredPromises);

        // 4. Po zakończeniu wszystkich asynchronicznych operacji
        // aktualizujemy orderedCategories, localStorage itd.
        setOrderedCategories(prevCategories =>
            prevCategories.map(cat =>
                cat === nameOld ? nameNew : cat
            )
        );

        // Zapisujemy nową kolejność kategorii w localStorage
        const savedOrder = localStorage.getItem('categoryOrder');
        if (savedOrder) {
            const orderIds = JSON.parse(savedOrder).map(cat =>
                cat === nameOld ? nameNew : cat
            );
            localStorage.setItem('categoryOrder', JSON.stringify(orderIds));
        }

        // Clear states and close modal
        cancelModal();

        // 5. Tutaj możesz zwrócić lub wywołać alert (lub dowolną inną logikę).
        setPreloader(false);
    };

    const removeDatabase = () => {
        setPreloader(true);
        const request = indexedDB.deleteDatabase("flashcardsDB");

        request.onsuccess = () => {
            localStorage.removeItem("categoryOrder");
            setPreloader(false);
            cancelModal();
            loadData();
        };

        request.onerror = (event) => {
            setPreloader(false);
            alert(`Error deleting database: ${event.target.error}`);
            console.error("Error deleting database:", event.target.error);
        };

        request.onblocked = () => {
            // To zdarzenie jest wywoływane np. wtedy, gdy inna karta/okno
            // wciąż korzysta z danej bazy i blokuje jej usunięcie.
            console.warn("Database deletion blocked. Close other tabs using the database.");
        };
    };

    const handleActiveSuperCategory = (index) => {
        setActiveSuperCategory(activeSuperCategory === index ? null : index);
    };

    return (
        <div className="o-page-edit-flashcard-list">
            <h2>
                {t('edit_flashcards')}
                {selectedSuperCategory ? ` / ${selectedSuperCategory}` : ''}
                {(selectedCategory !== null) && (
                    <span> / {selectedCategory === 'All'
                        ? t('all')
                        : (selectedCategory === 'Without category'
                            ? t('without_category')
                            : selectedCategory)
                    } (
                        {getFilteredFlashcardCount})
                    </span>
                )}
            </h2>
            <hr />

            {(!(selectedCategory === null) && !(flashcards.length < 1)) &&
                <>
                    <p>
                        <button
                            onClick={() => {
                                setSelectedCategory(null);
                                setSelectedSuperCategory(null);
                                setSelectedCards([]);
                                cancelEditing();
                                topScroll();
                            }}
                        >
                            {t('choose_another_category')}
                        </button>
                    </p>
                    <hr/>
                </>
            }


            {(flashcards.length < 1) ? (
                <div className="o-no-flashcards">
                    <p>{t('no_flashcards')}</p>
                    <ul className="o-list-buttons-clear">
                        <li>
                            <Link className="btn" to="/create">
                                <i className="icon-plus"></i> {t('create_flashcard')}
                            </Link>
                        </li>
                        <li>
                            <Link className="btn" to="/import-export">
                                <i className="icon-export"></i> {t('import_export')}
                            </Link>
                        </li>
                    </ul>
                </div>
            ) : (
                <>
                    {(selectedCategory === null) ? (
                        <>
                            <ul className="o-list-buttons-clear o-list-buttons-clear--nowrap-columns o-default-box">
                                <li>
                                    <button onClick={() => {
                                        setOpenModalEdit(true);
                                        setGlobalRemove(true);
                                    }} className="btn--red"><i className="icon-trash-empty"></i> {t('remove_all_flashcards')}</button>
                                </li>
                                <li>
                                    <button onClick={() => {
                                        setOpenModalEdit(true);
                                        setGlobalRestart(true);
                                    }} className="btn--blue"><i class="icon-arrows-cw"></i> {t('reset_all_flashcard_progress')}</button>
                                </li>
                            </ul>

                            {!preloader &&
                                <DragDropContext onDragEnd={handleOnDragEnd}>
                                    <Droppable droppableId="categories">
                                        {(provided) => (
                                            <ul
                                                className="o-list-categories o-list-categories--edit"
                                                {...provided.droppableProps}
                                                ref={provided.innerRef}
                                            >
                                                {/* Przenieś 'All' poza listę Draggable */}
                                                <li>

                                                    <button
                                                        className={`btn ${
                                                            selectedCategory === 'All' &&
                                                            selectedSuperCategory === null
                                                                ? 'btn--active'
                                                                : ''
                                                        }`}
                                                        onClick={() => {
                                                            setSelectedCategory('All');
                                                            setSelectedSuperCategory(null);
                                                            setSelectedCards([]);
                                                            topScroll();
                                                        }}
                                                    >
                                                    <span>
                                                        {(() => {
                                                            const knowCount = flashcards.filter(fc => fc.know).length;
                                                            const count = flashcards.length;
                                                            const unknownCount = count - knowCount;
                                                            const knowPercentage = count > 0 ? Math.ceil((knowCount * 100) / count) : 0;
                                                            return (
                                                                <>
                                                                    <i className="icon-wrench"></i> {t('all')} (<strong className="color-green-dark">{knowCount}</strong>/{count})

                                                                    {unknownCount > 0 ? (
                                                                        <>
                                                                            <sub className="bg-color-green">
                                                                                {knowPercentage}%
                                                                            </sub>
                                                                            <sup className="bg-color-red">
                                                                                {unknownCount}
                                                                            </sup>
                                                                        </>
                                                                    ) : (
                                                                        <sub
                                                                            className="o-category-complited bg-color-green vertical-center-count">
                                                                            <i className="icon-ok"></i>
                                                                        </sub>
                                                                    )}
                                                                </>
                                                            );
                                                        })()}
                                                    </span>
                                                    </button>

                                                </li>
                                                {orderedCategories.map((cat, index) => {
                                                    // [Zmiana] Poprawiamy liczenie fiszek tak,
                                                    // aby 'Without category' brało pod uwagę brak category + brak superCategory.
                                                    let count;
                                                    let knowCount;

                                                    if (cat === 'Without category') {
                                                        count = flashcards.filter(fc =>
                                                            (!fc.category || fc.category.trim() === '') &&
                                                            !fc.superCategory
                                                        ).length;

                                                        knowCount = flashcards.filter(fc =>
                                                            (!fc.category || fc.category.trim() === '') &&
                                                            !fc.superCategory &&
                                                            fc.know
                                                        ).length;
                                                    } else {
                                                        // Liczymy tylko fiszki, które mają category === cat i nie mają superCategory
                                                        // (czyli takie, które nie są tak naprawdę subkategorią)
                                                        count = flashcards.filter(fc =>
                                                            fc.category === cat &&
                                                            !fc.superCategory
                                                        ).length;
                                                        knowCount = flashcards.filter(fc =>
                                                            fc.category === cat &&
                                                            fc.know &&
                                                            !fc.superCategory
                                                        ).length;
                                                    }

                                                    // Sprawdzamy, czy cat występuje jako superCategory
                                                    const hasSubcategories = flashcards.some(fc => fc.superCategory === cat);

                                                    return (
                                                        <Draggable key={cat} draggableId={cat} index={index}>
                                                            {(provided) => (
                                                                <li
                                                                    key={index}
                                                                    ref={provided.innerRef}
                                                                    {...provided.draggableProps}
                                                                    {...provided.dragHandleProps}
                                                                    className={!hasSubcategories ? 'd-flex gap-1' : ''}
                                                                >
                                                                    {hasSubcategories ? (
                                                                        <>
                                                                            <div className="d-flex gap-1">
                                                                                <button className={`btn--icon ${index === toolsItemActive ? 'btn--active' : '' }`}
                                                                                        onClick={() => {
                                                                                            setOpenModalEdit(true);
                                                                                            setNameNew(cat);
                                                                                            setNameOld(cat);
                                                                                            setNameSuperCategory('');
                                                                                            setToolsItemActive(index);
                                                                                            setNameType('super-category'); // category-without-super-category
                                                                                        }}>
                                                                                    <i className="icon-pencil"></i>
                                                                                </button>
                                                                                <button
                                                                                    // className="btn bg-color-brow btn-super-category btn-super-category--edit w-100"

                                                                                    className={`bg-color-brow btn-super-category ${
                                                                                        activeSuperCategory === index
                                                                                            ? 'btn-super-category--active'
                                                                                            : ''
                                                                                    }`}

                                                                                    onClick={() => {
                                                                                        handleActiveSuperCategory(index);
                                                                                    }}
                                                                                >
                                                                                    <span>
                                                                                       <i
                                                                                           className={
                                                                                               activeSuperCategory === index
                                                                                                   ? 'icon-folder-open-empty'
                                                                                                   : 'icon-folder-empty'
                                                                                           }
                                                                                       ></i>{' '} {cat}
                                                                                    </span>
                                                                                </button>
                                                                            </div>
                                                                            {activeSuperCategory === index && (
                                                                            <ul className="o-list-categories">
                                                                                {flashcards
                                                                                    .filter((fc, index) => fc.superCategory === cat)
                                                                                    .map(fc => fc.category)
                                                                                    .filter((value, i, self) => self.indexOf(value) === i)
                                                                                    .map(subcat => {
                                                                                        // Liczymy fiszki, które mają category === subcat i superCategory === cat
                                                                                        const subcatCount = flashcards.filter(fc =>
                                                                                            fc.category === subcat &&
                                                                                            fc.superCategory === cat
                                                                                        ).length;

                                                                                        const knowSubcatCount = flashcards.filter(fc =>
                                                                                            fc.category === subcat && fc.superCategory === cat && fc.know
                                                                                        ).length;

                                                                                        return (
                                                                                            <li className="d-flex gap-1"
                                                                                                key={subcat}>
                                                                                                <button
                                                                                                    className={`btn--icon ${subcat === toolsItemActive ? 'btn--active' : ''}`}
                                                                                                    onClick={() => {
                                                                                                        setOpenModalEdit(true);
                                                                                                        setNameNew(subcat);
                                                                                                        setNameOld(subcat);
                                                                                                        setNameSuperCategory(cat);
                                                                                                        setNameNewSuperCategory(cat);
                                                                                                        setToolsItemActive(subcat);
                                                                                                        setNameType('category-inside-super-category');
                                                                                                    }}>
                                                                                                    <i className="icon-pencil"></i>
                                                                                                </button>
                                                                                                <button
                                                                                                    className={`btn bg-color-cream color-green-strong-dark ${
                                                                                                        selectedCategory === subcat &&
                                                                                                        selectedSuperCategory === cat
                                                                                                            ? 'btn--active'
                                                                                                            : ''
                                                                                                    }`}
                                                                                                    onClick={() => {
                                                                                                        setSelectedCategory(subcat);
                                                                                                        setSelectedSuperCategory(cat);
                                                                                                        setSelectedCards([]);
                                                                                                        topScroll();
                                                                                                    }}
                                                                                                >
                                                                                                <span>
                                                                                                    <i className="icon-wrench"></i>{' '}
                                                                                                    {subcat === 'Without category'
                                                                                                        ? t('without_category')
                                                                                                        : subcat
                                                                                                    } (<strong className="color-green-dark">{knowSubcatCount}</strong>/{subcatCount})

                                                                                                    {subcatCount - knowSubcatCount > 0 ? (
                                                                                                        <>
                                                                                                            <sub className="bg-color-green">
                                                                                                                {Math.ceil(
                                                                                                                    (knowSubcatCount * 100) /
                                                                                                                    subcatCount
                                                                                                                )}
                                                                                                                %
                                                                                                            </sub>
                                                                                                            <sup className="bg-color-red">
                                                                                                                {subcatCount - knowSubcatCount}
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
                                                                                            </li>
                                                                                        );
                                                                                    })}
                                                                            </ul>
                                                                            )}
                                                                        </>
                                                                    ) : (
                                                                        count > 0 && (
                                                                            <>
                                                                                <button className={`btn--icon ${index === toolsItemActive ? 'btn--active' : ''}`}
                                                                                        onClick={() => {
                                                                                            setOpenModalEdit(true);
                                                                                            setNameNew(cat);
                                                                                            setNameOld(cat);
                                                                                            setNameSuperCategory('');
                                                                                            setNameNewSuperCategory('');
                                                                                            setNameType('category-without-super-category');
                                                                                            setToolsItemActive(index);
                                                                                        }}>
                                                                                    <i className="icon-pencil"></i>
                                                                                </button>
                                                                                <button
                                                                                    className={`btn ${
                                                                                        selectedCategory === cat &&
                                                                                        selectedSuperCategory === null
                                                                                            ? 'btn--active'
                                                                                            : ''
                                                                                    }`}
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
                                                                                        : cat
                                                                                    } (<strong className="color-green-dark">{knowCount}</strong>/{count})
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
                                                                        )
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
                            }

                        </>
                    ) : ''}

                    {openModalEdit ?
                        <div className="o-modal">
                            <div
                                className="o-modal__bg-cancel"
                                onClick={cancelModal}
                                type="button"
                                aria-label={t('cancel')}
                            />
                            <div
                                className="o-modal__container"
                                ref={modalRef}
                                role="dialog"
                                aria-modal="true"
                                aria-labelledby="modal-title"
                            >
                                {globalRestart || globalRemove ?
                                    <>
                                        {globalRestart &&
                                            <>
                                                <p>Are yous sure restart all fleshcards?</p>
                                                <ul className="o-list-buttons-clear">
                                                    <li>
                                                        <button onClick={() => {
                                                            handleQuickEditSave('reset-all-flashcards');
                                                        }} className="btn--blue"><i class="icon-arrows-cw"></i> {t('yes_reset')}
                                                        </button>
                                                    </li>
                                                    <li>
                                                        <button onClick={cancelModal}>
                                                            <i className="icon-cancel-circled"></i> {t('cancel')}
                                                        </button>
                                                    </li>
                                                </ul>
                                            </>
                                        }
                                        {globalRemove &&
                                            <>
                                                <p>Are yous sure remove all fleshcards?</p>
                                                <ul className="o-list-buttons-clear">
                                                    <li>
                                                        <button onClick={removeDatabase} className="btn--red"><i class="icon-trash-empty"></i> {t('yes_remove')}
                                                        </button>
                                                    </li>
                                                    <li>
                                                        <button onClick={cancelModal}>
                                                            <i className="icon-cancel-circled"></i> {t('cancel')}
                                                        </button>
                                                    </li>
                                                </ul>
                                            </>
                                        }
                                    </>
                                    :
                                    <>
                                    <h2 title={nameType === 'super-category' && t('super_category') ||
                                            nameType === 'category-without-super-category' && t('category_without_super_category') ||
                                            nameType === 'category-inside-super-category' && t('category_inside_super_category')}>{t('edit')}
                                        </h2>

                                        {(nameOld !== 'Without category') &&
                                            <>
                                                {(nameType === 'category-without-super-category' || nameType === 'category-inside-super-category') &&
                                                    <p>
                                                        <label
                                                            className="color-white"
                                                            htmlFor="edit-in-modal-super-category"
                                                        >
                                                            {t('super_category')}
                                                        </label>
                                                        <input
                                                            id="edit-in-modal-super-category"
                                                            type="text"
                                                            value={nameNewSuperCategory}
                                                            onChange={(e) =>
                                                                handleQuickEditForSuperCategory(e.target.value)
                                                            }
                                                        />
                                                    </p>
                                                }
                                                <p>
                                                    <label
                                                        className="color-white"
                                                        htmlFor="edit-in-modal-2"
                                                    >
                                                        {nameType === 'super-category' ? t('super_category') : t('category')}
                                                    </label>
                                                    <input
                                                        id="edit-in-modal-2"
                                                        type="text"
                                                        value={nameNew}
                                                        onChange={(e) =>
                                                            handleQuickEdit(e.target.value)
                                                        }
                                                    />
                                                </p>
                                            </>
                                        }
                                        <ul className="o-list-buttons-clear o-default-box">
                                            {(nameOld !== 'Without category') &&
                                                <li>
                                                    <button onClick={() => handleQuickEditSave(nameType)}>
                                                        <i className="icon-floppy-1"></i> {t('save')}
                                                    </button>
                                                </li>
                                            }
                                            <li>
                                                <button onClick={() => handleQuickEditSave(nameType, 'reset')}>
                                                    <i className="icon-arrows-cw"></i> {t('progress_reset')}
                                                </button>
                                            </li>
                                            <li>
                                                {confirmRemove ? <><p>{t('are_you_sure_delete')}</p>
                                                        <button className="btn--red"
                                                                onClick={() => handleQuickEditSave(nameType, 'remove')}>
                                                            <i className="icon-trash-empty"></i> {t('i_confirm_remove')}
                                                        </button>
                                                    </> :
                                                    <button onClick={() => setConfirmRemove(true)} className="btn--red"><i
                                                        className="icon-trash-empty"></i> {t('remove')}</button>}
                                            </li>
                                        </ul>
                                        <hr/>
                                        <button onClick={cancelModal}>
                                            <i className="icon-cancel-circled"></i> {t('cancel')}
                                        </button>
                                    </>
                                }
                            </div>
                        </div>
                        : ''}

                    {selectedCategory !== null && (
                        <>
                            {(filteredFlashcards.length > 0 || selectedCards.length > 0) && (
                                <BrowserSearchAndTools
                                    selectAll={selectAll}
                                    deselectAll={deselectAll}
                                    removeSelectedCards={removeSelectedCards}
                                    copySelectedCards={copySelectedCards}
                                    handleExport={handleExport}
                                    filteredFlashcards={filteredFlashcards}
                                    selectedCards={selectedCards}
                                />
                            )}
                            <hr/>
                            {filteredFlashcards.length > 0 && (
                                <ul className="o-list-edit-flashcards">
                                    {filteredFlashcards.map((card, index) => (
                                        <li className="o-card" key={card.id}>
                                            <ul className="o-list-buttons">
                                                {editMode === card.id ? (
                                                    <>
                                                        <li>
                                                            <button onClick={cancelEditing}>
                                                                <i className="icon-cancel-circled"></i> {t('cancel')}
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
                                                                                showModalConfirmRemove(index);
                                                                            }}
                                                                        >
                                                                            <i className="icon-trash-empty"></i> {t('i_confirm_remove')}
                                                                        </button>
                                                                    </li>
                                                                    <li>
                                                                        <button
                                                                            onClick={() =>
                                                                                showModalConfirmRemove(index)
                                                                            }
                                                                        >
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
                                                                        }
                                                                    }
                                                                >
                                                                    <i className="icon-trash-empty"></i> {t('remove')}
                                                                </button>
                                                            )}
                                                        </li>
                                                    </>
                                                )}
                                                <li className="ml-auto">
                                                    <input
                                                        type="checkbox"
                                                        checked={selectedCards.includes(card.id)}
                                                        onChange={() => toggleSelectCard(card.id)}
                                                    />
                                                </li>
                                            </ul>

                                            {editMode === card.id ? (
                                                <div className="o-card__content">
                                                    <p><strong>ID:</strong> {card.id}</p>
                                                    <hr/>
                                                    <p>
                                                        <label htmlFor={`o-edit-front-${card.id}`}>
                                                            {t('front')}:
                                                        </label>
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
                                                    <hr/>
                                                    <p>
                                                        <label htmlFor={`o-edit-back-${card.id}`}>
                                                            {t('back')}:
                                                        </label>
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
                                                    <hr/>
                                                    <p>
                                                        <label htmlFor={`o-edit-category-${card.id}`}>
                                                            {t('category')}:
                                                        </label>
                                                        <input
                                                            type="text"
                                                            value={editCategory}
                                                            onChange={(e) => setEditCategory(e.target.value)}
                                                            id={`o-edit-category-${card.id}`}
                                                        />
                                                    </p>
                                                    <hr/>
                                                    <p>
                                                        <label htmlFor={`o-edit-super-category-${card.id}`}>
                                                            {t('super_category')}:
                                                        </label>
                                                        <input
                                                            type="text"
                                                            value={editSuperCategory}
                                                            onChange={(e) => setEditSuperCategory(e.target.value)}
                                                            id={`o-edit-super-category-${card.id}`}
                                                        />
                                                    </p>
                                                    <hr/>
                                                    <p>
                                                        <label htmlFor={`o-edit-know-${card.id}`}>
                                                            {t('know')}:
                                                        </label>
                                                        &nbsp;
                                                        <input
                                                            type="checkbox"
                                                            checked={editKnow}
                                                            onChange={(e) => setEditKnow(e.target.checked)}
                                                            id={`o-edit-know-${card.id}`}
                                                        />
                                                    </p>
                                                    <hr/>
                                                    <p>
                                                        <button onClick={() => submitEdit(card.id)}>
                                                            <i className="icon-floppy-1"></i> {t('save')}
                                                        </button>
                                                    </p>
                                                </div>
                                            ) : (
                                                <div className="o-card__content">
                                                    <p><strong>ID:</strong> {card.id}</p>
                                                    <hr/>
                                                    <p>
                                                        <strong>{t('front')}:</strong>
                                                        <br/>
                                                        {card.front}
                                                    </p>
                                                    <p>
                                                        <strong>{t('language_code')}:</strong>{' '}
                                                        {card.langFront !== ''
                                                            ? card.langFront
                                                            : t('no_data')}
                                                    </p>
                                                    <hr/>
                                                    <p>
                                                        <strong>{t('back')}:</strong>
                                                        <br/>
                                                        {card.back}
                                                    </p>
                                                    <p>
                                                        <strong>{t('language_code')}:</strong>{' '}
                                                        {card.langBack !== ''
                                                            ? card.langBack
                                                            : t('no_data')}
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
                                                        {card.superCategory &&
                                                        card.superCategory.trim() !== ''
                                                            ? card.superCategory
                                                            : t('without_super_category')}
                                                    </p>
                                                    <hr/>
                                                    <p>
                                                        {card.know ? (
                                                            <strong className="color-green">
                                                                {t('already_known')}
                                                            </strong>
                                                        ) : (
                                                            <strong className="color-red">
                                                                {t('learning')}
                                                            </strong>
                                                        )}
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
                            )}
                        </>
                    )}
                </>
            )}
        </div>
    );
}

export default EditFlashcardList;

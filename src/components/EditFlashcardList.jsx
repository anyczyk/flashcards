// EditFlashcardList.jsx
import React, { useState, useMemo, useEffect } from 'react';
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

function EditFlashcardList({ flashcards, removeFlashcard, editFlashcard, categories }) {
    const { t, i18n } = useTranslation(); // Użyj hooka tłumaczenia
    const [editMode, setEditMode] = useState(null);
    const [editFront, setEditFront] = useState('');
    const [editBack, setEditBack] = useState('');
    const [editCategory, setEditCategory] = useState('');
    const [editKnow, setEditKnow] = useState(false);
    const [filterCategory, setFilterCategory] = useState(null);
    const [selectedCards, setSelectedCards] = useState([]);
    const [editFrontLang, setEditFrontLang] = useState('');
    const [editBackLang, setEditBackLang] = useState('');

    const [availableLanguages, setAvailableLanguages] = useState([]);
    const [orderedCategories, setOrderedCategories] = useState([]);

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
    };

    const cancelEditing = () => {
        setEditMode(null);
        setEditFront('');
        setEditBack('');
        setEditCategory('');
        setEditKnow(false);
        setEditFrontLang('');
        setEditBackLang('');
    };

    const submitEdit = (id) => {
        if (editFront.trim() && editBack.trim()) {
            const finalKnow = editKnow ? true : undefined;
            editFlashcard(id, editFront, editBack, editCategory.trim(), finalKnow, editFrontLang.trim(), editBackLang.trim());
            cancelEditing();
        }
    };

    const filteredFlashcards = useMemo(() => {
        if (filterCategory === 'All') return flashcards;
        if (filterCategory === 'Without category') {
            return flashcards.filter(fc => !fc.category || fc.category.trim() === '');
        }
        return flashcards.filter(fc => fc.category === filterCategory);
    }, [filterCategory, flashcards]);

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
            const cardsToExport = await flashcards.filter(fc => selectedCards.includes(fc.id));
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

    return (
        <div className="o-page-edit-flashcard-list">
            <h2>
                Flashcards (Edit Page)
                {(filterCategory !== null) && (
                    <span>
                        / {filterCategory === 'All' ? t('all') : (filterCategory === 'Without category' ? t('without_category') : filterCategory)} (
                        {
                            filterCategory === 'All'
                                ? flashcards.length
                                : filterCategory === 'Without category'
                                    ? flashcards.filter(fc => !fc.category || fc.category.trim() === '').length
                                    : filteredFlashcards.filter(fc => fc.category === filterCategory).length
                        })
                    </span>
                )}
            </h2>
            <hr />
            {(flashcards.length < 1) ?
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
                :
                <>
                    {(filterCategory === null) ? (
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
                                            <button onClick={() => setFilterCategory('All')}>
                                                <i className="icon-wrench"></i> {t('all')} ({flashcards.length})
                                            </button>
                                        </li>
                                        {orderedCategories.map((cat, index) => {
                                            let count;
                                            if (cat === 'Without category') {
                                                count = flashcards.filter(fc => !fc.category || fc.category.trim() === '').length;
                                            } else {
                                                count = flashcards.filter(fc => fc.category === cat).length;
                                            }

                                            return (
                                                <Draggable key={cat} draggableId={cat} index={index}>
                                                    {(provided) => (
                                                        <li
                                                            ref={provided.innerRef}
                                                            {...provided.draggableProps}
                                                            {...provided.dragHandleProps}
                                                        >
                                                            <button onClick={() => setFilterCategory(cat)}>
                                                                <i className="icon-wrench"></i> {(cat === 'Without category') ? t('without_category') : cat} ({count})
                                                            </button>
                                                            <div className="o-list-categories__move">Move</div>
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
                    ) : (
                        <p>
                            <button onClick={() => {
                                setFilterCategory(null);
                                setSelectedCards([]);
                                cancelEditing();
                            }}>
                                Wybierz inną kategorię
                            </button>
                        </p>
                    )}

                    {filterCategory !== null && (
                        <>
                            <hr />

                            {(filteredFlashcards.length > 0 || selectedCards.length > 0) &&
                                <ul className="o-list-buttons-3-cols">
                                    {filteredFlashcards.length > 0 && (
                                        <li>
                                            <button onClick={selectAll}>
                                                <i className="icon-ok-circled"></i> Zaznacz wszystkie
                                            </button>
                                        </li>
                                    )}
                                    {selectedCards.length > 0 && (
                                        <>
                                            <li>
                                                <button onClick={deselectAll}>
                                                    <i className="icon-ok-circled2"></i> Odznacz wszystkie
                                                </button>
                                            </li>
                                            <li>
                                                <button className="btn--red" onClick={removeSelectedCards}>
                                                    <i className="icon-trash-empty"></i> Usuń wybrane
                                                </button>
                                            </li>
                                            <li>
                                                <button onClick={copySelectedCards}>
                                                    <i className="icon-docs"></i> Kopiuj wybrane
                                                </button>
                                            </li>
                                            <li>
                                                <button onClick={handleExport}>
                                                    <i className="icon-export"></i> Export wybranych
                                                </button>
                                            </li>
                                        </>
                                    )}
                                </ul>
                            }

                            {(filteredFlashcards.length > 0) && (
                                <ul className="o-list-edit-flashcards">
                                    {filteredFlashcards.map(card => (
                                        <li key={card.id}>
                                            <ul className="o-list-buttons">
                                                {(editMode === card.id) ? (
                                                    <>
                                                        <li>
                                                            <button onClick={() => submitEdit(card.id)}>
                                                                <i className="icon-floppy-1"></i> Save
                                                            </button>
                                                        </li>
                                                        <li>
                                                            <button onClick={cancelEditing}>
                                                                <i className="icon-cancel-circled"></i> Cancel
                                                            </button>
                                                        </li>
                                                    </>
                                                ) : (
                                                    <>
                                                        <li>
                                                            <button onClick={() => startEditing(card)}>
                                                                <i className="icon-pencil"></i> Edit
                                                            </button>
                                                        </li>
                                                        <li>
                                                            <button className="btn--red" onClick={() => removeFlashcard(card.id)}>
                                                                <i className="icon-trash-empty"></i> Remove
                                                            </button>
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
                                                <div className="o-list-edit-flashcards__content">
                                                    <p>
                                                        <label htmlFor={`o-edit-front-${card.id}`}>Front:</label>
                                                        <textarea
                                                            value={editFront}
                                                            className="o-default-box"
                                                            onChange={(e) => setEditFront(e.target.value)}
                                                            rows="2" cols="30"
                                                            id={`o-edit-front-${card.id}`}
                                                        />

                                                        <label htmlFor={`o-edit-front-lang-${card.id}`}>Kod języka:</label>

                                                        <SelectCodeLanguages
                                                            availableLanguages={availableLanguages}
                                                            value={editFrontLang}
                                                            id={`o-edit-front-lang-${card.id}`}
                                                            setFunction={setEditFrontLang}
                                                        />
                                                    </p>
                                                    <hr/>
                                                    <p>
                                                        <label htmlFor={`o-edit-back-${card.id}`}>Back:</label>
                                                        <textarea
                                                            className="o-default-box"
                                                            value={editBack}
                                                            onChange={(e) => setEditBack(e.target.value)}
                                                            rows="2" cols="30"
                                                            id={`o-edit-back-${card.id}`}
                                                        />

                                                        <label htmlFor={`o-edit-back-lang-${card.id}`}>Kod języka:</label>

                                                        <SelectCodeLanguages
                                                            availableLanguages={availableLanguages}
                                                            value={editBackLang}
                                                            id={`o-edit-back-lang-${card.id}`}
                                                            setFunction={setEditBackLang}
                                                        />
                                                    </p>
                                                    <hr/>
                                                    <p>
                                                        <label htmlFor={`o-edit-category-${card.id}`}>Category:</label>
                                                        <input
                                                            type="text"
                                                            value={editCategory}
                                                            onChange={(e) => setEditCategory(e.target.value)}
                                                            id={`o-edit-category-${card.id}`}
                                                        />
                                                    </p>
                                                    <hr />
                                                    <p>
                                                        <label htmlFor={`o-edit-know-${card.id}`}>Know:</label>
                                                        <input
                                                            type="checkbox"
                                                            checked={editKnow}
                                                            onChange={(e) => setEditKnow(e.target.checked)}
                                                            id={`o-edit-know-${card.id}`}
                                                        />
                                                    </p>
                                                </div>
                                            ) : (
                                                <div className="o-list-edit-flashcards__content">
                                                    <p><strong>Front:</strong><br/>{card.front}</p>
                                                    <p>
                                                        <strong>Kod języka:</strong> {card.langFront !== '' ? card.langFront : 'Brak danych'}
                                                    </p>
                                                    <hr/>
                                                    <p><strong>Back:</strong><br/>{card.back}</p>
                                                    <p>
                                                        <strong>Kod języka:</strong> {card.langBack !== '' ? card.langBack : 'Brak danych'}
                                                    </p>
                                                    <hr/>
                                                    <p>
                                                        <strong>Category:</strong> {card.category && card.category.trim() !== '' ? card.category : 'Without category'}
                                                    </p>
                                                    <hr/>
                                                    <p>
                                                        {card.know ?
                                                            <strong className="color-green">Już to znam</strong> :
                                                            <strong className="color-red">Uczę się</strong>
                                                        }
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
            }
        </div>
    );
}

export default EditFlashcardList;

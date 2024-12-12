import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';

function EditFlashcardList({ flashcards, removeFlashcard, editFlashcard, categories }) {
    const { t, i18n } = useTranslation(); // Użyj hooka tłumaczenia
    const [editMode, setEditMode] = useState(null);
    const [editFront, setEditFront] = useState('');
    const [editBack, setEditBack] = useState('');
    const [editCategory, setEditCategory] = useState('');
    const [editKnow, setEditKnow] = useState(false);
    const [filterCategory, setFilterCategory] = useState(null);
    const [selectedCards, setSelectedCards] = useState([]);

    const startEditing = (card) => {
        setEditMode(card.id);
        setEditFront(card.front);
        setEditBack(card.back);
        setEditCategory(card.category || '');
        setEditKnow(card.know === true);
    };

    const cancelEditing = () => {
        setEditMode(null);
        setEditFront('');
        setEditBack('');
        setEditCategory('');
        setEditKnow(false);
    };

    const submitEdit = (id) => {
        if (editFront.trim() && editBack.trim()) {
            const finalKnow = editKnow ? true : undefined;
            editFlashcard(id, editFront, editBack, editCategory.trim(), finalKnow);
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

    const exportSelectedCards = () => {
        const cardsToImport = flashcards.filter(fc => selectedCards.includes(fc.id));
        const jsonData = JSON.stringify(cardsToImport, null, 2);

        const fileName = `index-db-part-${Date.now()}.json`;
        const blob = new Blob([jsonData], { type: 'application/json' });
        const url = URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        a.click();

        URL.revokeObjectURL(url);
    };

    const selectAll = () => {
        const allVisibleIds = filteredFlashcards.map(fc => fc.id);
        setSelectedCards(allVisibleIds);
    };

    const deselectAll = () => {
        setSelectedCards([]);
    };

    if (flashcards.length === 0) {
        return <div>No flashcards available. Add some!</div>;
    }

    return (
        <div>
            <h2>Flashcards (Edit Page)</h2>
            {(filterCategory === null) ? (
                <ul>
                    <li>
                        <button onClick={() => setFilterCategory('All')}>
                            {t('all')} ({flashcards.length})
                        </button>
                    </li>
                    {categories.map((cat) => {
                        let count;
                        if (cat === 'Without category') {
                            count = flashcards.filter(fc => !fc.category || fc.category.trim() === '').length;
                        } else {
                            count = flashcards.filter(fc => fc.category === cat).length;
                        }

                        return (
                            <li key={cat}>
                                <button onClick={() => setFilterCategory(cat)}>
                                    {/*{cat} ({count})*/}
                                    {(cat === 'Without category') ? t('without_category') : cat} ({count})
                                </button>
                            </li>
                        );
                    })}
                </ul>
            ) : (
                <div>
                    <button onClick={() => {
                        setFilterCategory(null);
                        setSelectedCards([]);
                        cancelEditing();
                    }}>
                        Wybierz inną kategorię
                    </button>
                </div>
            )}

            {filterCategory !== null && (
                <>
                    <h3>
                        {filterCategory === 'All' ? t('all') : (filterCategory === 'Without category' ? t('without_category') : filterCategory)} (
                        {
                            filterCategory === 'All'
                                ? flashcards.length
                                : filterCategory === 'Without category'
                                    ? flashcards.filter(fc => !fc.category || fc.category.trim() === '').length
                                    : filteredFlashcards.filter(fc => fc.category === filterCategory).length
                        })
                    </h3>
                    <hr/>

                    <div style={{marginBottom: '10px'}}>
                        {filteredFlashcards.length > 0 && (
                            <button onClick={selectAll} style={{marginRight: '10px'}}>
                                Zaznacz wszystkie
                            </button>
                        )}
                        {selectedCards.length > 0 && (
                            <>
                                <button onClick={deselectAll} style={{marginRight: '10px'}}>
                                    Odznacz wszystkie
                                </button>
                                <button onClick={removeSelectedCards} style={{marginRight: '10px'}}>Usuń wybrane
                                </button>
                                <button onClick={copySelectedCards} style={{marginRight: '10px'}}>Kopiuj wybrane
                                </button>
                                {/* Nowy przycisk Import */}
                                <button onClick={exportSelectedCards}>
                                    Export wybranych
                                </button>
                            </>
                        )}
                    </div>

                    <ul>
                        {filteredFlashcards.map(card => (
                            <li key={card.id} style={{marginBottom: '20px'}}>
                                <div>
                                    <input
                                        type="checkbox"
                                        checked={selectedCards.includes(card.id)}
                                        onChange={() => toggleSelectCard(card.id)}
                                        style={{marginRight: '10px'}}
                                    />
                                    {editMode === card.id ? (
                                        <div>
                                            <div>
                                                <label>Front:</label><br/>
                                                <textarea
                                                    value={editFront}
                                                    onChange={(e) => setEditFront(e.target.value)}
                                                    rows="2" cols="30"
                                                />
                                            </div>
                                            <div>
                                                <label>Back:</label><br/>
                                                <textarea
                                                    value={editBack}
                                                    onChange={(e) => setEditBack(e.target.value)}
                                                    rows="2" cols="30"
                                                />
                                            </div>
                                            <div>
                                                <label>Category:</label><br/>
                                                <input
                                                    type="text"
                                                    value={editCategory}
                                                    onChange={(e) => setEditCategory(e.target.value)}
                                                />
                                            </div>
                                            <div>
                                                <label>Know:</label>
                                                <input
                                                    type="checkbox"
                                                    checked={editKnow}
                                                    onChange={(e) => setEditKnow(e.target.checked)}
                                                />
                                            </div>
                                            <button onClick={() => submitEdit(card.id)}>Save</button>
                                            <button onClick={cancelEditing}>Cancel</button>
                                        </div>
                                    ) : (
                                        <div>
                                            <div className="fc-front"><strong>Front:</strong> {card.front}</div>
                                            <div className="fc-back"><strong>Back:</strong> {card.back}</div>
                                            <div className="fc-category">
                                                <strong>Category:</strong> {card.category && card.category.trim() !== '' ? card.category : 'Without category'}
                                            </div>
                                            <div className="fc-know">
                                                <p>{card.know ? 'Już to znam' : 'Ucze się'}</p>
                                            </div>
                                            <div>
                                                <button onClick={() => startEditing(card)}>Edit</button>
                                                <button onClick={() => removeFlashcard(card.id)}>Remove</button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </li>
                        ))}
                    </ul>
                </>
            )}
        </div>
    );
}

export default EditFlashcardList;

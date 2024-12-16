import React, { useState, useEffect } from 'react';

function CreateFlashcard({ addFlashcard, categories }) {
    const [front, setFront] = useState('');
    const [back, setBack] = useState('');
    const [category, setCategory] = useState('');
    const [flashcardCreated, setFlashcardCreated] = useState(false);

    const handleSubmit = (e) => {
        e.preventDefault();
        if(front.trim() && back.trim()) {
            let finalCategory = category.trim();
            if(finalCategory.toLowerCase() === 'Without category') {
                finalCategory = '';
            }

            addFlashcard(front, back, finalCategory);

            // Wyświetlenie komunikatu o utworzeniu fiszki
            setFlashcardCreated(true);

            // Reset pól front i back
            setFront('');
            setBack('');
        }
    };

    const handleCategorySelect = (e) => {
        const selected = e.target.value;
        if (selected) {
            setCategory(selected);
        } else {
            setCategory('');
        }
    };

    // Automatyczne ukrycie komunikatu po np. 3 sekundach
    useEffect(() => {
        let timer;
        if (flashcardCreated) {
            timer = setTimeout(() => {
                setFlashcardCreated(false);
            }, 3000);
        }
        return () => clearTimeout(timer);
    }, [flashcardCreated]);

    // Filtrowanie kategorii, aby nie pokazywać "Without category"
    const filteredCategories = categories.filter(cat => cat.toLowerCase() !== 'Without category');

    return (
        <div className="o-page-create-flashcard">
            <h2>Create a new Flashcard</h2>
            <hr/>
            {flashcardCreated && <p className="color-green">Fiszka utworzona!</p>}
            <form onSubmit={handleSubmit}>
                <p>
                    <label for="o-front">Front:</label>
                    <textarea
                        value={front}
                        onChange={(e) => setFront(e.target.value)}
                        rows="3"
                        cols="30"
                        id="o-front"
                    />
                </p>
                <hr/>
                <p>
                    <label for="o-back">Back:</label>
                    <textarea
                        value={back}
                        onChange={(e) => setBack(e.target.value)}
                        rows="3"
                        cols="30"
                        id="o-back"
                    />
                </p>
                <hr/>
                <p>
                    <label for="o-category">Category (choose existing or type new):</label><br/>
                    <select id="o-category" onChange={handleCategorySelect} value={category ? category : ''}>
                        <option value="">-- Select existing category --</option>
                        {filteredCategories.map((cat, index) => (
                            <option key={index} value={cat}>{cat}</option>
                        ))}
                    </select>
                </p>
                <p>
                    <input
                        type="text"
                        placeholder="Type a new category or edit selected one"
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                    />
                </p>
                <hr/>
                <button type="submit" disabled={!front.trim() || !back.trim()}>
                    Add Flashcard
                </button>
            </form>
        </div>
    );
}

export default CreateFlashcard;

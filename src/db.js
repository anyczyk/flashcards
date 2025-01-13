// db.js
import { openDB } from 'idb';

const DB_NAME = 'flashcardsDB';
const STORE_NAME = 'flashcards';
const DB_VERSION = 18;

let uniqueCounter = 0;

function generateSequentialID() {
    const now = Date.now();
    uniqueCounter++;
    return `${now}-${uniqueCounter}`;
}

export async function initDB() {
    const db = await openDB(DB_NAME, DB_VERSION, {
        upgrade(db) {
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                const store = db.createObjectStore(STORE_NAME, {
                    keyPath: 'id'
                });
                store.createIndex('category', 'category', { unique: false });
            }
        }
    });
    return db;
}

export async function getAllFlashcards() {
    const db = await initDB();
    return await db.getAll(STORE_NAME);
}

export async function addFlashcardToDB({ front, back, category, know = undefined, langFront = 'en-US', langBack = 'en-US', superCategory }) {
    const db = await initDB();
    const id = generateSequentialID();
    const flashcard = { id, front, back, category, know, langFront, langBack, superCategory };
    try {
        await db.put(STORE_NAME, flashcard);
    } catch (error) {
        console.error(`Error adding flashcard: ${id}`, error);
    }
    return flashcard;
}

export async function removeFlashcardFromDB(id) {
    const db = await initDB();
    try {
        await db.delete(STORE_NAME, id);
    } catch (error) {
        console.error(`Error removing flashcard: ${id}`, error);
    }
}

export async function editFlashcardInDB(
    id,
    updatedFront,
    updatedBack,
    updatedCategory,
    updatedKnow = undefined,
    updatedLangFront = 'en-US',
    updatedLangBack = 'en-US',
    updateSuperCategory
) {
    const db = await initDB();
    const flashcard = {
        id,
        front: updatedFront,
        back: updatedBack,
        category: updatedCategory,
        know: updatedKnow,
        langFront: updatedLangFront,
        langBack: updatedLangBack,
        superCategory: updateSuperCategory
    };
    try {
        await db.put(STORE_NAME, flashcard);
    } catch (error) {
        console.error(`Error editing flashcard: ${id}`, error);
    }
}

export async function clearAllFlashcards() {
    const db = await initDB();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    try {
        await tx.store.clear();
        await tx.done;
    } catch (error) {
        console.error('Error clearing flashcards:', error);
    }
}

export async function addMultipleFlashcardsToDB(flashcards) {
    const db = await initDB();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.store;

    let localCounter = 0;
    for (const fc of flashcards) {
        localCounter++;
        const id = `${Date.now()}-${localCounter}`;
        try {
            await store.put({
                id,
                front: fc.front || '',
                back: fc.back || '',
                category: fc.category || '',
                know: fc.know,
                langFront: fc.langFront || 'en-US',
                langBack: fc.langBack || 'en-US',
                superCategory: fc.superCategory || ''
            });
        } catch (error) {
            console.error(`Error adding flashcard: ${id}`, error);
        }
    }
    try {
        await tx.done; // Zamknij transakcję po zakończeniu
    } catch (error) {
        console.error('Error completing transaction:', error);
    }
}

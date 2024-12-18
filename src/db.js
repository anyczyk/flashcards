// db.js
import { openDB } from 'idb';

const DB_NAME = 'flashcardsDB';
const STORE_NAME = 'flashcards';
const DB_VERSION = 13; // Zwiększona wersja dla migracji

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

export async function addFlashcardToDB({ front, back, category, know = undefined, langFront = 'en-US', langBack = 'en-US' }) {
    const db = await initDB();
    const id = crypto.randomUUID(); // Generowanie unikalnego ID
    const flashcard = { id, front, back, category, know, langFront, langBack };
    // console.log("Adding flashcard to DB:", flashcard); // Logowanie
    await db.put(STORE_NAME, flashcard);
    return flashcard;
}

export async function removeFlashcardFromDB(id) {
    const db = await initDB();
    await db.delete(STORE_NAME, id);
}

export async function editFlashcardInDB(id, updatedFront, updatedBack, updatedCategory, updatedKnow = undefined, updatedLangFront = 'en-US', updatedLangBack = 'en-US') {
    const db = await initDB();
    const flashcard = {
        id,
        front: updatedFront,
        back: updatedBack,
        category: updatedCategory,
        know: updatedKnow,
        langFront: updatedLangFront,
        langBack: updatedLangBack
    };
    // console.log("Editing flashcard in DB:", flashcard); // Logowanie
    await db.put(STORE_NAME, flashcard);
}

export async function clearAllFlashcards() {
    const db = await initDB();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    await tx.store.clear();
    await tx.done;
}

export async function addMultipleFlashcardsToDB(flashcards) {
    const db = await initDB();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    for (const fc of flashcards) {
        const id = crypto.randomUUID();
        await tx.store.put({
            id,
            front: fc.front || '',
            back: fc.back || '',
            category: fc.category || '',
            know: fc.know,
            langFront: fc.langFront || 'en-US',
            langBack: fc.langBack || 'en-US'
        });
    }
    await tx.done;
}

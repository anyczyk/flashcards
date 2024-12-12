// db.js
import { openDB } from 'idb';

const DB_NAME = 'flashcardsDB';
const STORE_NAME = 'flashcards';
const DB_VERSION = 2; // Zwiększamy wersję, aby wymusić upgrade

export async function initDB() {
    const db = await openDB(DB_NAME, DB_VERSION, {
        upgrade(db) {
            // Jeśli store już istnieje, usuwamy go w trakcie upgrade'u,
            // aby go odtworzyć bez autoIncrement
            if (db.objectStoreNames.contains(STORE_NAME)) {
                db.deleteObjectStore(STORE_NAME);
            }
            db.createObjectStore(STORE_NAME, {
                keyPath: 'id'
                // autoIncrement: false - domyślnie jest false, nie ustawiamy
            });
        }
    });
    return db;
}

export async function getAllFlashcards() {
    const db = await initDB();
    return await db.getAll(STORE_NAME);
}

export async function addFlashcardToDB(front, back, category, know = undefined) {
    const db = await initDB();
    const id = crypto.randomUUID(); // Generujemy unikalny klucz
    await db.put(STORE_NAME, { id, front, back, category, know });
    return { id, front, back, category, know };
}

export async function removeFlashcardFromDB(id) {
    const db = await initDB();
    await db.delete(STORE_NAME, id);
}

export async function editFlashcardInDB(id, updatedFront, updatedBack, updatedCategory, updatedKnow = undefined) {
    const db = await initDB();
    await db.put(STORE_NAME, { id, front: updatedFront, back: updatedBack, category: updatedCategory, know: updatedKnow });
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
            know: fc.know
        });
    }
    await tx.done;
}

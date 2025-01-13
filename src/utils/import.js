// import.js

import {addMultipleFlashcardsToDB, clearAllFlashcards} from "../db";
import {getLocalStorage} from "./storage";

/**
 * Funkcja pomocnicza do przetwarzania tablicy categoryOrder w oparciu o dane flashcardów.
 * @param {Array} flashcardsData - tablica flashcardów z wczytanego pliku lub z parametru.
 * @param {Boolean} replace - jeżeli true, całkowicie nadpisuje categoryOrder;
 *                            jeżeli false, dokłada nowe wartości.
 */
const updateCategoryOrder = (flashcardsData, replace = false) => {
    let currentCategoryOrder = [];

    // Jeśli replace = false, wczytujemy obecną tablicę z localStorage
    if (!replace) {
        const savedOrder = localStorage.getItem('categoryOrder');
        currentCategoryOrder = savedOrder ? JSON.parse(savedOrder) : [];
    }

    // Jeśli replace = true, zaczynamy z pustą tablicą
    if (replace) {
        currentCategoryOrder = [];
    }

    // Dla każdej fiszki wybieramy: superCategory (jeśli istnieje), w przeciwnym razie category
    flashcardsData.forEach((fc) => {
        const categoryToStore = fc.superCategory?.trim()
            ? fc.superCategory.trim()
            : fc.category?.trim() || '';

        if (categoryToStore) {
            // Usuwamy duplikat, jeśli kategoria już istnieje w tablicy
            const index = currentCategoryOrder.indexOf(categoryToStore);
            if (index !== -1) {
                currentCategoryOrder.splice(index, 1);
            }
            // Wstawiamy na początek
            currentCategoryOrder.unshift(categoryToStore);
        }
    });

    // Nadpisujemy localStorage zaktualizowaną tablicą
    localStorage.setItem('categoryOrder', JSON.stringify(currentCategoryOrder));
};

/**
 * Funkcja do importowania fiszek z całkowitym nadpisaniem bazy.
 * @param loadData
 * @param {File | Array | Object} dataToImport - dane do zaimportowania:
 *    - File (z inputa)
 *    - Array (np. JSON zaimportowany w projekcie)
 *    - Object (parsowany JSON)
 * @param saveToLocalStorage
 * @param message
 * @param fileInput
 * @param setSelectedFile
 */
export const importReplace = async (loadData, dataToImport, saveToLocalStorage, message=null, fileInput=null, setSelectedFile=null) => {
    if (!dataToImport) {
        alert("No data to import!");
        return;
    }

    let data;
    try {
        if (dataToImport instanceof File) {
            // Gdy mamy plik, wczytujemy go
            const fileContent = await dataToImport.text();
            data = JSON.parse(fileContent);
        } else if (Array.isArray(dataToImport)) {
            // Gdy mamy tablicę, bierzemy ją bezpośrednio
            data = dataToImport;
        } else if (typeof dataToImport === 'object') {
            // Gdy mamy obiekt, traktujemy go jako już sparsowany JSON
            data = dataToImport;
        } else {
            // Jeśli format nie jest obsługiwany
            alert("Invalid data format");
            return;
        }
    } catch (error) {
        alert("Error parsing JSON data");
        return;
    }

    // Nadpisujemy całą bazę
    await clearAllFlashcards();
    await addMultipleFlashcardsToDB(data);

    // Całkowite nadpisanie categoryOrder
    updateCategoryOrder(data, true);

    if(message) {
        message("Data imported successfully (All replaced)");
    }

    // Powiadom nadrzędny komponent o imporcie
    if (loadData) {
        loadData();
    }

    // Reset inputu i stanu
    if (fileInput) {
        fileInput.value = '';
    }
    if(setSelectedFile) {
        setSelectedFile(null);
    }
    if(saveToLocalStorage) {
        saveToLocalStorage(getLocalStorage("categoryOrder") || []);
    }
};

/**
 * Funkcja do importowania fiszek z dopisaniem do istniejącej bazy.
 * @param loadData
 * @param {File | Array | Object} dataToImport - dane do zaimportowania:
 *    - File (z inputa)
 *    - Array (np. JSON zaimportowany w projekcie)
 *    - Object (parsowany JSON)
 * @param saveToLocalStorage
 * @param message
 * @param fileInput
 * @param setSelectedFile
 */
export const importAdd = async (loadData, dataToImport,saveToLocalStorage, message=null, fileInput=null, setSelectedFile=null) => {
    if (!dataToImport) {
        alert("No data to import!");
        return;
    }

    let data;
    try {
        if (dataToImport instanceof File) {
            // Gdy mamy plik, wczytujemy go
            const fileContent = await dataToImport.text();
            data = JSON.parse(fileContent);
        } else if (Array.isArray(dataToImport)) {
            // Gdy mamy tablicę, bierzemy ją bezpośrednio
            data = dataToImport;
        } else if (typeof dataToImport === 'object') {
            // Gdy mamy obiekt, traktujemy go jako już sparsowany JSON
            data = dataToImport;
        } else {
            // Jeśli format nie jest obsługiwany
            alert("Invalid data format");
            return;
        }
    } catch (error) {
        alert("Error parsing JSON data");
        return;
    }

    // Usuwamy pole id z każdej fiszki, aby zaimportować ją jako nowy rekord
    const dataWithoutId = data.map(flashcard => {
        const { id, ...rest } = flashcard;
        return rest;
    });

    // Dopisujemy fiszki do bazy
    await addMultipleFlashcardsToDB(dataWithoutId);

    // Uaktualnienie categoryOrder (bez nadpisywania)
    updateCategoryOrder(dataWithoutId, false);

    if(message) {
        message("Data imported successfully (Appended)");
    }

    // Powiadom nadrzędny komponent o imporcie
    if (loadData) {
        loadData();
    }

    // Reset inputu i stanu
    if (fileInput) {
        fileInput.value = '';
    }
    if(setSelectedFile) {
        setSelectedFile(null);
    }

    if(saveToLocalStorage) {
        saveToLocalStorage(getLocalStorage("categoryOrder") || []);
    }
};
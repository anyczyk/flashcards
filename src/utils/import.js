// import.js

import { addMultipleFlashcardsToDB, clearAllFlashcards } from "../db";
import { getLocalStorage } from "./storage";

/**
 * Helper function to process the categoryOrder array based on flashcard data.
 * @param {Array} flashcardsData - Array of flashcards loaded from a file or provided as a parameter.
 * @param {Boolean} replace - If true, completely overwrites categoryOrder;
 *                            if false, appends new values.
 */
const updateCategoryOrder = (flashcardsData, replace = false) => {
    let currentCategoryOrder = [];

    // If replace = false, load the current array from localStorage
    if (!replace) {
        const savedOrder = localStorage.getItem('categoryOrder');
        currentCategoryOrder = savedOrder ? JSON.parse(savedOrder) : [];
    }

    // If replace = true, start with an empty array
    if (replace) {
        currentCategoryOrder = [];
    }

    // For each flashcard, select: superCategory (if it exists), otherwise category
    flashcardsData.forEach((fc) => {
        const categoryToStore = fc.superCategory?.trim()
            ? fc.superCategory.trim()
            : fc.category?.trim() || '';

        if (categoryToStore) {
            // Remove duplicate if the category already exists in the array
            const index = currentCategoryOrder.indexOf(categoryToStore);
            if (index !== -1) {
                currentCategoryOrder.splice(index, 1);
            }
            // Insert at the beginning
            currentCategoryOrder.unshift(categoryToStore);
        }
    });

    // Overwrite localStorage with the updated array
    localStorage.setItem('categoryOrder', JSON.stringify(currentCategoryOrder));
};

/**
 * Function to import flashcards with complete overwrite of the database.
 * @param {Function} loadData - Function to reload data after import.
 * @param {File | Array | Object} dataToImport - Data to import:
 *    - File (from input)
 *    - Array (e.g., JSON imported in the project)
 *    - Object (parsed JSON)
 * @param {Function} saveToLocalStorage - Function to save updated data to localStorage.
 * @param {Function|null} message - Optional function to display a success message.
 * @param {HTMLInputElement|null} fileInput - Optional file input element to reset.
 * @param {Function|null} setSelectedFile - Optional function to reset the selected file state.
 */
export const importReplace = async (
    loadData,
    dataToImport,
    saveToLocalStorage,
    message = null,
    fileInput = null,
    setSelectedFile = null
) => {
    if (!dataToImport) {
        alert("No data to import!");
        return;
    }

    let data;
    try {
        if (dataToImport instanceof File) {
            // When we have a file, read it
            const fileContent = await dataToImport.text();
            data = JSON.parse(fileContent);
        } else if (Array.isArray(dataToImport)) {
            // When we have an array, take it directly
            data = dataToImport;
        } else if (typeof dataToImport === 'object') {
            // When we have an object, treat it as already parsed JSON
            data = dataToImport;
        } else {
            // If format is not supported
            alert("Invalid data format");
            return;
        }
    } catch (error) {
        alert("Error parsing JSON data");
        return;
    }

    // Overwrite the entire database
    await clearAllFlashcards();
    await addMultipleFlashcardsToDB(data);

    // Completely overwrite categoryOrder
    updateCategoryOrder(data, true);

    if (message) {
        message("Data imported successfully (All replaced)");
    }

    // Notify the parent component about the import
    if (loadData) {
        loadData();
    }

    // Reset input and state
    if (fileInput) {
        fileInput.value = '';
    }
    if (setSelectedFile) {
        setSelectedFile(null);
    }
    if (saveToLocalStorage) {
        saveToLocalStorage(getLocalStorage("categoryOrder") || []);
    }
};

/**
 * Function to import flashcards by appending to the existing database.
 * @param {Function} loadData - Function to reload data after import.
 * @param {File | Array | Object} dataToImport - Data to import:
 *    - File (from input)
 *    - Array (e.g., JSON imported in the project)
 *    - Object (parsed JSON)
 * @param {Function} saveToLocalStorage - Function to save updated data to localStorage.
 * @param {Function|null} message - Optional function to display a success message.
 * @param {HTMLInputElement|null} fileInput - Optional file input element to reset.
 * @param {Function|null} setSelectedFile - Optional function to reset the selected file state.
 */
export const importAdd = async (
    loadData,
    dataToImport,
    saveToLocalStorage,
    message = null,
    fileInput = null,
    setSelectedFile = null
) => {
    if (!dataToImport) {
        alert("No data to import!");
        return;
    }

    let data;
    try {
        if (dataToImport instanceof File) {
            // When we have a file, read it
            const fileContent = await dataToImport.text();
            data = JSON.parse(fileContent);
        } else if (Array.isArray(dataToImport)) {
            // When we have an array, take it directly
            data = dataToImport;
        } else if (typeof dataToImport === 'object') {
            // When we have an object, treat it as already parsed JSON
            data = dataToImport;
        } else {
            // If format is not supported
            alert("Invalid data format");
            return;
        }
    } catch (error) {
        alert("Error parsing JSON data");
        return;
    }

    // Remove the id field from each flashcard to import it as a new record
    const dataWithoutId = data.map(flashcard => {
        const { id, ...rest } = flashcard;
        return rest;
    });

    // Append flashcards to the database
    await addMultipleFlashcardsToDB(dataWithoutId);

    // Update categoryOrder (without overwriting)
    updateCategoryOrder(dataWithoutId, false);

    if (message) {
        message("Data imported successfully (Appended)");
    }

    // Notify the parent component about the import
    if (loadData) {
        loadData();
    }

    // Reset input and state
    if (fileInput) {
        fileInput.value = '';
    }
    if (setSelectedFile) {
        setSelectedFile(null);
    }

    if (saveToLocalStorage) {
        saveToLocalStorage(getLocalStorage("categoryOrder") || []);
    }
};

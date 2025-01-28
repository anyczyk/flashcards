// import.js

import { addMultipleFlashcardsToDB, clearAllFlashcards } from "../db";
import { getLocalStorage } from "./storage";

const updateCategoryOrderClassic = (flashcardsData, replace = false) => {
    let currentCategoryOrder = [];

    if (!replace) {
        const savedOrder = localStorage.getItem('categoryOrder');
        currentCategoryOrder = savedOrder ? JSON.parse(savedOrder) : [];
    }

    if (replace) {
        currentCategoryOrder = [];
    }
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
    localStorage.setItem('categoryOrder', JSON.stringify(currentCategoryOrder));
};
export const importClassic = async (
    type,
    loadData,
    dataToImport,
    saveToLocalStorage,
    message = null,
    fileInput = null,
    setSelectedFile = null,
    messageText = ''
) => {
    if (!dataToImport || !type) {
        return;
    }

    let data;
    try {
        if ((dataToImport instanceof File) || (dataToImport && typeof dataToImport === 'object' && 'name' in dataToImport && 'size' in dataToImport)) {
            data = await new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = () => {
                    try {
                        const base64String = reader.result.split(',')[1];
                        const decodedString = atob(base64String);
                        const parsedData = JSON.parse(decodedString);
                        resolve(parsedData);
                    } catch (parseError) {
                        reject("Error parsing JSON data");
                    }
                };
                reader.onerror = () => {
                    reject("Error reading file");
                };
                reader.readAsDataURL(dataToImport);
            });
        } else if (Array.isArray(dataToImport)) {
            data = dataToImport;
        } else if (typeof dataToImport === 'object') {
            data = dataToImport;
        } else {
            return;
        }
    } catch (error) {
        alert(`Error during import: ${error}`);
        return;
    }

    if (!data) {
        return;
    }

    if(type === 'add') {
        const dataWithoutId = data.map(flashcard => {
            const { id, ...rest } = flashcard;
            return rest;
        });
        await addMultipleFlashcardsToDB(dataWithoutId);
        updateCategoryOrderClassic(dataWithoutId, false);
    } else if(type === 'replace') {
        await clearAllFlashcards();
        await addMultipleFlashcardsToDB(data);
        updateCategoryOrderClassic(data, true);
    }

    if (message) {
        message(messageText);
    }
    if (loadData) {
        loadData();
    }
    if (fileInput) {
        fileInput.value = '';
    }
    if (setSelectedFile) {
        setSelectedFile(null);
    }
    if (saveToLocalStorage) {
        const categoryOrder = getLocalStorage("categoryOrder") || [];
        saveToLocalStorage(categoryOrder);
    }
};
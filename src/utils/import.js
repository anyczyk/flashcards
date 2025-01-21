// import.js

import { addMultipleFlashcardsToDB, clearAllFlashcards } from "../db";
import { getLocalStorage } from "./storage";

function encodeSuperCategoryKey(superCategory) {
    return 'subCategoryOrder_' + btoa(unescape(encodeURIComponent(superCategory)));
}

function getSubCategoriesObject() {
    const subCatStr = localStorage.getItem('subCategoriesOrderStorage');
    return subCatStr ? JSON.parse(subCatStr) : {};
}

function saveSubCategoriesObject(obj) {
    localStorage.setItem('subCategoriesOrderStorage', JSON.stringify(obj));
}

function updateSubCategoriesOrder(flashcardsData, replace = false) {
    let subObj = replace ? {} : getSubCategoriesObject();

    flashcardsData.forEach(fc => {
        if (fc.superCategory && fc.superCategory.trim() !== "") {
            const superCat = fc.superCategory.trim();
            const key = encodeSuperCategoryKey(superCat);

            if (!subObj[key]) {
                subObj[key] = [];
            }

            let subCat = fc.category.trim();

            const idx = subObj[key].indexOf(subCat);
            if (idx !== -1) {
                subObj[key].splice(idx, 1);
            }
            subObj[key].push(subCat);
        }
    });

    saveSubCategoriesObject(subObj);
}

function updateCategoryOrder(flashcardsData, replace = false) {
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
            const index = currentCategoryOrder.indexOf(categoryToStore);
            if (index !== -1) {
                currentCategoryOrder.splice(index, 1);
            }
            currentCategoryOrder.push(categoryToStore);
        }
    });

    localStorage.setItem('categoryOrder', JSON.stringify(currentCategoryOrder));
}

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
            const fileContent = await dataToImport.text();
            data = JSON.parse(fileContent);
        } else if (Array.isArray(dataToImport)) {
            data = dataToImport;
        } else if (typeof dataToImport === 'object') {
            data = dataToImport;
        } else {
            alert("Invalid data format");
            return;
        }
    } catch (error) {
        alert("Error parsing JSON data");
        return;
    }

    await clearAllFlashcards();
    await addMultipleFlashcardsToDB(data);

    updateCategoryOrder(data, true);
    updateSubCategoriesOrder(data, true);

    localStorage.removeItem('openDropdownSuperCategory');

    if (message) {
        message("Data imported successfully (All replaced)");
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
        saveToLocalStorage(getLocalStorage("categoryOrder") || []);
    }
};
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
            const fileContent = await dataToImport.text();
            data = JSON.parse(fileContent);
        } else if (Array.isArray(dataToImport)) {
            data = dataToImport;
        } else if (typeof dataToImport === 'object') {
            data = dataToImport;
        } else {
            alert("Invalid data format");
            return;
        }
    } catch (error) {
        alert("Error parsing JSON data");
        return;
    }

    const dataWithoutId = data.map(flashcard => {
        const { id, ...rest } = flashcard;
        return rest;
    });
    await addMultipleFlashcardsToDB(dataWithoutId);
    updateCategoryOrder(dataWithoutId, false);
    updateSubCategoriesOrder(dataWithoutId, false);

    if (message) {
        message("Data imported successfully (Appended)");
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
        saveToLocalStorage(getLocalStorage("categoryOrder") || []);
    }
};

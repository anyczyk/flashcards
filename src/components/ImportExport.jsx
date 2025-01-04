// ImportExport.jsx

import React, { useRef, useState, useEffect } from 'react';
import { clearAllFlashcards, addMultipleFlashcardsToDB, getAllFlashcards } from '../db';
import cardsExport from '../utils/cardsExport';
import { useTranslation } from 'react-i18next';

function ImportExport({ flashcards, onImport }) {
    const { t } = useTranslation();
    const fileInputRef = useRef(null);
    const [selectedFile, setSelectedFile] = useState(null);
    const [importSuccessMessage, setImportSuccessMessage] = useState('');

    useEffect(() => {
        let timer;
        if (importSuccessMessage) {
            timer = setTimeout(() => {
                setImportSuccessMessage('');
            }, 3000);
        }
        return () => {
            if (timer) clearTimeout(timer);
        };
    }, [importSuccessMessage]);

    const handleFileChange = () => {
        const file = fileInputRef.current.files && fileInputRef.current.files[0];
        setSelectedFile(file || null);
    };

    /**
     * Funkcja pomocnicza do przetwarzania tablicy categoryOrder w oparciu o dane flashcardów.
     * @param {Array} flashcardsData - tablica flashcardów z wczytanego pliku
     * @param {Boolean} replace - jeżeli true, całkowicie nadpisuje categoryOrder;
     *                            jeżeli false, tylko dokłada nowe wartości.
     */
    const updateCategoryOrder = (flashcardsData, replace = false) => {
        let currentCategoryOrder = [];

        // Jeśli replace = false, wczytujemy obecną tablicę z localStorage
        if (!replace) {
            const savedOrder = localStorage.getItem('categoryOrder');
            currentCategoryOrder = savedOrder ? JSON.parse(savedOrder) : [];
        }

        // Jeśli replace = true, zaczynamy z pustą tablicą (ignorujemy starą zawartość)
        // bo chcemy całkowicie nadpisać categoryOrder
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

    const handleImportAll = async () => {
        const file = selectedFile;
        if (!file) {
            alert("No file selected for import!");
            return;
        }

        const fileContent = await file.text();
        let data;
        try {
            data = JSON.parse(fileContent);
        } catch (e) {
            alert("Invalid JSON file");
            return;
        }

        // Czyszczenie całej bazy i import nowych danych
        await clearAllFlashcards();
        await addMultipleFlashcardsToDB(data);

        // Całkowite nadpisanie categoryOrder
        updateCategoryOrder(data, true);

        // Komunikat o sukcesie
        setImportSuccessMessage("Data imported successfully (All replaced)");

        // Powiadom App o imporcie
        if (onImport) {
            onImport();
        }

        // Reset wyboru pliku
        fileInputRef.current.value = '';
        setSelectedFile(null);
    };

    const handleImportPart = async () => {
        const file = selectedFile;
        if (!file) {
            alert("No file selected for import!");
            return;
        }

        const fileContent = await file.text();
        let data;
        try {
            data = JSON.parse(fileContent);
        } catch (e) {
            alert("Invalid JSON file");
            return;
        }

        // Usuwamy pole id z każdej fiszki, aby zaimportować je jako nowe rekordy
        const dataWithoutId = data.map(flashcard => {
            const { id, ...rest } = flashcard;
            return rest;
        });

        // Dodajemy do bazy (bez czyszczenia)
        await addMultipleFlashcardsToDB(dataWithoutId);

        // Uaktualnienie categoryOrder bez nadpisywania istniejącej listy
        updateCategoryOrder(dataWithoutId, false);

        // Komunikat o sukcesie
        setImportSuccessMessage("Data imported successfully (Appended)");

        // Powiadom App o imporcie
        if (onImport) {
            onImport();
        }

        // Reset wyboru pliku
        fileInputRef.current.value = '';
        setSelectedFile(null);
    };

    const handleExport = async () => {
        try {
            const cardsToExport = await getAllFlashcards();
            await cardsExport(cardsToExport);
        } catch (error) {
            console.error("Error while exporting flashcards:", error);
            alert("Error while exporting flashcards");
        }
    };

    return (
        <div className="o-page-import-export">
            <h2>Import / Export</h2>
            <hr />
            <div className="o-default-box">
                <p>
                    <label htmlFor="o-choose-file">{t('importing_flashcards_from_a_file')}:</label>
                    <input
                        id="o-choose-file"
                        type="file"
                        ref={fileInputRef}
                        accept=".json"
                        onChange={handleFileChange}
                        aria-label={t('choose_file_to_import')}
                    />
                </p>

                {selectedFile && (
                    <ul className="o-list-buttons-clear">
                        <li>
                            <button onClick={handleImportAll}>{t('import_replace')}</button>
                        </li>
                        <li>
                            <button onClick={handleImportPart}>{t('import_append')}</button>
                        </li>
                    </ul>
                )}
            </div>

            {flashcards.length > 0 && (
                <p>
                    <button onClick={handleExport}>
                        <i className="icon-export"></i> {t('export_to_file')}
                    </button>
                </p>
            )}

            {importSuccessMessage && (
                <p className="color-green">
                    {importSuccessMessage}
                </p>
            )}
        </div>
    );
}

export default ImportExport;

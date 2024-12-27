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

        await addMultipleFlashcardsToDB(dataWithoutId);

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
            console.error("Błąd podczas eksportu fiszek:", error);
            alert("Wystąpił błąd podczas eksportu fiszek.");
        }
    };

    return (
        <div className="o-page-import-export">
            <h2>Import / Export</h2>
            <hr />
            <div className="o-default-box">
                <p>
                    <label htmlFor="o-choose-file">Import fiszek z pliku:</label> <input
                        id="o-choose-file"
                        type="file"
                        ref={fileInputRef}
                        accept=".json"
                        onChange={handleFileChange}
                        aria-label="Choose File to import"
                    />
                </p>

                {selectedFile && (
                    <ul className="o-list-buttons-clear">
                        <li>
                            <button onClick={handleImportAll}>Import All (Replace)</button>
                        </li>
                        <li>
                            <button onClick={handleImportPart}>Import Part (Append)</button>
                        </li>
                    </ul>
                )}
            </div>

            {(flashcards.length > 0) && <p><button onClick={handleExport}><i className="icon-export"></i> Export do pliku</button></p>}

            {importSuccessMessage && (
                <p className="color-green">
                    {importSuccessMessage}
                </p>
            )}
        </div>
    );
}

export default ImportExport;

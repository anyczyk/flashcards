// ImportExport.jsx

import React, { useRef, useState, useEffect } from 'react';
import { clearAllFlashcards, addMultipleFlashcardsToDB, getAllFlashcards } from '../db';

function ImportExport({ onImport }) { // Odbierz prop onImport
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
        const allData = await getAllFlashcards();
        const jsonStr = JSON.stringify(allData, null, 2);

        const blob = new Blob([jsonStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);

        // Generowanie unikalnej nazwy pliku w oparciu o timestamp
        const fileName = `index-db-${Date.now()}.json`;

        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        a.click();

        URL.revokeObjectURL(url);
    };

    return (
        <div>
            <h2>Import / Export</h2>
            <div>
                <label htmlFor="fc-choose-file">Import fiszek z pliku:</label>
                <input
                    id="fc-choose-file"
                    type="file"
                    ref={fileInputRef}
                    accept=".json"
                    onChange={handleFileChange}
                    aria-label="Choose File to import"
                />

                {selectedFile && (
                    <ul>
                        <li>
                            <button onClick={handleImportAll}>Import All (Replace)</button>
                        </li>
                        <li>
                            <button onClick={handleImportPart}>Import Part (Append)</button>
                        </li>
                    </ul>
                )}
            </div>
            <div>
                <button onClick={handleExport}>Export do pliku</button>
            </div>

            {importSuccessMessage && (
                <div style={{ color: 'green', marginTop: '10px' }}>
                    {importSuccessMessage}
                </div>
            )}
        </div>
    );
}

export default ImportExport;

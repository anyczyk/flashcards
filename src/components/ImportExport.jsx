// ImportExport.jsx

import React, {useRef, useState, useEffect, useContext} from 'react';
import { getAllFlashcards } from '../db';
import cardsExport from '../utils/cardsExport';
import { useTranslation } from 'react-i18next';
import { FlashcardContext } from '../context/FlashcardContext';
import {getLocalStorage} from "../utils/storage";
import {importAdd, importReplace} from "../utils/import";
import FilesListImportFree from "./sub-components/common/FilesListImportFree";

function ImportExport({ handleImport }) {
    const { t } = useTranslation();
    const { flashcards, loadData, setCurrentLocalStorageCategoryOrder, importSuccessMessage, setImportSuccessMessage } = useContext(FlashcardContext);

    const fileInputRef = useRef(null);
    const [selectedFile, setSelectedFile] = useState(null);

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
            <hr/>

            {importSuccessMessage && (
                <p className="color-green">
                    {importSuccessMessage}
                </p>
            )}

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
                            {/* Tutaj wprost przekazujemy selectedFile do funkcji */}
                            <button onClick={() => importReplace(loadData, selectedFile, setCurrentLocalStorageCategoryOrder, setImportSuccessMessage, fileInputRef.current, setSelectedFile)}>
                                {t('import_replace')}
                            </button>
                        </li>
                        <li>
                            {/* Tutaj wprost przekazujemy selectedFile do funkcji */}
                            <button onClick={() => importAdd(loadData, selectedFile, setCurrentLocalStorageCategoryOrder, setImportSuccessMessage, fileInputRef.current, setSelectedFile)}>
                                {t('import_append')}
                            </button>
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

            <hr/>

            <h3>Free flashcards</h3>
            <FilesListImportFree />
        </div>
    )
        ;
}

export default ImportExport;

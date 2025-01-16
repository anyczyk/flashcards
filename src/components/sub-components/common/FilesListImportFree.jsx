// FilesListImportFree.jsx

import React, { useContext, useEffect } from "react";
import enPl from "../../../data/en-pl.json";
import enId from "../../../data/en-id.json";
import { useTranslation } from "react-i18next";
import { importAdd } from "../../../utils/import";
import { FlashcardContext } from "../../../context/FlashcardContext";
import { getLocalStorage } from "../../../utils/storage";

const dataFiles = [
    { file: enPl, name: "Fiszki Angielsko-Polskie (English-Polish)" },
    { file: enId, name: "Flashcard Bahasa Inggris-Indonesia (English-Indonesian)" }
];

const FilesListImportFree = () => {
    const { t } = useTranslation();
    const {
        loadData,
        currentLocalStorageCategoryOrder,
        setCurrentLocalStorageCategoryOrder,
        setImportSuccessMessage
    } = useContext(FlashcardContext);

    useEffect(() => {
        const updatedFromStorage = getLocalStorage("categoryOrder") || [];
        setCurrentLocalStorageCategoryOrder(updatedFromStorage);
    }, [setCurrentLocalStorageCategoryOrder]);

    return (
        <ul className="o-list-buttons-clear o-default-box">
            {dataFiles.map((item, index) => (
                <li key={index} className="w-100">
                    <button
                        className="btn--blue w-100"
                        onClick={() => {
                            importAdd(
                                loadData,
                                item.file,
                                setCurrentLocalStorageCategoryOrder
                            );
                        }}
                        disabled={currentLocalStorageCategoryOrder.includes(item.name)}
                    >
                        {item.name}{" "}
                        {currentLocalStorageCategoryOrder.includes(item.name) && (
                            <>
                                {" "}
                                - <i className="icon-ok"></i> {t('installed')}
                            </>
                        )}
                    </button>
                </li>
            ))}
        </ul>
    );
};

export default FilesListImportFree;

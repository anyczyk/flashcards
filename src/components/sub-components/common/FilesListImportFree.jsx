// FilesListImportFree.jsx

import React, { useContext, useEffect, useState } from "react";
import enPl from "../../../data/en-pl/en-pl.json";
import enId from "../../../data/en-id/en-id.json";
import plPolskiePrzedmiotyLekcyjne from "../../../data/pl/pl-polskie-przedmioty-lekcyjne.json";
import { useTranslation } from "react-i18next";
import { importAdd } from "../../../utils/import";
import { FlashcardContext } from "../../../context/FlashcardContext";
import { getLocalStorage } from "../../../utils/storage";

const plTitle = "Polskie fiszki (Polish)"
const idTitle = "Flashcard Bahasa Indonesia (Indonesian)";
const dataFiles = [
    { category: plTitle, file: enPl, name: "1000 popularnych angielskich słów" },
    { category: plTitle, file: plPolskiePrzedmiotyLekcyjne, name: "Polskie przedmioty lekcyjne", description: "Najbardziej popularne pytania z przedmiotów szkolnych: Biologii (100), Fizyki (220), Geografii (200), Historii (100)" },
    { category: idTitle, file: enId, name: "1000 Kata Bahasa Inggris yang Populer" }
];

const FilesListImportFree = ({ timerAccess }) => {
    const { t } = useTranslation();
    const {
        loadData,
        currentLocalStorageCategoryOrder,
        setCurrentLocalStorageCategoryOrder
    } = useContext(FlashcardContext);

    const [preloaderButton, setPreloaderButton] = useState("");

    useEffect(() => {
        const updatedFromStorage = getLocalStorage("categoryOrder") || [];
        setCurrentLocalStorageCategoryOrder(updatedFromStorage);
    }, [setCurrentLocalStorageCategoryOrder]);

    const importFile = async (item) => {
        setPreloaderButton(item.name);
        try {
            await importAdd(loadData, item.file, setCurrentLocalStorageCategoryOrder);
        } catch (error) {
            console.error("Import failed", error);
        } finally {
            setPreloaderButton("");
        }
    }

    // Grupowanie danych według kategorii
    const groupedData = dataFiles.reduce((acc, item) => {
        if (!acc[item.category]) {
            acc[item.category] = [];
        }
        acc[item.category].push(item);
        return acc;
    }, {});

    return (
        <div className="o-files-list-import-free">
            {Object.keys(groupedData).map((category, index) => (
                <div key={index} className="o-default-box">
                    <h3>{category}</h3>
                    <ul className="o-list-buttons-clear o-default-box">
                        {groupedData[category].map((item, idx) => (
                            <li key={idx} className="w-100">
                                <button
                                    className="btn--blue w-100 text-left justify-content-left"
                                    onClick={() => importFile(item)}
                                    disabled={!(timerAccess > 0) || currentLocalStorageCategoryOrder.includes(item.name)}
                                >
                                    <i className="icon-logo-f" />
                                    {item.description || item.name}{" "}
                                    {preloaderButton === item.name && !currentLocalStorageCategoryOrder.includes(item.name) &&
                                        <div className="o-mini-preloader" />}
                                    {currentLocalStorageCategoryOrder.includes(item.name) && (
                                        <>
                                            {" "}
                                            <i className="icon-ok"></i> {t('installed')}
                                        </>
                                    )}
                                </button>
                            </li>
                        ))}
                    </ul>
                </div>
            ))}
        </div>
    );
};

export default FilesListImportFree;

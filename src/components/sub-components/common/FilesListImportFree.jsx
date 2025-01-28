// FilesListImportFree.jsx

import React, { useContext, useEffect, useState } from "react";
import enDe from "../../../data/en-de/en-de.json";
import enFr from "../../../data/en-fr/en-fr.json";
import enPl from "../../../data/en-pl/en-pl.json";
import enEs from "../../../data/en-es/en-es.json";
import enId from "../../../data/en-id/en-id.json";
import plPolskiePrzedmiotyLekcyjne from "../../../data/pl/pl-polskie-przedmioty-lekcyjne.json";
import { useTranslation } from "react-i18next";
import { importAdd } from "../../../utils/import";
import { FlashcardContext } from "../../../context/FlashcardContext";
import { getLocalStorage } from "../../../utils/storage";

const deTitle = "Deutsche Karteikarten (German):";
const esTitle = "Fichas españolas (Spanish):";
const frTitle = "Fiches françaises (French):";
const idTitle = "Flashcard Bahasa Indonesia (Indonesian):";
const plTitle = "Polskie fiszki (Polish):";
const dataFiles = [
    { mainLanguage: "de", category: deTitle, file: enDe, name: "1000 beliebte englische Wörter" },
    { mainLanguage: "es", category: esTitle, file: enEs, name: "1000 palabras populares en inglés"},
    { mainLanguage: "fr", category: frTitle, file: enFr, name: "1000 mots anglais populaires"},
    { mainLanguage: "id", category: idTitle, file: enId, name: "1000 Kata Bahasa Inggris yang Populer" },
    { mainLanguage: "pl", category: plTitle, file: enPl, name: "1000 popularnych angielskich słów" },
    { mainLanguage: "pl", category: plTitle, file: plPolskiePrzedmiotyLekcyjne, name: "Polskie przedmioty lekcyjne", description: "Najbardziej popularne pytania z przedmiotów szkolnych: Biologii (100), Fizyki (220), Geografii (200), Historii (100)" }
];

const FilesListImportFree = ({ timerAccess }) => {
    const { t, i18n } = useTranslation();
    const {
        loadData,
        currentLocalStorageCategoryOrder,
        setCurrentLocalStorageCategoryOrder,
        isPremium
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

    const groupedData = dataFiles.reduce((acc, item) => {
        if (!acc[item.category]) {
            acc[item.category] = [];
        }
        acc[item.category].push(item);
        return acc;
    }, {});

    const mainLang = i18n.language.split('-')[0];

    const matchedCategory = dataFiles.find(item => item.mainLanguage === mainLang)?.category;

    const allCategories = Object.keys(groupedData);

    const orderedCategories = matchedCategory
        ? [matchedCategory, ...allCategories.filter(cat => cat !== matchedCategory)]
        : allCategories;

    return (
        <div className="o-files-list-import-free">
            {orderedCategories.map((category, index) => (
                <div key={index} className="o-default-box">
                    <h3>{category}</h3>
                    <ul className="o-list-buttons-clear o-default-box">
                        {groupedData[category].map((item, idx) => (
                            <li key={idx} className="w-100 o-install-item">
                                <button
                                    className="btn--blue w-100 text-left justify-content-left"
                                    onClick={() => importFile(item)}
                                    disabled={!(isPremium || timerAccess > 0 || !currentLocalStorageCategoryOrder.includes(item.name))}
                                    // disabled={!(timerAccess > 0) || currentLocalStorageCategoryOrder.includes(item.name)}
                                >
                                    <i className="icon-logo-f" />
                                    {item.description || item.name}{" "}
                                    {preloaderButton === item.name && !currentLocalStorageCategoryOrder.includes(item.name) &&
                                        <div className="o-mini-preloader" />}
                                </button>
                                {currentLocalStorageCategoryOrder.includes(item.name) &&
                                    <div className="o-install-item__checked">
                                        {/*<span*/}
                                        {/*    className="color-black o-install-item__checked-text">{t('installed')}</span>*/}
                                        <i className="icon-ok color-green o-install-item__checked-icon"/>
                                    </div>
                                }
                            </li>
                        ))}
                    </ul>
                </div>
            ))}
        </div>
    );
};

export default FilesListImportFree;

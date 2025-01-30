// FilesListImportFree.jsx

import React, { useContext, useEffect, useState } from "react";
import enDe from "../../../data/en-de/en-de.json";
import enFr from "../../../data/en-fr/en-fr.json";
import enPl from "../../../data/en-pl/en-pl.json";
import enEs from "../../../data/en-es/en-es.json";
import enId from "../../../data/en-id/en-id.json";
import plEnIrregularVerbs from "../../../data/en-pl/pl-en-irregular-verbs-full.json";
// import plPolskiePrzedmiotyLekcyjne from "../../../data/pl/pl-polskie-przedmioty-lekcyjne.json";
import { useTranslation } from "react-i18next";
import { importAdd } from "../../../utils/import";
import { FlashcardContext } from "../../../context/FlashcardContext";
import { getLocalStorage } from "../../../utils/storage";

const deTitle = "Deutsch-Englische Karteikarten (German-English):";
const esTitle = "Tarjetas didácticas español-inglés (Spanish-English):";
const frTitle = "Flashcards français-anglais (French-English):";
const idTitle = "Flashcard bahasa indonesia-inggris (Indonesian-English):";
const plTitle = "Polsko-angielskie fiszki (Polish-English):";
const dataFiles = [
    { mainLanguage: "de", category: deTitle, file: enDe, name: "1000 beliebte englische Wörter", description: "1000 gebräuchliche englische Wörter – 3 Sätze (60) Lernkarten kostenlos"},
    { mainLanguage: "es", category: esTitle, file: enEs, name: "1000 palabras populares en inglés", description: "1000 palabras en inglés: 3 juegos (60) de tarjetas didácticas gratis"},
    { mainLanguage: "fr", category: frTitle, file: enFr, name: "1000 mots anglais populaires", description: "1000 mots anglais - 3 jeux (60) de flashcards gratuits"},
    { mainLanguage: "id", category: idTitle, file: enId, name: "1000 Kata Bahasa Inggris yang Populer", description: "1000 kata bahasa Inggris - 3 set (60) kartu flash gratis"},
    { mainLanguage: "pl", category: plTitle, file: enPl, name: "1000 popularnych angielskich słów", description: "1000 popularnych angielskich słów - 3 zestawy (60) fiszek za darmo"},
    { mainLanguage: "pl", category: plTitle, file: plEnIrregularVerbs, name: "Angielski - czasowniki nieregularne", description: "158 czasowników nieregularnych - 2 zestawy (40) fiszek za darmo"}
    // { mainLanguage: "pl", category: plTitle, file: enPlFree, name: "1000 popularnych angielskich słów", description: "1000 popularnych angielskich słów - 3 zestawy po 20 fiszek za darmo"},
    // { mainLanguage: "pl", category: plTitle, file: enPlPremium, name: "1000 popularnych angielskich słów", description: "1000 popularnych angielskich słów - aż 47 dodatkowych zestawów Premium", premium: true},
    // { mainLanguage: "pl", category: plTitle, file: plPolskiePrzedmiotyLekcyjne, name: "Polskie przedmioty lekcyjne", description: "Najbardziej popularne pytania z przedmiotów szkolnych: Biologii (100), Fizyki (220), Geografii (200), Historii (100)" }
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
                                    // disabled={!(isPremium || timerAccess > 0 || !currentLocalStorageCategoryOrder.includes(item.name))}
                                    disabled={
                                        isPremium ?
                                        currentLocalStorageCategoryOrder.includes(item.name)
                                        :
                                        (!(timerAccess > 0) || currentLocalStorageCategoryOrder.includes(item.name))
                                    }
                                >
                                    <i className="icon-logo-f" />
                                    {item.description || item.name}{" "}
                                    {preloaderButton === item.name && !currentLocalStorageCategoryOrder.includes(item.name) &&
                                        <div className="o-mini-preloader" />}
                                </button>
                                {currentLocalStorageCategoryOrder.includes(item.name) &&
                                    <div className="o-install-item__checked">
                                        <i className="icon-ok color-green o-install-item__checked-icon"/>
                                        <i className={`icon-crown o-install-item__checked-icon ${isPremium ? 'o-install-item__checked-icon--premium-active' : 'o-install-item__checked-icon--premium' }`}/>
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

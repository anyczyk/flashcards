// FilesListImportFree.jsx

import React, { useContext, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { importAdd } from "../../../utils/import";
import { FlashcardContext } from "../../../context/FlashcardContext";
import { getLocalStorage } from "../../../utils/storage";
import Flag from 'react-flagkit';

import enDa from "../../../data/en-da/en-da.json";
import enDe from "../../../data/en-de/en-de.json";
import enEs from "../../../data/en-es/en-es.json";
import enFi from "../../../data/en-fi/en-fi.json";
import enFr from "../../../data/en-fr/en-fr.json";
import enHi from "../../../data/en-hi/en-hi.json";
import enId from "../../../data/en-id/en-id.json";
import enIt from "../../../data/en-it/en-it.json";
import enJa from "../../../data/en-ja/en-ja.json";
import enKo from "../../../data/en-ko/en-ko.json";
import enNo from "../../../data/en-no/en-no.json";
import enPl from "../../../data/en-pl/en-pl.json";
import enPt from "../../../data/en-pt/en-pt.json";
import svTh from "../../../data/en-sv/en-sv.json";
import enTh from "../../../data/en-th/en-th.json";
import enUk from "../../../data/en-uk/en-uk.json";

import daEnIrregularVerbs from "../../../data/en-da/da-en-irregular-verbs-full.json";
import deEnIrregularVerbs from "../../../data/en-de/de-en-irregular-verbs-full.json";
import esEnIrregularVerbs from "../../../data/en-es/es-en-irregular-verbs-full.json";
import frEnIrregularVerbs from "../../../data/en-fr/fr-en-irregular-verbs-full.json";
import idEnIrregularVerbs from "../../../data/en-id/id-en-irregular-verbs-full.json";
import plEnIrregularVerbs from "../../../data/en-pl/pl-en-irregular-verbs-full.json";
import fiEnIrregularVerbs from "../../../data/en-fi/fi-en-irregular-verbs-full.json";
import hiEnIrregularVerbs from "../../../data/en-hi/hi-en-irregular-verbs-full.json";
import itEnIrregularVerbs from "../../../data/en-it/it-en-irregular-verbs-full.json";
import jaEnIrregularVerbs from "../../../data/en-ja/ja-en-irregular-verbs-full.json";
import koEnIrregularVerbs from "../../../data/en-ko/ko-en-irregular-verbs-full.json";
import noEnIrregularVerbs from "../../../data/en-no/no-en-irregular-verbs-full.json";
import ptEnIrregularVerbs from "../../../data/en-pt/pt-en-irregular-verbs-full.json";
import svEnIrregularVerbs from "../../../data/en-sv/sv-en-irregular-verbs-full.json";
import thEnIrregularVerbs from "../../../data/en-th/th-en-irregular-verbs-full.json";
import ukEnIrregularVerbs from "../../../data/en-uk/uk-en-irregular-verbs-full.json";

const daTitle = "Dansk-engelske flashcards (Danish-English):||GB||DK";
const deTitle = "Deutsch-Englische Karteikarten (German-English):||GB||DE";
const esTitle = "Tarjetas didácticas español-inglés (Spanish-English):||GB||ES";
const frTitle = "Flashcards français-anglais (French-English):||GB||FR";
const fiTitle = "Suomi-englanti flashcards (Finnish-English):||GB||FI";
const hiTitle = "फ़्लैशकार्ड फ़्रेंच-एंग्लैज़ (Hindi-English):||GB||IN";
const idTitle = "Flashcard bahasa indonesia-inggris (Indonesian-English):||GB||ID";
const itTitle = "Flashcard italiano-inglese (Italian-English):||GB||IT";
const jaTitle = "日英フラッシュカード (Japanese-English):||GB||JP";
const koTitle = "한국어-영어 플래시 카드 (Korean-English):||GB||KR";
const noTitle = "Norsk-engelske flashcards (Norwegian-English):||GB||NO";
const plTitle = "Polsko-angielskie fiszki (Polish-English):||GB||PL";
const ptTitle = "Flashcards Português-Inglês (Portuguese-English):||GB||PT||BR";
const svTitle = "Svensk-engelska flashcards (Swedish-English):||GB||SE";
const thTitle = "ไทย-อังกฤษ แฟลชการ์ด (Thai-English):||GB||TH";
const ukTitle = "Українсько-англійські картки (Ukrainian-English):||GB||UA";

// Engelsk - uregelmæssige verber

const dataFiles = [
    { mainLanguage: "da", category: daTitle, file: enDa, name: "1000 almindelige engelske ord", description: "1000 vanlige engelske ord - 3 sett (60) flashcards gratis"},
    { mainLanguage: "da", category: daTitle, file: daEnIrregularVerbs, name: "Engelsk - uregelmæssige verber", description: "158 uregelmæssige verber - 2 sæt (40) gratis flashcards"},

    { mainLanguage: "de", category: deTitle, file: enDe, name: "1000 beliebte englische Wörter", description: "1000 gebräuchliche englische Wörter – 3 Sätze (60) Lernkarten kostenlos"},
    { mainLanguage: "de", category: deTitle, file: deEnIrregularVerbs, name: "Englisch – unregelmäßige Verben", description: "158 unregelmäßige Verben – 2 Sätze (40) kostenlose Lernkarten"},

    { mainLanguage: "es", category: esTitle, file: enEs, name: "1000 palabras populares en inglés", description: "1000 palabras en inglés: 3 juegos (60) de tarjetas didácticas gratis"},
    { mainLanguage: "es", category: esTitle, file: esEnIrregularVerbs, name: "Inglés - verbos irregulares", description: "158 verbos irregulares - 2 juegos (40) tarjetas didácticas gratuitas"},

    { mainLanguage: "fi", category: fiTitle, file: enFi, name: "1000 yleistä englanninkielistä sanaa", description: "1000 yleistä englanninkielistä sanaa - 3 sarjaa (60) muistikorttia ilmaiseksi"},
    { mainLanguage: "fi", category: fiTitle, file: fiEnIrregularVerbs, name: "Englanti - epäsäännölliset verbit", description: "158 epäsäännöllistä verbiä - 2 settiä (40) flashkorttia ilmaiseksi"},

    { mainLanguage: "fr", category: frTitle, file: enFr, name: "1000 mots anglais populaires", description: "1000 mots anglais - 3 jeux (60) de flashcards gratuits"},
    { mainLanguage: "fr", category: frTitle, file: frEnIrregularVerbs, name: "Anglais - verbes irréguliers", description: "158 verbes irréguliers - 2 jeux (40) flashcards gratuits"},

    { mainLanguage: "hi", category: hiTitle, file: enHi, name: "1000 सामान्य अंग्रेजी शब्द", description: "1000 लोकप्रिय अंग्रेजी शब्द - 3 सेट (60) फ्लैश कार्ड मुफ़्त में"},
    { mainLanguage: "hi", category: hiTitle, file: hiEnIrregularVerbs, name: "अंग्रेजी - अनियमित क्रियाएँ", description: "158 अनियमित क्रियाएं - 2 सेट (40) फ्लैश कार्ड मुफ़्त में"},

    { mainLanguage: "id", category: idTitle, file: enId, name: "1000 Kata Bahasa Inggris yang Populer", description: "1000 kata bahasa Inggris - 3 set (60) kartu flash gratis"},
    { mainLanguage: "id", category: idTitle, file: idEnIrregularVerbs, name: "Bahasa Inggris - kata kerja tidak beraturan", description: "158 kata kerja tidak beraturan - 2 set (40) kartu flash gratis"},

    { mainLanguage: "it", category: itTitle, file: enIt, name: "1000 parole inglesi comuni", description: "1000 parole inglesi comuni - 3 set (60) flashcard gratis"},
    { mainLanguage: "it", category: itTitle, file: itEnIrregularVerbs, name: "Inglese - verbi irregolari", description: "158 verbi irregolari - 2 set (40) flashcard gratis"},

    { mainLanguage: "ja", category: jaTitle, file: enJa, name: "人気のある英単語1000語", description: "人気のある英単語1000語 - 3セット (60枚)のフラッシュカードが無料"},
    { mainLanguage: "ja", category: jaTitle, file: jaEnIrregularVerbs, name: "英語 - 不規則動詞", description: "158の不規則動詞 - 2セット（40枚）のフラッシュカードが無料"},

    { mainLanguage: "ko", category: koTitle, file: enKo, name: "1000개의 인기 있는 영어 단어", description: "1000개의 인기 있는 영어 단어 - 3세트 (60개의) 플래시 카드 무료"},
    { mainLanguage: "ko", category: koTitle, file: koEnIrregularVerbs, name: "영어 - 불규칙 동사", description: "158개의 불규칙 동사 - 2세트 (40장의) 플래시 카드 무료"},

    { mainLanguage: "no", category: noTitle, file: enNo, name: "1000 vanlige engelske ord", description: "1000 vanlige engelske ord - 3 sett (60) flashcards gratis"},
    { mainLanguage: "no", category: noTitle, file: noEnIrregularVerbs, name: "Engelsk - uregelmessige verb", description: "158 uregelmessige verb - 2 sett (40) flashkort gratis"},

    { mainLanguage: "pl", category: plTitle, file: enPl, name: "1000 popularnych angielskich słów", description: "1000 popularnych angielskich słów - 3 zestawy (60) fiszek za darmo"},
    { mainLanguage: "pl", category: plTitle, file: plEnIrregularVerbs, name: "Angielski - czasowniki nieregularne", description: "158 czasowników nieregularnych - 2 zestawy (40) fiszek za darmo"},

    { mainLanguage: "pt", category: ptTitle, file: enPt, name: "1000 palavras comuns em inglês", description: "1000 palavras comuns em inglês - 3 conjuntos (60) de flashcards grátis"},
    { mainLanguage: "pt", category: ptTitle, file: ptEnIrregularVerbs, name: "Inglês - verbos irregulares", description: "158 verbos irregulares - 2 conjuntos (40) flashcards grátis"},

    { mainLanguage: "sv", category: svTitle, file: svTh, name: "1000 vanliga engelska ord", description: "1000 vanliga engelska ord - 3 set (60) flashcards gratis"},
    { mainLanguage: "sv", category: svTitle, file: svEnIrregularVerbs, name: "Engelska - oregelbundna verb", description: "158 oregelbundna verb - 2 set (40) flashkort gratis"},

    { mainLanguage: "th", category: thTitle, file: enTh, name: "1000 คำศัพท์ภาษาอังกฤษยอดนิยม", description: "1000 คำศัพท์ภาษาอังกฤษยอดนิยม - 3 ชุด (60ใบ) แฟลชการ์ด ฟรี"},
    { mainLanguage: "th", category: thTitle, file: thEnIrregularVerbs, name: "ภาษาอังกฤษ - กริยาที่ไม่สม่ำเสมอ", description: "158 คำกริยาไม่ปกติ - 2 ชุด (40 ใบ) แฟลชการ์ด ฟรี"},

    { flagFirst: "GB", flagSecond: "UA", mainLanguage: "uk", category: ukTitle, file: enUk, name: "1000 поширених англійських слів", description: "1000 поширених англійських слів - 3 набори (60) карток безкоштовно"},
    { flagFirst: "UA", flagSecond: "GB", mainLanguage: "uk", category: ukTitle, file: ukEnIrregularVerbs, name: "Англійська - неправильні дієслова", description: "158 неправильних дієслів - 2 набори (40) флеш-карток безкоштовно"}
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

    console.log("c:",orderedCategories);

    return (
        <div className="o-files-list-import-free">
            {orderedCategories.map((category, index) => {
                const arrayCategory = category.split('||');
                const title = arrayCategory[0];
                const flagFirst = arrayCategory[1];
                const flagSecond = arrayCategory[2];
                const flagThird = arrayCategory[3];
                return (
                <div key={index} className="o-default-box">
                    <h3>{flagFirst && <Flag size="22" country={flagFirst} />} {flagSecond && <Flag size="22" country={flagSecond} />} {flagThird && <Flag size="22" country={flagThird} />} {title}</h3>
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
                                    <i className="icon-logo-f"/>
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
                    <hr />
                </div>)
            })}
        </div>
    );
};

export default FilesListImportFree;

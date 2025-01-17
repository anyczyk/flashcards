// CreateFlashcard.jsx
import React, {useState, useEffect, useCallback, useContext} from 'react';
import PropTypes from 'prop-types';
import { getCordovaLanguage } from '../utils/getLanguage';
import { loadLanguages } from '../utils/loadLanguages';
import SelectCodeLanguages from './sub-components/common/SelectCodeLanguages';
import { useTranslation } from 'react-i18next';
import { getAllFlashcards } from '../db';
import SelectSuperCategory from "./sub-components/common/SelectSuperCategory";
import SelectCategory from "./sub-components/common/SelectCategory";
import { useLocation, useNavigate } from "react-router-dom";
import {FlashcardContext} from "../context/FlashcardContext";

function encodeSuperCategoryKey(superCategory) {
    return 'subCategoryOrder_' + btoa(unescape(encodeURIComponent(superCategory)));
}

function CreateFlashcard({ addFlashcard, categories, superCategoriesArray }) {
    const { t } = useTranslation();
    const {
        rtlCodeLangs,
        dirAttribute
    } = useContext(FlashcardContext);
    const location = useLocation();
    const queryParams = new URLSearchParams(location.search);
    const getSuperCategory = queryParams.get("superCategory");
    const getAddFirstOrLast = queryParams.get("addFirstOrLast");
    const navigate = useNavigate();

    const [front, setFront] = useState('');
    const [back, setBack] = useState('');
    const [category, setCategory] = useState('');
    const [superCategory, setSuperCategory] = useState('');
    const [langFront, setLangFront] = useState('');
    const [langBack, setLangBack] = useState('');
    const [flashcardCreated, setFlashcardCreated] = useState(false);
    const [availableLanguages, setAvailableLanguages] = useState([]);
    const [categoriesDependentOnSuperCategory, setCategoriesDependentOnSuperCategory] = useState([]);
    const [currentSelectSuperCategory, setCurrentSelectSuperCategory] = useState('');
    const [continueAdd, setContinueAdd] = useState(false);

    const loadData = useCallback(async () => {
        const data = await getAllFlashcards();
        const catDependSuperCategory = new Set(
            data
                .filter(fc => fc.category && fc.category.trim() !== '' && fc.superCategory === currentSelectSuperCategory)
                .map(fc => fc.category)
        );
        setCategoriesDependentOnSuperCategory([...catDependSuperCategory]);
    }, [currentSelectSuperCategory]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    useEffect(() => {
        const fetchLanguages = async () => {
            try {
                const languages = await loadLanguages();
                setAvailableLanguages(languages);
            } catch (error) {
                console.error('Error loading languages:', error);
                setAvailableLanguages(['en-US']);
            }
        };
        fetchLanguages();
    }, []);

    useEffect(() => {
        if (availableLanguages.length > 0) {
            const setLanguages = async () => {
                try {
                    const detectedLanguage = await getCordovaLanguage();
                    console.log('Detected language:', detectedLanguage);

                    if (availableLanguages.includes(detectedLanguage)) {
                        setLangFront(detectedLanguage);
                        setLangBack(detectedLanguage);
                    } else if (availableLanguages.includes('en-US')) {
                        setLangFront('en-US');
                        setLangBack('en-US');
                    } else {
                        setLangFront(availableLanguages[0]);
                        setLangBack(availableLanguages[0]);
                    }
                } catch (error) {
                    console.error('Error setting languages:', error);
                    if (availableLanguages.includes('en-US')) {
                        setLangFront('en-US');
                        setLangBack('en-US');
                    } else {
                        setLangFront(availableLanguages[0]);
                        setLangBack(availableLanguages[0]);
                    }
                }
            };
            setLanguages();
        }
    }, [availableLanguages]);

    // const saveToLocalStorage = (finalCategory, finalSuperCategory) => {
    //     let categoryToStore = finalSuperCategory || finalCategory;
    //     const savedOrder = localStorage.getItem('categoryOrder');
    //     let savedOrderArray = savedOrder ? JSON.parse(savedOrder) : [];
    //
    //     if (categoryToStore) {
    //         const indexInOrder = savedOrderArray.indexOf(categoryToStore);
    //         if (indexInOrder !== -1) {
    //             savedOrderArray.splice(indexInOrder, 1);
    //         }
    //
    //         if(getAddCategoryInSuperCategory === 'last' || getAddSuperCategoryOrCategory === 'last') {
    //             console.log("last");
    //             savedOrderArray.push(categoryToStore);
    //         } else {
    //             console.log("first");
    //             savedOrderArray.unshift(categoryToStore);
    //         }
    //
    //         localStorage.setItem('categoryOrder', JSON.stringify(savedOrderArray));
    //     }
    //
    //     if (finalSuperCategory) {
    //         try {
    //             const subCatKey = encodeSuperCategoryKey(finalSuperCategory);
    //             const subCatDataStr = localStorage.getItem('subCategoriesOrderStorage');
    //             let subCatDataObj = subCatDataStr ? JSON.parse(subCatDataStr) : {};
    //
    //             if (!subCatDataObj[subCatKey]) {
    //                 subCatDataObj[subCatKey] = [];
    //             }
    //             if (finalCategory) {
    //                 const realSubCat = finalCategory.trim() === '' ? 'Without category' : finalCategory.trim();
    //
    //                 const indexInSub = subCatDataObj[subCatKey].indexOf(realSubCat);
    //                 if (indexInSub !== -1) {
    //                     subCatDataObj[subCatKey].splice(indexInSub, 1);
    //                 }
    //                 subCatDataObj[subCatKey].unshift(realSubCat);
    //             }
    //             localStorage.setItem('subCategoriesOrderStorage', JSON.stringify(subCatDataObj));
    //         } catch (error) {
    //             console.error('Error saving to subCategoriesOrderStorage:', error);
    //         }
    //     }
    // };

    const saveToLocalStorage = (finalCategory, finalSuperCategory) => {
        let categoryToStore = finalSuperCategory || finalCategory;
        const savedOrder = localStorage.getItem('categoryOrder');
        let savedOrderArray = savedOrder ? JSON.parse(savedOrder) : [];

        if (categoryToStore) {
            const indexInOrder = savedOrderArray.indexOf(categoryToStore);
            if (indexInOrder !== -1) {
                savedOrderArray.splice(indexInOrder, 1);
            }

            if(getAddFirstOrLast === 'last') {
                console.log("last");
                savedOrderArray.push(categoryToStore);
            } else {
                console.log("first");
                savedOrderArray.unshift(categoryToStore);
            }

            localStorage.setItem('categoryOrder', JSON.stringify(savedOrderArray));
        }

        if (finalSuperCategory) {
            try {
                const subCatKey = encodeSuperCategoryKey(finalSuperCategory);
                const subCatDataStr = localStorage.getItem('subCategoriesOrderStorage');
                let subCatDataObj = subCatDataStr ? JSON.parse(subCatDataStr) : {};

                if (!subCatDataObj[subCatKey]) {
                    subCatDataObj[subCatKey] = [];
                }
                if (finalCategory) {
                    const realSubCat = finalCategory.trim() === '' ? 'Without category' : finalCategory.trim();

                    const indexInSub = subCatDataObj[subCatKey].indexOf(realSubCat);
                    if (indexInSub !== -1) {
                        subCatDataObj[subCatKey].splice(indexInSub, 1);
                    }

                    if(getAddFirstOrLast === 'last') {
                        subCatDataObj[subCatKey].push(realSubCat);
                    } else {
                        subCatDataObj[subCatKey].unshift(realSubCat);
                    }
                }
                localStorage.setItem('subCategoriesOrderStorage', JSON.stringify(subCatDataObj));
            } catch (error) {
                console.error('Error saving to subCategoriesOrderStorage:', error);
            }
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (front.trim() && back.trim()) {
            let finalCategory = category.trim();
            if (finalCategory.toLowerCase() === 'without category') {
                finalCategory = '';
            }
            const finalLangFront = langFront || 'en-US';
            const finalLangBack = langBack || 'en-US';
            const finalSuperCategory = superCategory.trim();

            try {
                await addFlashcard({
                    front,
                    back,
                    category: finalCategory,
                    langFront: finalLangFront,
                    langBack: finalLangBack,
                    superCategory: finalSuperCategory
                });

                saveToLocalStorage(finalCategory, finalSuperCategory);

                setFlashcardCreated(true);
                setFront('');
                setBack('');

                if ((getSuperCategory || getSuperCategory === '') && !continueAdd) {
                    navigate('/list-edit');
                }
            } catch (error) {
                console.error('Error adding flashcard:', error);
            }
        }
    };

    useEffect(() => {
        let timer;
        if (flashcardCreated) {
            timer = setTimeout(() => {
                setFlashcardCreated(false);
            }, 3000);
        }
        return () => clearTimeout(timer);
    }, [flashcardCreated]);

    const filteredCategories = categories.filter(cat => cat.toLowerCase() !== 'without category');

    return (
        <div className="o-page-create-flashcard">
            <h2>{t('add_flashcard')}</h2>
            <hr />
            <form className="o-card" onSubmit={handleSubmit}>
                <div className="o-card__content">
                    <p>
                        <label htmlFor="o-front">
                            <span className="color-red">*</span> {t('front')}:
                        </label>
                        <textarea
                            value={front}
                            onChange={(e) => setFront(e.target.value)}
                            rows="3"
                            cols="30"
                            id="o-front"
                            dir={rtlCodeLangs.includes(langFront) ? 'rtl' : 'ltr'}
                            required
                        />
                    </p>
                    <p>
                        <label htmlFor="lang-front">
                            {t('language_code_for_speech_synthesizer')} ({t('front')}):
                        </label>
                        <SelectCodeLanguages
                            availableLanguages={availableLanguages}
                            value={langFront}
                            id={'lang-front'}
                            setFunction={setLangFront}
                        />
                    </p>
                    <hr />
                    <p>
                        <label htmlFor="o-back">
                            <span className="color-red">*</span> {t('back')}:
                        </label>
                        <textarea
                            value={back}
                            onChange={(e) => setBack(e.target.value)}
                            rows="3"
                            cols="30"
                            id="o-back"
                            dir={rtlCodeLangs.includes(langBack) ? 'rtl' : 'ltr'}
                            required
                        />
                    </p>

                    <p>
                        <label htmlFor="lang-back">
                            {t('language_code_for_speech_synthesizer')} ({t('back')}):
                        </label>
                        <br />
                        <SelectCodeLanguages
                            availableLanguages={availableLanguages}
                            value={langBack}
                            id={'lang-back'}
                            setFunction={setLangBack}
                        />
                    </p>
                    <hr />
                    <SelectSuperCategory
                        superCategory={superCategory}
                        setSuperCategory={setSuperCategory}
                        superCategoriesArray={superCategoriesArray}
                        setCurrentSelectSuperCategory={setCurrentSelectSuperCategory}
                    />
                    <hr />
                    <SelectCategory
                        category={category}
                        setCategory={setCategory}
                        categoriesDependentOnSuperCategory={categoriesDependentOnSuperCategory}
                    />
                    <hr />
                    {flashcardCreated && (
                        <p><strong className="color-green"> {t('flashcard_added')}</strong></p>
                    )}
                    <ul className="o-list-buttons-clear o-list-buttons-clear--nowrap-columns o-default-box">
                        <li>
                            <button type="submit" onClick={() => setContinueAdd(false)}
                                    disabled={!front.trim() || !back.trim()}>
                                {t('add_flashcard')}
                            </button>
                        </li>
                        {(getSuperCategory || getSuperCategory === '') ?
                            <li><button type="submit" onClick={() => setContinueAdd(true)} disabled={!front.trim() || !back.trim()}>
                                {t('add_flashcard_continue')}
                            </button></li> : ''}
                    </ul>
                </div>
            </form>
        </div>
    );
}

CreateFlashcard.propTypes = {
    addFlashcard: PropTypes.func.isRequired,
    categories: PropTypes.arrayOf(PropTypes.string).isRequired,
    superCategoriesArray: PropTypes.arrayOf(PropTypes.string).isRequired
};

export default CreateFlashcard;

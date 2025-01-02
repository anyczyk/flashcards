// App.jsx
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Routes, Route, Link, Navigate, useLocation } from 'react-router-dom';
import CreateFlashcard from './components/CreateFlashcard';
import EditFlashcardList from './components/EditFlashcardList';
import ViewFlashcards from './components/ViewFlashcards';
import ImportExport from './components/ImportExport';
import { getAllFlashcards, addFlashcardToDB, removeFlashcardFromDB, editFlashcardInDB } from './db';
import { useTranslation } from 'react-i18next';
import { setLocalStorage, getLocalStorage } from './utils/storage';
import { topScroll } from "./utils/topScroll";

function App() {
    useEffect(() => {
        document.addEventListener('deviceready', () => {
            if (window.navigator && window.navigator.splashscreen) {
                window.navigator.splashscreen.hide();
            }
        }, false);
    }, []);

    const { t, i18n } = useTranslation();
    const [flashcards, setFlashcards] = useState([]);
    const [categories, setCategories] = useState([]);
    const [allCategories, setAllCategories] = useState([]);
    const [superCategoriesArray, setSuperCategoriesArray] = useState([]);
    const [mainMenuVisible, setMainMenuVisible] = useState(false);
    const closeMenuRef = useRef(null);
    const closeMenuBtnRef = useRef(null);
    const location = useLocation();

    // Flaga sterująca auto-play (play/pause)
    const [playFlashcards, setPlayFlashcards] = useState(false);

    const [syntAudio, setSyntAudio] = useState(() => {
        const storedAudio = getLocalStorage('syntAudio');
        return storedAudio !== null ? storedAudio : true;
    });

    useEffect(() => {
        setLocalStorage('syntAudio', syntAudio);
    }, [syntAudio]);

    useEffect(() => {
        const handleClick = (event) => {
            const checkAllOutise = closeMenuRef.current && !closeMenuRef.current.contains(event.target);
            const checkBtnMenu = closeMenuBtnRef.current && !closeMenuBtnRef.current.contains(event.target);
            if (checkAllOutise && checkBtnMenu) {
                setMainMenuVisible(false);
            }
        };
        document.addEventListener('click', handleClick);
        return () => {
            document.removeEventListener('click', handleClick);
        };
    }, []);

    const showMainMenu = () => {
        setMainMenuVisible(prevState => !prevState);
    };

    const loadData = useCallback(async () => {
        const data = await getAllFlashcards();
        setFlashcards(data);

        const allCat = new Set(
            data.filter(fc => fc.category && fc.category.trim() !== '')
                .map(fc => fc.category)
        );

        const superCategories = new Set(
            data
                .filter(fc => fc.superCategory && fc.superCategory.trim() !== '')
                .map(fc => fc.superCategory)
        );

        const categoriesWithoutSuper = data
            .filter(fc =>
                fc.category &&
                fc.category.trim() !== '' &&
                (!fc.superCategory || fc.superCategory.trim() === '') &&
                !superCategories.has(fc.category)
            )
            .map(fc => fc.category);

        const catSet = new Set([...superCategories, ...categoriesWithoutSuper]);

        const anyWithoutCategory = data.some(fc => !fc.category || fc.category.trim() === '');
        const cats = [...catSet];
        if (anyWithoutCategory) {
            cats.push('Without category');
        }

        setSuperCategoriesArray([...superCategories]);
        setCategories(cats);
        setAllCategories([...allCat]);
    }, []);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const addFlashcard = async (front, back, category, know, langFront, langBack, superCategory) => {
        const newFc = await addFlashcardToDB(front, back, category, know, langFront, langBack, superCategory);
        setFlashcards((prev) => {
            const updated = [...prev, newFc];
            updateCategories(updated);
            return updated;
        });
    };

    const removeFlashcard = async (id) => {
        await removeFlashcardFromDB(id);
        setFlashcards((prev) => {
            const updated = prev.filter(fc => fc.id !== id);
            updateCategories(updated);
            return updated;
        });
    };

    const editFlashcard = async (id, updatedFront, updatedBack, updatedCategory, updatedKnow, updatedFrontLang, updatedBackLang, updateSuperCategory) => {
        await editFlashcardInDB(id, updatedFront, updatedBack, updatedCategory, updatedKnow, updatedFrontLang, updatedBackLang, updateSuperCategory);
        setFlashcards((prev) => {
            const updated = prev.map(fc => fc.id === id ? { ...fc, front: updatedFront, back: updatedBack, category: updatedCategory, know: updatedKnow, langFront: updatedFrontLang, langBack: updatedBackLang, superCategory: updateSuperCategory } : fc);
            updateCategories(updated);
            return updated;
        });
    };

    const setFlashcardKnow = async (id, knowValue) => {
        const card = flashcards.find(fc => fc.id === id);
        if (!card) return;
        await editFlashcardInDB(id, card.front, card.back, card.category, knowValue, card.langFront, card.langBack, card.superCategory);
        setFlashcards((prev) => {
            return prev.map(fc => fc.id === id ? { ...fc, know: knowValue } : fc);
        });
    };

    const updateCategories = (flashcardsData) => {
        const superCategories = new Set(
            flashcardsData
                .filter(fc => fc.superCategory && fc.superCategory.trim() !== '')
                .map(fc => fc.superCategory)
        );

        const categoriesWithoutSuper = flashcardsData
            .filter(fc =>
                fc.category &&
                fc.category.trim() !== '' &&
                (!fc.superCategory || fc.superCategory.trim() === '') &&
                !superCategories.has(fc.category)
            )
            .map(fc => fc.category);

        const catSet = new Set([...superCategories, ...categoriesWithoutSuper]);

        const anyWithoutCategory = flashcardsData.some(fc => !fc.category || fc.category.trim() === '');
        const cats = [...catSet];
        if (anyWithoutCategory) {
            cats.push('Without category');
        }

        setSuperCategoriesArray([...superCategories]);
        setCategories(cats);
    };

    const changeLanguage = (lng) => {
        i18n.changeLanguage(lng);
    };

    const getLanguageCode = (lng) => lng.split('-')[0];

    const handleImport = () => {
        loadData();
    };

    const audioOnOff = () => {
        setSyntAudio(prev => !prev);
    };

    const clearInsomnia = useCallback(() => {
        if (window.plugins && window.plugins.insomnia) {
            window.plugins.insomnia.allowSleepAgain();
        }
    }, []);

    const clearOptions = () => {
        setPlayFlashcards(false);
        clearInsomnia();
    };

    return (
        <div className={`o ${mainMenuVisible ? 'o-menu-visible' : ''}`}>
            <header className="o-main-header">
                <h1><Link to="/"><i
                    className="icon-logo-f"></i><span>Flasho</span></Link> - {t('simple_flashcard_creator')}</h1>
                <button
                    aria-label="Audio on / off"
                    className={`o-main-header__btn-audio ${syntAudio ? 'o-main-header__btn-audio--active' : ''}`}
                    onClick={()=> {
                            audioOnOff();
                            // setPlayFlashcards(false);
                        }
                    }
                    disabled={playFlashcards ? 'disabled' : '' }
                >
                    <i className="icon-volume"></i>
                </button>
                <button ref={closeMenuBtnRef} onClick={showMainMenu}
                        className={`o-main-header__btn-menu ${mainMenuVisible ? 'o-main-header__btn-menu--active' : ''}`}
                        aria-label="Open and close menu"><span>Menu</span></button>

                <div ref={closeMenuRef}
                     className={`o-main-header__menu ${mainMenuVisible ? 'o-main-header__menu--active' : ''}`}>
                    <div className="o-main-header__menu-langs">
                        <label htmlFor="o-lang">{i18n.language}</label>
                        <select id="o-lang" onChange={(e) => changeLanguage(e.target.value)}
                                value={getLanguageCode(i18n.language)}>
                            <option value="en">English</option>
                            <option value="pl">Polski</option>
                        </select>
                    </div>
                    <nav>
                        <ul>
                            <li><Link to="/"><i className="icon-play"></i> {t('view_flashcards')}</Link></li>
                            <li><Link onClick={clearOptions} to="/create"><i className="icon-plus"></i> {t('create_flashcard')}</Link></li>
                            <li><Link onClick={clearOptions} to="/list-edit"><i className="icon-wrench"></i> {t('edit_flashcards')}</Link></li>
                            <li><Link onClick={clearOptions} to="/import-export"><i className="icon-export"></i> {t('import_export')}</Link>
                            </li>
                        </ul>
                    </nav>
                    <div>
                        <p>Version: v1.0.1 {window.cordova ? 'App' : 'Browser'}</p>
                    </div>
                </div>
            </header>
            <main className="o-main-content">
                {location.pathname !== "/" && (
                    <p><Link className="o-main-start btn btn--green" to="/"><i
                        className="icon-play"></i> {t('view_flashcards')}</Link></p>
                )}

                <Routes>
                    <Route path="/" element={<ViewFlashcards clearInsomnia={clearInsomnia} loadData={loadData} syntAudio={syntAudio} flashcards={flashcards} categories={categories}
                                                             setFlashcardKnow={setFlashcardKnow} playFlashcards={playFlashcards} setPlayFlashcards={setPlayFlashcards}  />} />
                    <Route path="/create"
                           element={<CreateFlashcard allCategories={allCategories} addFlashcard={addFlashcard} categories={categories} superCategoriesArray={superCategoriesArray} />} />
                    <Route path="/list-edit"
                           element={<EditFlashcardList flashcards={flashcards} removeFlashcard={removeFlashcard}
                                                       editFlashcard={editFlashcard} categories={categories} />} />
                    <Route path="/import-export" element={<ImportExport flashcards={flashcards} onImport={handleImport} />} />
                    {/* Trasa domyślna */}
                    <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
            </main>
            <footer className="o-main-footer">
                <ul>
                    <li><Link aria-label={t('view_flashcards')} to="/"><i className="icon-logo-f"></i></Link></li>
                    <li><Link aria-label={t('create_flashcard')} onClick={clearOptions} to="/create"><i className="icon-plus"></i></Link></li>
                    <li><Link aria-label={t('edit_flashcards')} onClick={clearOptions} to="/list-edit"><i className="icon-wrench"></i></Link>
                    </li>
                    <li><Link aria-label={t('import_export')} onClick={clearOptions} to="/import-export"><i className="icon-export"></i></Link>
                    </li>
                    <li><Link aria-label={t('up')} onClick={topScroll} to="#"><i className="icon-up-open"></i></Link>
                    </li>
                </ul>
            </footer>
        </div>
    );
}

export default App;

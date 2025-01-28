// App.jsx
import React, {useEffect, useContext, useCallback, useState} from 'react';
import { Routes, Route, Link, Navigate, useLocation } from 'react-router-dom';
import CreateFlashcard from './components/CreateFlashcard';
import EditFlashcardList from './components/EditFlashcardList';
import ViewFlashcards from './components/ViewFlashcards';
import ImportExport from './components/ImportExport';
import Library from './components/Library';
import Search from './components/Search';
import Header from './components/Header';
import { useTranslation } from 'react-i18next';
import { setLocalStorage, getLocalStorage } from './utils/storage';
import Footer from "./components/Footer";
import { FlashcardContext } from './context/FlashcardContext';
import {EditSearchProvider} from "./context/EditSearchContext";

function App() {
    const { t, i18n } = useTranslation();
    const location = useLocation();
    const {
        syntAudio,
        loadData,
        addFlashcard,
        categories,
        superCategoriesArray,
        setPlayFlashcards
    } = useContext(FlashcardContext);
    const [mainMenuVisible, setMainMenuVisible] = useState(false);
    const [mainHomePageLoad,setMainHomePageLoad] = useState(false);
    const [editPageLoad,setEditPageLoad] = useState(false);
    const [preloader, setPreloader] = useState(false);


    useEffect(() => {
        document.addEventListener('deviceready', () => {
            if (window.navigator && window.navigator.splashscreen) {
                window.navigator.splashscreen.hide();
            }
            if (window.StatusBar) {
                window.StatusBar.backgroundColorByHexString('#1a291a');
            }
            if (window.navigationbar) {
                window.navigationbar.colorByHexString('#1a291a');
            }
        }, false);
        document.addEventListener('admob.ad.dismiss', async () => {
            if (window.StatusBar) {
                window.StatusBar.backgroundColorByHexString('#1a291a');
            }
        }, false);
    }, []);

    useEffect(() => {
        setLocalStorage('syntAudio', syntAudio);
    }, [syntAudio]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const clearInsomnia = useCallback(() => {
        if (window.plugins && window.plugins.insomnia) {
            window.plugins.insomnia.allowSleepAgain();
        }
    }, []);

    const clearOptions = () => {
        setPlayFlashcards(false);
        setMainHomePageLoad(!mainHomePageLoad);
        setEditPageLoad(!editPageLoad);
        clearInsomnia();
    };

    useEffect(() => {
        clearOptions();
    }, [location.pathname]);

    return (
        <div className={`o ${mainMenuVisible ? 'o-menu-visible' : ''}`}>

            <Header clearOptions={clearOptions} setMainHomePageLoad={setMainHomePageLoad} mainMenuVisible={mainMenuVisible} setMainMenuVisible={setMainMenuVisible} />

            <main className="o-main-content">
                {location.pathname !== "/" && (
                    <p><Link className="o-main-start w-100 btn btn--green" to="/"><i
                        className="icon-play"></i> {t('view_flashcards')}</Link></p>
                )}
                <Routes>
                    <Route path="/" element={<ViewFlashcards clearInsomnia={clearInsomnia} mainHomePageLoad={mainHomePageLoad} setMainHomePageLoad={setMainHomePageLoad} />}/>
                    <Route path="/list-edit" element={<EditSearchProvider><EditFlashcardList editPageLoad={editPageLoad} setEditPageLoad={setEditPageLoad} preloader={preloader} setPreloader={setPreloader} /></EditSearchProvider>}/>
                    <Route path="/create" element={<CreateFlashcard addFlashcard={addFlashcard} categories={categories} superCategoriesArray={superCategoriesArray} />} />
                    <Route path="/import-export" element={<ImportExport />} />
                    <Route path="/library" element={<Library />} />
                    <Route path="/Search" element={<EditSearchProvider><Search /></EditSearchProvider>} />
                    <Route path="*" element={<Navigate to="/" replace/>}/>
                </Routes>
            </main>
            <Footer clearOptions={clearOptions} setMainHomePageLoad={setMainHomePageLoad}  />
            <div className="o-main-footer-cover-scroll"/>
            {preloader ?
                <div className="o-preloader">
                    <p><i className="icon-logo-f"></i>{t('the_update_is_in_progress')}</p>
                    <div className="o-preloader__progress-bar"></div>
                </div>
                :
                ''}
        </div>
    );
}

export default App;

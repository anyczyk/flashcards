import React, {useContext, useEffect, useRef} from "react";
import {Link} from "react-router-dom";
import { useTranslation } from 'react-i18next';
import { FlashcardContext } from '../context/FlashcardContext';

const Header = ({setMainHomePageLoad, clearOptions, mainMenuVisible, setMainMenuVisible}) => {
    const { t, i18n } = useTranslation();
    const {
        playFlashcards,
        syntAudio,
        setSyntAudio
    } = useContext(FlashcardContext);

    const closeMenuRef = useRef(null);
    const closeMenuBtnRef = useRef(null);

    const changeLanguage = (lng) => {
        i18n.changeLanguage(lng);
    };

    const getLanguageCode = (lng) => lng.split('-')[0];

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

    const audioOnOff = () => {
        setSyntAudio(prev => !prev);
    };

    return (
        <header className="o-main-header">
            <h1><Link onClick={() => setMainHomePageLoad(true)} to="/"><i
                className="icon-logo-f"></i><strong>Flasho</strong></Link> - <span>{t('simple_flashcard_creator')}</span>
            </h1>
            <button
                aria-label="Audio on / off"
                className={`o-main-header__btn-audio ${syntAudio ? 'o-main-header__btn-audio--active' : ''}`}
                onClick={() => {
                        audioOnOff();
                    }
                }
                disabled={playFlashcards ? 'disabled' : ''}
            >
                <i className="icon-volume"></i>
            </button>
            <Link onClick={() => {
                clearOptions();
            }} to="/Search" className="btn o-main-header__btn-search"><i
                className="icon-search"></i></Link>
            <button ref={closeMenuBtnRef} onClick={showMainMenu}
                    className={`o-main-header__btn-menu ${mainMenuVisible ? 'o-main-header__btn-menu--active' : ''}`}
                    aria-label="Open and close menu"><span>Menu</span></button>

            <div ref={closeMenuRef}
                 className={`o-main-header__menu ${mainMenuVisible ? 'o-main-header__menu--active' : ''}`}
                 tabIndex="-1"
            >
                <div className="o-main-header__menu-langs">
                    <label htmlFor="o-lang"><i className="icon-language"></i> Lnag:</label>
                    <select id="o-lang" onChange={(e) => changeLanguage(e.target.value)}
                            value={getLanguageCode(i18n.language)}>
                        <option value="en">English</option>
                        <option value="de">Deutsch</option>
                        <option value="es">Español</option>
                        <option value="fr">Français</option>
                        <option value="id">Bahasa Indonesia</option>
                        <option value="it">Italiano</option>
                        <option value="ja">日本語</option>
                        <option value="pl">Polski</option>
                        <option value="pt">Português</option>
                    </select>
                </div>
                <nav>
                    <ul>
                        <li><Link onClick={() => {
                            setMainHomePageLoad(true);
                            showMainMenu();
                        }} to="/"><i
                            className="icon-play"></i> {t('view_flashcards')}</Link></li>

                        <li><Link onClick={() => {
                            clearOptions();
                            showMainMenu();
                        }} to="/list-edit"><i
                            className="icon-wrench"></i> {t('settings')}</Link></li>

                        <li><Link onClick={() => {
                            clearOptions();
                            showMainMenu();
                        }} to="/create"><i
                            className="icon-plus"></i> {t('add_flashcard')}</Link></li>

                        <li><Link onClick={() => {
                            clearOptions();
                            showMainMenu();
                        }} to="/import-export"><i
                            className="icon-export"></i> {t('import_export')}</Link>
                        </li>

                        <li><Link onClick={() => {
                            clearOptions();
                            showMainMenu();
                        }} to="/library"><i
                            className="icon-book"></i> {t('library')}</Link>
                        </li>

                        {/*<li><Link onClick={() => {*/}
                        {/*    clearOptions();*/}
                        {/*    showMainMenu();*/}
                        {/*}} to="/Search"><i*/}
                        {/*    className="icon-search"></i> {t('Search')}</Link>*/}
                        {/*</li>*/}
                    </ul>
                </nav>
                <div>
                    <p>Flasho v1.1.0 {window.cordova ? 'App' : 'Browser'} / <span
                        className="uppercase">{i18n.language}</span></p>
                </div>
            </div>
        </header>
    );
};
export default Header;
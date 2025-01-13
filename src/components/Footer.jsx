import React, {useEffect, useState} from "react";
import {Link} from "react-router-dom";
import {topScroll} from "../utils/topScroll";
import { useTranslation } from 'react-i18next';

const Footer = ({setMainHomePageLoad, clearOptions}) => {
    const { t, i18n } = useTranslation();

    const [showScrollTop, setShowScrollTop] = useState(false);

    // Funkcja obsługująca event scroll
    const handleScroll = () => {
        if (window.pageYOffset > 100) {
            setShowScrollTop(true);
        } else {
            setShowScrollTop(false);
        }
    };

    // Dodanie i usunięcie nasłuchiwania na scroll
    useEffect(() => {
        window.addEventListener("scroll", handleScroll);
        return () => {
            window.removeEventListener("scroll", handleScroll);
        };
    }, []);

    return (
        <>
            <footer className="o-main-footer">
                <ul>
                    <li><Link aria-label={t('view_flashcards')} onClick={() => setMainHomePageLoad(true)} to="/"><i
                        className="icon-logo-f"></i><span>{t('flashcards')}</span></Link></li>
                    <li><Link aria-label={t('edit_flashcards')} onClick={clearOptions} to="/list-edit"><i
                        className="icon-wrench"></i><span>{t('settings')}</span></Link>
                    </li>
                    <li><Link className="o-main-footer__add-circle bg-color-green" aria-label={t('create_flashcard')}
                              onClick={clearOptions} to="/create"><i
                        className="icon-plus"></i>
                    </Link></li>
                    <li><Link aria-label={t('import_export')} onClick={clearOptions} to="/import-export"><i
                        className="icon-export"></i><span>{t('import_export')}</span></Link>
                    </li>
                    <li><Link aria-label={t('library')} onClick={clearOptions} to="/library"><i
                        className="icon-book"></i><span>{t('library')}</span></Link>
                    </li>
                </ul>
            </footer>
            {showScrollTop &&
                <button className="o-up-to-top btn--icon" aria-label={t('up')} onClick={topScroll} to="#"><i
                    className="icon-up-open"></i><span>{t('up_to_top')}</span></button>}
        </>
    );
};
export default Footer;
import React, {useContext, useEffect, useState} from "react";
import {Link} from "react-router-dom";
import {topScroll} from "../utils/topScroll";
import { useTranslation } from 'react-i18next';
import {FlashcardContext} from "../context/FlashcardContext";

const Footer = ({clearOptions}) => {
    const { t, i18n } = useTranslation();
    const { isPremium} = useContext(FlashcardContext);

    const [showScrollTop, setShowScrollTop] = useState(false);

    const handleScroll = () => {
        if (window.pageYOffset > 100) {
            setShowScrollTop(true);
        } else {
            setShowScrollTop(false);
        }
    };

    useEffect(() => {
        window.addEventListener("scroll", handleScroll);
        return () => {
            window.removeEventListener("scroll", handleScroll);
        };
    }, []);

    return (
        <>
            <footer dir="ltr" className="o-main-footer">
                <ul>
                    <li><Link aria-label={t('view_flashcards')} onClick={clearOptions} to="/"><i
                        className="icon-logo-f"></i><span>{t('flashcards')}</span></Link></li>
                    <li><Link aria-label={t('edit_flashcards')} onClick={clearOptions} to="/list-edit"><i
                        className="icon-pencil"></i><span>{t('edit')}</span></Link>
                    </li>
                    <li><Link className="o-main-footer__add-circle bg-color-green" aria-label={t('create_flashcard')}
                              to="/create"><i
                        className="icon-plus"></i>
                    </Link></li>
                    <li><Link aria-label={t('import_export')} to="/import-export"><i
                        className="icon-export"></i><span>{t('import_export')}</span></Link>
                    </li>
                    <li><Link aria-label={t('library')} to="/library"><i
                        className="icon-book" /><i className={`icon-crown o-icon-premium ${isPremium ? 'o-icon-premium--active' : ''}`} /><span>{t('library')}</span></Link>
                    </li>
                </ul>
            </footer>
            {showScrollTop &&
                <button onClick={topScroll} className="o-up-to-top btn--icon" aria-label={t('up')}><i
                    className="icon-up-open" /><span>{t('up_to_top')}</span></button>}
        </>
    );
};
export default Footer;
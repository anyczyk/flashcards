import React from "react";
import {Link} from "react-router-dom";
import {useTranslation} from "react-i18next";

const NoFlashcards = () => {
    const { t } = useTranslation();
    return (
        <div className="o-no-flashcards">
            <p>{t('no_flashcards')}</p>
            <ul className="o-list-buttons-clear o-list-buttons-clear--nowrap o-default-box">
                <li>
                    <Link className="btn w-100" to="/create">
                        <i className="icon-plus"></i> {t('create_flashcard')}
                    </Link>
                </li>
                <li>
                    <Link className="btn w-100" to="/import-export">
                        <i className="icon-export"></i> {t('import_export')}
                    </Link>
                </li>
            </ul>
            <p>{t('choose_set_from_library')}</p>
            <Link className="btn w-100 btn--blue" to="/library">
                <i className="icon-book"></i> {t('library')}
            </Link>
        </div>
    );
};
export default NoFlashcards;
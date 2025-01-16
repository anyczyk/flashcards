// Library.jsx

import React, {} from 'react';
import { useTranslation } from 'react-i18next';
import FilesListImportFree from "./sub-components/common/FilesListImportFree";

function Library() {
    const { t } = useTranslation();


    return (
        <div className="o-page-library">
            <h2>{t('library')}</h2>
            <hr/>
            <h3>{t('free_flashcards')}</h3>
            <FilesListImportFree/>
        </div>
    );
}

export default Library;

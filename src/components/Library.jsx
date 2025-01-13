// Library.jsx

import React, {} from 'react';
import { useTranslation } from 'react-i18next';
import FilesListImportFree from "./sub-components/common/FilesListImportFree";

function Library() {
    const { t } = useTranslation();


    return (
        <div className="o-page-import-export">
            <h2>Library</h2>
            <hr />
            <FilesListImportFree />
        </div>
    );
}

export default Library;

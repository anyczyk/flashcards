// Library.jsx

import React, {useContext, useState} from 'react';
import { useTranslation } from 'react-i18next';
import FilesListImportFree from "./sub-components/common/FilesListImportFree";
import AdButton from "./sub-components/common/AdButton";
import Premium from "./sub-components/Library/Premium";
import {FlashcardContext} from "../context/FlashcardContext";

function Library() {
    const { t } = useTranslation();
    const [timerAccess, setTimerAccess] = useState(0);
    const {
        isPremium
    } = useContext(FlashcardContext);

    return (
        <div className="o-page-library">
            <h2>{t('library')}</h2>
            <hr/>
            {window.cordova ? <><Premium /><hr /></> : '' }
            {!isPremium && <>
                {!(timerAccess > 0) && <p>{t('free_access_courses_or_support')}:</p>}
                <AdButton timerAccess={timerAccess} setTimerAccess={setTimerAccess} />
            </>}
            <FilesListImportFree timerAccess={timerAccess} />
        </div>
    );
}

export default Library;

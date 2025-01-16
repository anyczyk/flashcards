// EditButton.jsx

import React from 'react';
import { useTranslation } from 'react-i18next';

const EditButton = ({ cardId, startEditingById }) => {
    const { t } = useTranslation();

    const handleEdit = () => {
        startEditingById(cardId);
    };

    return (
        <button onClick={handleEdit} className="btn--edit">
            <i className="icon-pencil"></i> {t('edit')}
        </button>
    );
};

export default EditButton;
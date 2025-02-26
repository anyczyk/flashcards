// SelectSuperCategory.jsx

import React, {useContext, useEffect, useRef} from "react";
import { useTranslation } from "react-i18next";
import { useLocation } from "react-router-dom";
import {FlashcardContext} from "../../../context/FlashcardContext";

const SelectSuperCategory = ({
                                 superCategory,
                                 setSuperCategory,
                                 superCategoriesArray,
                                 setCurrentSelectSuperCategory
                             }) => {
    const { t } = useTranslation();
    const {
        dirAttribute
    } = useContext(FlashcardContext);
    const location = useLocation();
    const queryParams = new URLSearchParams(location.search);
    const getSuperCategory = queryParams.get("superCategory");
    const refInputTextSuperCategory = useRef();
    const refSelectTextSuperCategory = useRef();

    useEffect(() => {
        if (getSuperCategory) {
            setSuperCategory(getSuperCategory);
            setCurrentSelectSuperCategory(getSuperCategory);
        }
    }, [getSuperCategory, setSuperCategory, setCurrentSelectSuperCategory]);

    const handleSuperCategorySelect = (e) => {
        const selected = e.target.value;
        setSuperCategory(selected);
        setCurrentSelectSuperCategory(selected);
    };

    const handleInputChange = (e) => {
        const newValue = e.target.value;
        setSuperCategory(newValue);
        setCurrentSelectSuperCategory(newValue);
    };

    const handleClear = () => {
        setSuperCategory('');
        setCurrentSelectSuperCategory('');
        if (refInputTextSuperCategory.current) {
            refInputTextSuperCategory.current.focus();
        }
    };

    return (
        <>
            <div className="o-default-box">
                <label htmlFor="o-super-category">{t('folder')}:</label>
                {superCategoriesArray.length > 0 && <select
                    ref={refSelectTextSuperCategory}
                    id="o-super-category"
                    onChange={handleSuperCategorySelect}
                    value={superCategory || ""}
                >
                    <option value="">
                        -- {t('select_existing_folder')} --
                    </option>
                    {superCategoriesArray.map((cat, index) => (
                        <option key={index} value={cat}>
                            {cat}
                        </option>
                    ))}
                </select>}
            </div>

            <div
                className={`o-default-box o-text-input-with-clear ${superCategory ? 'o-text-input-with-clear--active' : ''}`}>
                <input
                    ref={refInputTextSuperCategory}
                    type="text"
                    maxLength="60"
                    placeholder={t('type_a_new_folder_or_edit_selected_one')}
                    value={superCategory || ""}
                    onChange={handleInputChange}
                />
                {superCategory && (
                    <button
                        className="o-text-input-with-clear__button-clear"
                        onClick={handleClear}
                        aria-label="Clear input"
                    >
                        <i className="icon-cancel" />
                    </button>
                )}
            </div>
        </>
    );
};

export default SelectSuperCategory;

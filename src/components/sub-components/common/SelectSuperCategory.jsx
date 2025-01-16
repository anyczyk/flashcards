// SelectSuperCategory.jsx

import React, { useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { useLocation } from "react-router-dom";

const SelectSuperCategory = ({
                                 superCategory,
                                 setSuperCategory,
                                 superCategoriesArray,
                                 setCurrentSelectSuperCategory
                             }) => {
    const { t } = useTranslation();
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
            <p>
                <label htmlFor="o-super-category">{t("super_category")}:</label>
                <br />
                <select
                    ref={refSelectTextSuperCategory}
                    id="o-super-category"
                    onChange={handleSuperCategorySelect}
                    value={superCategory || ""}
                >
                    <option value="">
                        -- {t("select_existing_super_category")} --
                    </option>
                    {superCategoriesArray.map((cat, index) => (
                        <option key={index} value={cat}>
                            {cat}
                        </option>
                    ))}
                </select>
            </p>

            <p className={`o-text-input-with-clear ${superCategory ? 'o-text-input-with-clear--active' : ''}`}>
                <input
                    ref={refInputTextSuperCategory}
                    type="text"
                    maxLength="60"
                    placeholder={t("type_a_new_super_category_or_edit_selected_one")}
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
            </p>
        </>
    );
};

export default SelectSuperCategory;

import React, { useEffect } from "react";
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

    useEffect(() => {
        if (getSuperCategory) {
            setSuperCategory(getSuperCategory);
            setCurrentSelectSuperCategory(getSuperCategory);
        }
    }, [getSuperCategory]);

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

    return (
        <>
            <p>
                <label htmlFor="o-super-category">{t("super_category")}:</label>
                <br />
                <select
                    id="o-super-category"
                    onChange={handleSuperCategorySelect}
                    value={superCategory || ""} // superCategory może być undefined
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

            <p>
                <input
                    type="text"
                    maxLength="60"
                    placeholder={t("type_a_new_super_category_or_edit_selected_one")}
                    value={superCategory || ""}
                    onChange={handleInputChange}
                />
            </p>
        </>
    );
};

export default SelectSuperCategory;

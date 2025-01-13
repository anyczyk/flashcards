import React from "react";
import {useTranslation} from "react-i18next";

const SelectCategory = ({category, setCategory, categoriesDependentOnSuperCategory}) => {
    const {t} = useTranslation();
    const handleCategorySelect = (e) => {
        const selected = e.target.value;
        if (selected) {
            setCategory(selected);
        } else {
            setCategory('');
        }
    };

    return (
        <>
            <p>
                <label htmlFor="o-category">
                    {t('category')}:
                </label>
                <br/>
                <select id="o-category" onChange={handleCategorySelect} value={category}>
                    <option value="">-- {t('select_existing_category')} --</option>
                    {categoriesDependentOnSuperCategory.map((cat, index) => (
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
                    placeholder={t('type_a_new_category_or_edit_selected_one')}
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                />
            </p>
        </>
    );
};
export default SelectCategory;
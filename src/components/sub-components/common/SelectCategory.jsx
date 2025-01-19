import React, { useRef, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

const SelectCategory = ({
                            getCategory,
                            category,
                            setCategory,
                            categoriesDependentOnSuperCategory
                        }) => {
    const { t } = useTranslation();
    const [internalCategory, setInternalCategory] = useState(getCategory || category || "");

    const refInputTextCategory = useRef();
    useEffect(() => {
        if (getCategory !== undefined && getCategory !== null) {
            setInternalCategory(getCategory);
        }
    }, [getCategory]);

    const handleCategorySelect = (e) => {
        const selected = e.target.value;
        setInternalCategory(selected);
        if (setCategory) {
            setCategory(selected);
        }
    };

    const handleClear = () => {
        setInternalCategory("");
        if (setCategory) {
            setCategory("");
        }
        if (refInputTextCategory.current) {
            refInputTextCategory.current.focus();
        }
    };

    const handleInputChange = (e) => {
        const val = e.target.value;
        setInternalCategory(val);
        if (setCategory) {
            setCategory(val);
        }
    };

    return (
        <>
            <p>
                <label htmlFor="o-category">
                    {t("category")}:
                </label>
                <select
                    id="o-category"
                    onChange={handleCategorySelect}
                    value={internalCategory}
                >
                    <option value="">
                        -- {t("select_existing_category")} --
                    </option>
                    {categoriesDependentOnSuperCategory.map((cat, index) => (
                        <option key={index} value={cat}>
                            {cat}
                        </option>
                    ))}
                </select>
            </p>

            <p className={`o-text-input-with-clear ${internalCategory ? "o-text-input-with-clear--active" : ""}`}>
                <input
                    ref={refInputTextCategory}
                    type="text"
                    maxLength="60"
                    placeholder={t("type_a_new_category_or_edit_selected_one")}
                    value={internalCategory}
                    onChange={handleInputChange}
                />
                {internalCategory && (
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

export default SelectCategory;



// // SelectCategory.jsx
//
// import React, {useRef} from "react";
// import {useTranslation} from "react-i18next";
//
// const SelectCategory = ({category, setCategory, categoriesDependentOnSuperCategory}) => {
//     const {t} = useTranslation();
//     const refInputTextCategory = useRef();
//     const handleCategorySelect = (e) => {
//         const selected = e.target.value;
//         if (selected) {
//             setCategory(selected);
//         } else {
//             setCategory('');
//         }
//     };
//
//     const handleClear = () => {
//         setCategory('');
//         if (refInputTextCategory.current) {
//             refInputTextCategory.current.focus();
//         }
//     };
//
//     return (
//         <>
//             <p>
//                 <label htmlFor="o-category">
//                     {t('category')}:
//                 </label>
//                 <select id="o-category" onChange={handleCategorySelect} value={category}>
//                     <option value="">-- {t('select_existing_category')} --</option>
//                     {categoriesDependentOnSuperCategory.map((cat, index) => (
//                         <option key={index} value={cat}>
//                             {cat}
//                         </option>
//                     ))}
//                 </select>
//             </p>
//             <p className={`o-text-input-with-clear ${category ? 'o-text-input-with-clear--active' : ''}`}>
//                 <input
//                     type="text"
//                     maxLength="60"
//                     placeholder={t('type_a_new_category_or_edit_selected_one')}
//                     value={category}
//                     onChange={(e) => setCategory(e.target.value)}
//                 />
//                 {category && (
//                     <button
//                         className="o-text-input-with-clear__button-clear"
//                         onClick={handleClear}
//                         aria-label="Clear input"
//                     >
//                         <i className="icon-cancel"/>
//                     </button>
//                 )}
//             </p>
//         </>
//     );
// };
// export default SelectCategory;
import React, {useContext} from "react";
import {FlashcardContext} from "../../../context/FlashcardContext";
const SelectCodeLanguages = ({id, value, setFunction, availableLanguages}) => {
    const { languageMap } = useContext(FlashcardContext);
    return (
        <select
            id={id}
            value={value}
            onChange={(e) => setFunction(e.target.value)}
            required
        >
            {availableLanguages.length === 0 &&
                <option value="">Loading...</option>}
            {availableLanguages.map((lang, index) => (
                <option key={index} value={lang}>{lang} - {languageMap[lang]}</option>
            ))}
        </select>
    );
};
export default SelectCodeLanguages;
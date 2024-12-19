import React from "react";

const SelectCodeLanguages = ({id, value, setFunction, availableLanguages}) => {
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
                <option key={index} value={lang}>{lang}</option>
            ))}
        </select>
    );
};
export default SelectCodeLanguages;
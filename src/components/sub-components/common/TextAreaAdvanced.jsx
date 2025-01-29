import React, {useContext, useRef} from "react";
import {FlashcardContext} from "../../../context/FlashcardContext";
import {useTranslation} from "react-i18next";


const TextAreaAdvanced = ({id, set = null, state, langForB, required, placeholder = ''}) => {
    const { rtlCodeLangs } = useContext(FlashcardContext);
    const { t } = useTranslation();
    const refOut = useRef(null);
    const buttonTag = (e, tag, refIn, set, state) => {
        e.preventDefault();
        let sampleText;
        if(tag === 'b') {
            sampleText = t('bold_text');
        } else if(tag === 'i') {
            sampleText = t('italic_text');
        }
        const textarea = refIn.current;
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const selectedText = textarea.value.substring(start, end);
        const wrappedText = selectedText ? `[${tag}]${selectedText}[/${tag}]` : `[${tag}]${sampleText}[/${tag}] `;
        set(state.substring(0, start) + wrappedText + state.substring(end));
        textarea.focus();
    };

    return <div className="o-textarea-advanced">
        <textarea
            ref={refOut}
            value={state}
            onChange={(e) => set(e.target.value)}
            rows="3"
            cols="30"
            id={id}
            dir={rtlCodeLangs.includes(langForB) ? 'rtl' : 'ltr'}
            maxLength="1200"
            required={required}
            placeholder={`${placeholder}...`}
        />
        <div className="o-textarea-advanced__tools gap-05 d-flex justify-content-right">
            <button className="btn--icon" onClick={(e) => buttonTag(e, 'b', refOut, set, state)}>
                b
            </button>
            <button className="btn--icon" onClick={(e) => buttonTag(e, 'i', refOut, set, state)}>
                i
            </button>
        </div>
    </div>;
};

export default TextAreaAdvanced;
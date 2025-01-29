import React, {useContext, useState} from "react";
import {useTranslation} from "react-i18next";
import {FlashcardContext} from "../context/FlashcardContext";
import {useNavigate} from "react-router-dom";

const Settings = ({globalNoShadows, setGlobalNoShadows}) => {
    const { t } = useTranslation();
    const {
        syntAudio,
        audioOnOff
    } = useContext(FlashcardContext);
    const navigate = useNavigate();
    const handleGlobalNoShadows = () => {
        setGlobalNoShadows(prev => !prev);
    };

    return (
        <>
            <div className="o-page-settings">
                <h2>{t('settings')}</h2>
                <hr/>
                <ul className="o-list-buttons-clear">
                    <li className="w-100">
                        <button onClick={() => navigate('/list-edit')} className="w-100">
                            <i className="icon-pencil" /> {t('edit_flashcards')}
                        </button>
                    </li>
                    <li className="w-100">
                        <button className={`w-100 ${!syntAudio ? 'btn--active' : ''}`}
                                onClick={audioOnOff}><i className={syntAudio ? 'icon-volume' : 'icon-volume-off'} /> {syntAudio ? t('turn_off_automatic_audio') : t('turn_on_automatic_audio')}</button>
                    </li>
                    <li className="w-100">
                        <button className={`w-100 ${!globalNoShadows ? 'btn--active' : ''}`} onClick={handleGlobalNoShadows}>{!globalNoShadows ? t('turn_on_shadows') : t('turn_off_shadows')}</button>
                    </li>
                </ul>
            </div>
        </>
    );
};
export default Settings;
import React, { useState, useEffect, useContext } from "react";
import {FlashcardContext} from "../../../context/FlashcardContext";
import {getLocalStorage, removeLocalStorage, setLocalStorage} from "../../../utils/storage";
import {useTranslation} from "react-i18next";

const PremiumBrowser = () => {
    const { t } = useTranslation();
    const {
        isPremium, setIsPremium
    } = useContext(FlashcardContext);

    const orderProduct = () => {
        setLocalStorage('oIsPremium4', 'true');
        setIsPremium(true);
    };

    const restoreProduct = () => {
        removeLocalStorage('oIsPremium4');
        setIsPremium(false);
    }

    return (
        <div className="o-default-box">
            {isPremium ?
                <>
                    <p><i className="icon-crown o-icon-premium--active"/> {t('premium_account')}: {t('active')}</p>
                    <button onClick={restoreProduct}>Wyłącz konto premium (dev)</button>
                </>
                :
                <>
                    <p><i className="icon-crown"/>
                        {t('buy_premium_desc')}
                    </p>
                    <button onClick={orderProduct}>{t('buy_premium_account')}</button>
                </>
            }
        </div>
    );
};

export default PremiumBrowser;
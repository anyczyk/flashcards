import React, { useState, useEffect, useContext } from "react";
import {FlashcardContext} from "../../../context/FlashcardContext";
import {getLocalStorage, removeLocalStorage, setLocalStorage} from "../../../utils/storage";
import {useTranslation} from "react-i18next";
import {showInterstitial} from "../../../services/admobService";

const PremiumBrowser = () => {
    const { t } = useTranslation();
    const {
        isPremium, setIsPremium
    } = useContext(FlashcardContext);
    const [codeValue, setCodeValue] = useState("");
    // Precomputed SHA-256 hash dla ciągu "offpremium"
    const CORRECT_HASH_OFF_PREMIUM = "03e80960a61c1255174c7e03083fc50017b301fe2d8593e8b8731d1019e31718";
    // Precomputed SHA-256 hash dla ciągu "showad"
    const SHOW_AD = "4e976964e42813f0235f36f97268b19f58db72ad4c73f62a49a5d7a87c44195a";


    const orderProduct = () => {
        setLocalStorage('oIsPremium4', 'true');
        setIsPremium(true);
    };

    const restoreProduct = () => {
        removeLocalStorage('oIsPremium4');
        setIsPremium(false);
    }

    const computeSHA256 = async (message) => {
        const encoder = new TextEncoder();
        const data = encoder.encode(message);
        const hashBuffer = await crypto.subtle.digest("SHA-256", data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const hashHex = hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
        return hashHex;
    }

    const handleButtonCode = async () => {
        const hashedCode = await computeSHA256(codeValue.trim());
        // alert('hashedCode: ' + hashedCode);
        // alert('CORRECT_HASH_OFF_PREMIUM: ' + CORRECT_HASH_OFF_PREMIUM);
        if (hashedCode === CORRECT_HASH_OFF_PREMIUM) {
            restoreProduct();
        } else if(hashedCode === SHOW_AD) {
            alert("Ad sample...");
        } else {
            alert(t('wrong_code'));
        }
        setCodeValue('');
    }

    return (
        <div className="o-default-box">
            <p>
                <input
                    className="w-100"
                    type="text"
                    placeholder={t('code')}
                    value={codeValue}
                    onChange={(e) => setCodeValue(e.target.value)}/>
            </p>
            <p>
                <button className="w-100" onClick={handleButtonCode}>{t('confirm')}</button>
            </p>

            {isPremium ?
                <>
                    <p><i className="icon-crown o-icon-premium--active"/> {t('premium_account')}: {t('active')}</p>
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
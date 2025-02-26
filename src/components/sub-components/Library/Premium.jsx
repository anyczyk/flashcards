import React, {useContext, useEffect, useState} from "react";
import {FlashcardContext} from "../../../context/FlashcardContext";
import {getLocalStorage, removeLocalStorage, setLocalStorage} from "../../../utils/storage";
import {useTranslation} from "react-i18next";
import {showInterstitial} from "../../../services/admobService";
import { useLocation } from 'react-router-dom';

const Premium = () => {
    const { t } = useTranslation();
    const location = useLocation();
    const {
        isPremium, setIsPremium
    } = useContext(FlashcardContext);
    const [iapProduct, setIapProduct] = useState(null);
    const productId = "premium_flasho_4";
    const [codeValue, setCodeValue] = useState("");
    // Precomputed SHA-256 hash dla ciągu "offpremium"
    const CORRECT_HASH_OFF_PREMIUM = "03e80960a61c1255174c7e03083fc50017b301fe2d8593e8b8731d1019e31718";

    // Precomputed SHA-256 hash dla ciągu "showad"
    const SHOW_AD = "4e976964e42813f0235f36f97268b19f58db72ad4c73f62a49a5d7a87c44195a";


    useEffect(() => {
        const onDeviceReady = () => {
            // alert('storage: ' + getLocalStorage('oIsPremium4'));
            if (getLocalStorage('oIsPremium4') === 'true') {
                setIsPremium(true);
                return;
            } else {
                // alert("local storage - oIsPremium4 - istnieje");
            }

            // alert("cos tam");

            const { store, ProductType, Platform } = window.CdvPurchase;
            const platformName = Platform.GOOGLE_PLAY;

            store.verbosity = store.DEBUG;

            store.register({
                type: ProductType.NON_CONSUMABLE,
                id: productId,
                platform: platformName,
            });

            store.when().productUpdated(refreshUI).approved(finishPurchase);
            store.initialize([platformName, ProductType.NON_CONSUMABLE]);
        };

        document.addEventListener('deviceready', onDeviceReady, false);

        return () => {
            document.removeEventListener('deviceready', onDeviceReady, false);
        };

    }, []);

    const finishPurchase = (p) => {
        // alert("Transakcja przeszla pomyslnie, ustawiamy storage na true i isPremium na true");
        setIsPremium(true);
        setLocalStorage('oIsPremium4', 'true');
        p.finish();
        refreshUI();
        // alert("Jest chyba ok");
    };

    const refreshUI = () => {
        const { store, ProductType, Platform } = window.CdvPurchase;
        setIapProduct(
            store.get(
                productId,
                Platform.GOOGLE_PLAY,
                ProductType.NON_CONSUMABLE
            )
        );
    };

    useEffect(() => {
        // const onDeviceReady = () => {
        //     refreshUI();
        //     alert("refresh UI");
        // };

        document.addEventListener("deviceready", refreshUI, false);

        return () => {
            document.removeEventListener("deviceready", refreshUI, false);
        };
    },[]);

    const orderProduct = () => {
        iapProduct.getOffer().order();
    };

    const restoreProduct = () => {
        removeLocalStorage('oIsPremium4');
        setIsPremium(false);
        const { store } = window.CdvPurchase;
        store.restorePurchases();
    }

    const computeSHA256 = async (message) => {
        const encoder = new TextEncoder();
        const data = encoder.encode(message);
        const hashBuffer = await crypto.subtle.digest("SHA-256", data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
    }

    const handleButtonCode = async () => {
        const hashedCode = await computeSHA256(codeValue.trim());
        // alert('hashedCode: ' + hashedCode);
        // alert('CORRECT_HASH_OFF_PREMIUM: ' + CORRECT_HASH_OFF_PREMIUM);
        if (hashedCode === CORRECT_HASH_OFF_PREMIUM) {
            restoreProduct();
        } else if(hashedCode === SHOW_AD) {
            showInterstitial(false, true);
        } else {
            alert(t('wrong_code'));
        }
        setCodeValue('');
    }


    return (
        <div className="o-default-box">
            {/*<h3>{iapProduct?.title}</h3>*/}
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
            {isPremium &&
                <>
                    <p><i className="icon-crown o-icon-premium--active"/> {t('premium_account')}: {t('active')}</p>
                    {/*<button onClick={restoreProduct}>*/}
                    {/*    Wyłącz konto premium (dev)*/}
                    {/*</button>*/}
                </>}
            {(iapProduct && !isPremium) &&
                <>
                    <p><i className="icon-crown"/>
                        {t('buy_premium_desc')}
                    </p>
                    <p>{(iapProduct?.description ? `${iapProduct.description || ''}` : '-')}</p>
                    <p>Price: {iapProduct?.offers[0].pricingPhases[0].price}</p>
                    <button onClick={() => orderProduct()}>{t('buy_premium_account')}</button>
                </>
            }
        </div>
    );
};

export default Premium;
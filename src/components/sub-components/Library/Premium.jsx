import React, { useState, useEffect, useContext } from "react";
import {FlashcardContext} from "../../../context/FlashcardContext";
import {getLocalStorage, removeLocalStorage, setLocalStorage} from "../../../utils/storage";
import {useTranslation} from "react-i18next";

const Premium = () => {
    const { t } = useTranslation();
    const {
        isPremium, setIsPremium
    } = useContext(FlashcardContext);
    const [iapProduct, setIapProduct] = useState(null);
    const productId = "premium_flasho_4";


    useEffect(() => {
        const onDeviceReady = () => {
            if (getLocalStorage('oIsPremium4') === 'true') {
                setIsPremium(true);
                return;
            }

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
        alert("Transakcja przeszla pomyslnie, ustawiamy storage na true i isPremium na true");
        setIsPremium(true);
        setLocalStorage('oIsPremium4', 'true');
        p.finish();
        refreshUI();
        alert("Jest chyba ok");
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

    const orderProduct = () => {
        iapProduct.getOffer().order();
    };

    const restoreProduct = () => {
        removeLocalStorage('oIsPremium4');
        setIsPremium(false);
        const { store } = window.CdvPurchase;
        store.restorePurchases();
    }

    return (
        <div className="o-default-box">
            <h3>{iapProduct?.title}</h3>
            {isPremium ?
                <>
                    <p><i className="icon-crown o-icon-premium--active" /> {t('premium_account')}: {t('active')}</p>
                    <button onClick={() => restoreProduct()}>Wyłącz konto premium (dev)</button>
                </>
                :
                <>
                    <p><i className="icon-crown" />
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
import React, { useState, useEffect, useContext } from "react";
import {FlashcardContext} from "../../../context/FlashcardContext";
import {getLocalStorage, removeLocalStorage, setLocalStorage} from "../../../utils/storage";

const Premium = () => {
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
            <p>{isPremium ? 'Masz konto premium!!' : 'Nie masz konta premium'}</p>
            {isPremium ? <button onClick={() => restoreProduct()}>Restore Product</button> : <>
                <p>{(iapProduct?.description ? `${iapProduct.description || ''}` : 'No data')}</p>
                <p>Price: {iapProduct?.offers[0].pricingPhases[0].price}</p>
                <button onClick={() => orderProduct()}>Purchase Product</button>
            </>}
        </div>
    );
};

export default Premium;

// import React, {useContext, useEffect, useState} from 'react';
// import {FlashcardContext} from "../../../context/FlashcardContext";
//
// const Premium = () => {
//     const {
//         isPremium, setIsPremium
//     } = useContext(FlashcardContext);
//
//     const [product, setProduct] = useState(null);
//     const [transaction, setTransaction] = useState(null);
//     const [error, setError] = useState(null);
//
//     useEffect(() => {
//         const onDeviceReady = () => {
//             const { store, ProductType, Platform } = window.CdvPurchase;
//             store.verbosity = store.DEBUG;
//             // console.log("window.CdvPurchase: ", window.CdvPurchase);
//             store.register([{
//                 type: ProductType.NON_CONSUMABLE,
//                 id: 'premium_flasho_4',
//                 platform: Platform.GOOGLE_PLAY,
//             }]);
//             store.when()
//                 .productUpdated(() => {
//                     refreshUI();
//                 })
//                 .approved((transaction) => {
//                     finishPurchase(transaction);
//                 });
//             store.initialize([Platform.GOOGLE_PLAY]).then(() => {
//                 refreshUI();
//             });
//         };
//
//         // Inicjalizacja stanu premium z localStorage
//         const premiumStatus = localStorage.getItem('oIsPremium4');
//         if (premiumStatus === 'true') {
//             setIsPremium(true);
//         }
//
//         document.addEventListener('deviceready', onDeviceReady, false);
//
//         return () => {
//             document.removeEventListener('deviceready', onDeviceReady, false);
//         };
//     }, []);
//
//     const finishPurchase = (transaction) => {
//         alert("Transakcja zakonczona i udana");
//         alert("transaction: " + transaction);
//         transaction.finish();
//         setIsPremium(true);
//         localStorage.setItem('oIsPremium4', 'true');
//         refreshUI();
//     };
//
//     const refreshUI = () => {
//         const { store, Platform } = window.CdvPurchase;
//         const myProduct = store.get('premium_flasho_4', Platform.GOOGLE_PLAY);
//         const myTransaction = store.findInLocalReceipts(myProduct);
//         setProduct(myProduct);
//         setTransaction(myTransaction);
//         // Sprawdzenie, czy transakcja jest zatwierdzona i zakończona
//         if (myTransaction && myTransaction.state === store.APPROVED) {
//             setIsPremium(true);
//             localStorage.setItem('oIsPremium4', 'true');
//         } else {
//             setIsPremium(false);
//             localStorage.removeItem('oIsPremium4');
//         }
//     };
//
//     const handlePurchase = () => {
//         if (product && product.getOffer()) {
//             product.getOffer().order()
//                 .then(transaction => {
//                     // Sukces – transakcja została zatwierdzona
//                     console.log('Purchase successful:', transaction);
//                     finishPurchase(transaction);
//                 })
//                 .catch(error => {
//                     // Obsługa błędów
//                     if (error.code === window.CdvPurchase.ErrorCode.PAYMENT_CANCELLED) {
//                         console.log('Payment cancelled by user');
//                     } else {
//                         console.log('Failed to purchase:', error);
//                         setError(`Failed to purchase: ${error}`);
//                     }
//                 });
//         }
//     };
//
//     return (
//         <div>
//             <ul>
//                 <li>
//                     Product.state: {transaction ? transaction.state : ''}
//                 </li>
//                 <li>
//                     Title: {product ? product.title : ''}
//                 </li>
//                 <li>
//                     Descr: {product ? product.description : ''}
//                 </li>
//                 <li>
//                     Price: {product ? product.pricing.price : ''}
//                 </li>
//             </ul>
//             {isPremium ? (
//                 <p>Masz wersję premium</p>
//             ) : (
//                 <>
//                     {product && product.canPurchase && (
//                         <button onClick={handlePurchase}>Purchase</button>
//                     )}
//                     <p>Brak wersji premium</p>
//                     {error && <p style={{ color: 'red' }}>{error}</p>}
//                 </>
//             )}
//         </div>
//     );
// };
//
// export default Premium;

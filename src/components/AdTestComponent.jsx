import React, { useEffect, useRef } from 'react';
// const idAd = 'ca-app-pub-4263972941440160/3706529496'; // real
const idAd = 'ca-app-pub-3940256099942544/1033173712'; // test
const AdTestComponent = () => {
    const interstitialRef = useRef(null);

    useEffect(() => {
        const onDeviceReady = async () => {
            try {
                await window.admob.start();
                const interstitial = new window.admob.InterstitialAd({
                    adUnitId: idAd,
                });
                interstitialRef.current = interstitial;
                interstitial.on('error', (err) => alert('Interstitial ERROR: ' + JSON.stringify(err)));
                await interstitial.load();
            } catch (e) {
                console.log('Error in onDeviceReady: ' + JSON.stringify(e));
            }
        };
        const onAdDismiss = async () => {
            try {
                if (!interstitialRef.current) {
                    return;
                }
                await interstitialRef.current.load();
            } catch (err) {
                console.log('Error load() after dismiss: ' + JSON.stringify(err));
            }
        };
        document.addEventListener('deviceready', onDeviceReady, false);
        document.addEventListener('admob.ad.dismiss', onAdDismiss, false);
        return () => {
            document.removeEventListener('deviceready', onDeviceReady, false);
            document.removeEventListener('admob.ad.dismiss', onAdDismiss, false);
        };
    }, []);
    const showInterstitial = async () => {
        try {
            if (!interstitialRef.current) {
                return;
            }
            await interstitialRef.current.show();
        } catch (err) {
            console.log('Error in showInterstitial: ' + JSON.stringify(err));
        }
    };

    return (
        <button onClick={showInterstitial}>
            Show ad
        </button>
    );
};

export default AdTestComponent;

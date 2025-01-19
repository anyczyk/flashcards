// admobService.js
let interstitial = null;
// const idAd = 'ca-app-pub-4263972941440160/3706529496'; // real
const idAd = 'ca-app-pub-3940256099942544/1033173712'; // test
// Funkcja inicjująca AdMob i tworząca interstitial
const initializeAdMob = async () => {
    if(window.cordova) {
        try {
            // Upewnij się, że plugin AdMob jest dostępny
            if (!window.admob) {
                console.error('Brak wtyczki AdMob! (window.admob nie istnieje)');
                return;
            }

            // Inicjalizacja AdMob (jeśli wymagana)
            await window.admob.start();
            console.log('admob.start() OK');

            // Tworzenie interstitiala
            interstitial = new window.admob.InterstitialAd({
                adUnitId: idAd,
            });

            // Obsługa zdarzeń
            interstitial.on('load', () => {
                console.log('Interstitial LOADED!');
            });

            interstitial.on('error', (err) => {
                console.error('Interstitial ERROR:', err);
            });

            interstitial.on('dismiss', async () => {
                console.log('Interstitial DISMISSED');
                // Po zamknięciu reklamy ładujemy ponownie
                try {
                    await interstitial.load();
                    console.log('Załadowano ponownie po dismiss');
                } catch (err) {
                    console.error('Błąd ponownego load() po dismiss:', err);
                }
            });

            // Ładowanie reklamy po inicjalizacji
            await interstitial.load();
            console.log('interstitial.load() OK');
        } catch (e) {
            console.error('Błąd w initializeAdMob:', e);
        }
    }
};

// Funkcja do wyświetlania interstitiala
export const showInterstitial = async () => {
    if(window.cordova) {
        try {
            if (!interstitial) {
                console.warn('Brak interstitial (jeszcze niezaładowany)');
                return;
            }
            await interstitial.show();
            console.log('interstitial.show() OK');
        } catch (err) {
            console.error('Błąd w showInterstitial:', err);
        }
    }
};

document.addEventListener('deviceready', initializeAdMob, false);
document.addEventListener('admob.ad.dismiss', async () => {}, false);

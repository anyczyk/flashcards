// speak.js
const speak = (text, lang) => {
    if (window.TTS) {
        window.TTS.speak({
            text,
            locale: lang,
            rate: 1.0
        }, () => {
            console.log('Sukces: Mowa zakończona');
        }, (error) => {
            console.error('Błąd TTS: ', error);
        });
    } else if (window.speechSynthesis) {
        const synth = window.speechSynthesis;
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = lang;
        synth.speak(utterance);
    }
};

// stopSpeaking.js
const stopSpeaking = () => {
    if (window.TTS && typeof window.TTS.stop === 'function') {
        window.TTS.stop(() => {
            console.log('Sukces: Mowa zatrzymana');
        }, (error) => {
            console.error('Błąd podczas zatrzymywania TTS: ', error);
        });
    } else if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
        console.log('Sukces: Mowa zatrzymana za pomocą speechSynthesis');
    } else {
        console.warn('Brak dostępnych metod TTS do zatrzymania mowy.');
    }
};

export { speak, stopSpeaking };

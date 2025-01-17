// utils/speak.js
export const speak = (text, lang, onEndCallback) => {
    if (window.TTS) {
        window.TTS.speak({
                text: text,
                locale: lang || 'en-US',
                rate: 1.2,
                pitch: 1.2,
                cancel: true
            }).then(function () {
            if (onEndCallback) onEndCallback();
        }, function (reason) {
            if (onEndCallback) onEndCallback(reason);
        });

    } else if (window.speechSynthesis) {
        // console.log(`Using Web Speech API to speak: "${text}" (${lang})`);
        const synth = window.speechSynthesis;
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = lang || 'en-US';

        utterance.onend = () => {
            if (onEndCallback) onEndCallback();
        };

        utterance.onerror = (event) => {
            if (onEndCallback) onEndCallback(event.error);
        };

        synth.speak(utterance);
    } else {
        if (onEndCallback) onEndCallback('No available TTS methods');
    }
};

export const stopSpeaking = () => {
    if (window.TTS && typeof window.TTS.stop === 'function') {
        window.TTS.stop(() => {
        }, (error) => {
            console.log(`Error stopping TTS: ${JSON.stringify(error)}`);
        });
    } else if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
    } else {
        console.log('No available TTS methods to stop speech.');
    }
};

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
            // console.log('success');
            if (onEndCallback) onEndCallback();
        }, function (reason) {
            // console.log(`TTS Error: ${JSON.stringify(reason)}`);
            if (onEndCallback) onEndCallback(reason);
        });

    } else if (window.speechSynthesis) {
        console.log(`Using Web Speech API to speak: "${text}" (${lang})`);
        const synth = window.speechSynthesis;
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = lang || 'en-US';

        utterance.onend = () => {
            // console.log('Success: Speech ended');
            if (onEndCallback) onEndCallback();
        };

        utterance.onerror = (event) => {
            // console.log(`Speech Error: ${event.error}`);
            if (onEndCallback) onEndCallback(event.error);
        };

        synth.speak(utterance);
    } else {
        // console.log('No available TTS methods');
        if (onEndCallback) onEndCallback('No available TTS methods');
    }
};

export const stopSpeaking = () => {
    if (window.TTS && typeof window.TTS.stop === 'function') {
        // console.log('Attempting to stop Cordova TTS Advanced');
        window.TTS.stop(() => {
            // console.log('Success: Speech stopped');
        }, (error) => {
            console.log(`Error stopping TTS: ${JSON.stringify(error)}`);
        });
    } else if (window.speechSynthesis) {
        // console.log('Attempting to stop Web Speech API');
        window.speechSynthesis.cancel();
        // console.log('Success: Speech stopped using speechSynthesis');
    } else {
        console.log('No available TTS methods to stop speech.');
    }
};

export const loadLanguages = () => {
    return new Promise((resolve, reject) => {
        if (window.cordova && window.TTS) {
            const predefinedLanguages = [
                'en-US', 'en-GB', 'pl-PL', 'es-ES', 'es-MX', 'de-DE', 'fr-FR',
                'it-IT', 'ru-RU', 'zh-CN', 'zh-TW', 'ja-JP', 'ko-KR', 'pt-PT',
                'pt-BR', 'nl-NL', 'sv-SE', 'no-NO', 'da-DK', 'fi-FI', 'tr-TR',
                'ar-SA', 'he-IL', 'hi-IN', 'id-ID', 'ms-MY', 'th-TH', 'vi-VN',
                'cs-CZ', 'el-GR', 'hu-HU', 'ro-RO', 'sk-SK', 'uk-UA', 'bg-BG',
                'hr-HR', 'lt-LT', 'lv-LV', 'sl-SI', 'et-EE', 'fa-IR', 'bn-BD',
                'ta-IN', 'te-IN', 'mr-IN'
            ];
            resolve(predefinedLanguages);
        } else if (window.speechSynthesis) {
            const loadVoices = () => {
                const voices = window.speechSynthesis.getVoices();
                const uniqueLangs = Array.from(new Set(voices.map(voice => voice.lang)));
                if (uniqueLangs.length > 0) {
                    resolve(uniqueLangs);
                } else {
                    console.warn("No voices available, setting default language to 'en-US'.");
                    resolve(['en-US']);
                }
            };

            // Sprawdzenie, czy głosy są już załadowane
            if (window.speechSynthesis.getVoices().length !== 0) {
                loadVoices();
            } else {
                window.speechSynthesis.onvoiceschanged = () => {
                    loadVoices();
                };
            }
        } else {
            console.warn("No TTS available.");
            resolve(['en-US']);
        }
    });
};

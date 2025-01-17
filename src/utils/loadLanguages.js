export const loadLanguages = () => {
    return new Promise((resolve, reject) => {
        const predefinedLanguages = [
            "ar-SA", "bg-BG", "bn-BD", "cs-CZ", "da-DK", "de-DE", "el-GR",
            "en-GB", "en-US", "es-ES", "es-MX", "et-EE", "fa-IR", "fi-FI",
            "fr-FR", "he-IL", "hi-IN", "hr-HR", "hu-HU", "id-ID", "it-IT",
            "ja-JP", "ko-KR", "lt-LT", "lv-LV", "mr-IN", "ms-MY", "nl-NL",
            "no-NO", "pl-PL", "pt-BR", "pt-PT", "ro-RO", "ru-RU", "sk-SK",
            "sl-SI", "sv-SE", "ta-IN", "te-IN", "th-TH", "tr-TR", "uk-UA",
            "vi-VN", "zh-CN", "zh-TW"
        ];

        if (window.cordova && window.TTS) {
            resolve(predefinedLanguages);
        } else if (window.speechSynthesis) {
            const loadVoices = () => {
                const voices = window.speechSynthesis.getVoices();
                const uniqueLangs = Array.from(new Set(voices.map(voice => voice.lang)));

                // Ensure `ar-SA` and `he-IL` are included in the list
                predefinedLanguages.forEach(lang => {
                    if (!uniqueLangs.includes(lang)) {
                        uniqueLangs.push(lang);
                    }
                });

                if (uniqueLangs.length > 0) {
                    resolve(uniqueLangs);
                } else {
                    console.warn("No voices available, setting default language to 'en-US'.");
                    resolve(['en-US']);
                }
            };

            if (window.speechSynthesis.getVoices().length !== 0) {
                loadVoices();
            } else {
                window.speechSynthesis.onvoiceschanged = () => {
                    loadVoices();
                };
            }
            // const loadVoices = () => {
            //     const voices = window.speechSynthesis.getVoices();
            //     const uniqueLangs = Array.from(new Set(voices.map(voice => voice.lang)));
            //     if (uniqueLangs.length > 0) {
            //         resolve(uniqueLangs);
            //     } else {
            //         console.warn("No voices available, setting default language to 'en-US'.");
            //         resolve(['en-US']);
            //     }
            // };
            //
            // if (window.speechSynthesis.getVoices().length !== 0) {
            //     loadVoices();
            // } else {
            //     window.speechSynthesis.onvoiceschanged = () => {
            //         loadVoices();
            //     };
            // }
        } else {
            console.warn("No TTS available.");
            resolve(['en-US']);
        }
    });
};

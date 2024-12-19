// getLanguage.js
export const getBrowserLanguage = () => {
    return navigator.language || navigator.userLanguage || 'en-US';
};

export const getCordovaLanguage = () => {
    return new Promise((resolve, reject) => {
        if (window.cordova && navigator.globalization) {
            navigator.globalization.getPreferredLanguage(
                (language) => {
                    resolve(language.value);
                },
                (error) => {
                    console.error('Error getting language:', error);
                    resolve(getBrowserLanguage());
                }
            );
        } else {
            resolve(getBrowserLanguage());
        }
    });
};

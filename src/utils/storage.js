export const setLocalStorage = (key, value) => {
    if (isLocalStorageAvailable()) {
        localStorage.setItem(key, JSON.stringify(value));
    } else {
        console.error('LocalStorage is not available.');
    }
};

export const getLocalStorage = (key) => {
    if (isLocalStorageAvailable()) {
        const value = localStorage.getItem(key);
        return value ? JSON.parse(value) : null;
    }
    console.error('LocalStorage is not available.');
    return null;
};

export const removeLocalStorage = (key) => {
    if (isLocalStorageAvailable()) {
        localStorage.removeItem(key);
    } else {
        console.error('LocalStorage is not available.');
    }
};

function isLocalStorageAvailable() {
    try {
        const testKey = '__test__';
        localStorage.setItem(testKey, 'test');
        localStorage.removeItem(testKey);
        return true;
    } catch (e) {
        return false;
    }
}

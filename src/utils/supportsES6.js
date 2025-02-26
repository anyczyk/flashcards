export const supportsES6 = () => {
    try {
        new Function("(a = 0) => a");
        return true;
    } catch (e) {
        return false;
    }
};
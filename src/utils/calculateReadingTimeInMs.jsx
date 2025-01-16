export const calculateReadingTimeInMs = (text) => {
    const charsPerSecond = 15;
    const readingTimeSeconds = text.length / charsPerSecond;
    const readingTimeMs = Math.max(readingTimeSeconds * 1000, 2000);
    return readingTimeMs;
}
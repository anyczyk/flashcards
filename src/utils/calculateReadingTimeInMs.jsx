export const calculateReadingTimeInMs = (text) => {
    const charsPerSecond = 15; // Średnia liczba znaków na sekundę
    const readingTimeSeconds = text.length / charsPerSecond;
    const readingTimeMs = Math.max(readingTimeSeconds * 1000, 2000); // Minimal time 2000 ms
    return readingTimeMs;
}
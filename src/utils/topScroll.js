export const topScroll = () => {
    window.scrollTo({
        top: 0,
        behavior: 'smooth', // Opcjonalnie: 'auto' dla natychmiastowego przewinięcia
    });
};
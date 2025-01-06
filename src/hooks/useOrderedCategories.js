import { useEffect } from 'react';

const useOrderedCategories = (categories, setOrderedCategories) => {
    useEffect(() => {
        const loadCategoryOrder = () => {
            const savedOrder = localStorage.getItem('categoryOrder');
            if (savedOrder) {
                const orderIds = JSON.parse(savedOrder);
                // Zakładając, że kategorie są unikalnymi nazwami lub identyfikatorami
                const ordered = orderIds
                    .map(id => categories.find(cat => cat === id))
                    .filter(cat => cat !== undefined);
                // Dodaj kategorie, które mogły zostać dodane później
                const remaining = categories.filter(cat => !orderIds.includes(cat));
                return [...ordered, ...remaining];
            }
            return categories;
        };
        setOrderedCategories(loadCategoryOrder());
    }, [categories]);
}

export default useOrderedCategories;
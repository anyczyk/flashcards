import React, { useState, useRef, useEffect } from 'react';

const BrowserSearch = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const refSearch = useRef(null);
    const [oSearch, setOSearch] = useState(false);
    const prevScrollY = useRef(window.scrollY);
    const positionY = useRef(0);
    const isTicking = useRef(false); // Dla throttlingu

    // Oblicz pozycję Y elementu tylko raz po zamontowaniu komponentu
    useEffect(() => {
        if (refSearch.current) {
            const rect = refSearch.current.getBoundingClientRect();
            positionY.current = rect.top + window.scrollY - 64;
        }
    }, []);

    const handleScroll = () => {
        if (!isTicking.current) {
            window.requestAnimationFrame(() => {
                const currentScrollY = window.scrollY;
                const directionDown = currentScrollY > prevScrollY.current;

                if (directionDown) {
                    // Przewijanie w dół
                    if (currentScrollY > positionY.current && !oSearch) {
                        setOSearch(true);
                    }
                } else {
                    // Przewijanie w górę
                    if (currentScrollY < positionY.current && oSearch) {
                        setOSearch(false);
                    }
                }

                prevScrollY.current = currentScrollY;
                isTicking.current = false;
            });
            isTicking.current = true;
        }
    };

    useEffect(() => {
        window.addEventListener("scroll", handleScroll);
        return () => {
            window.removeEventListener("scroll", handleScroll);
        };
    }, [oSearch]); // Upewnij się, że handleScroll ma dostęp do aktualnego oSearch

    const handleSearch = () => {
        if (searchTerm.trim() === '') return;
        window.find(
            searchTerm,
            false,
            false,
            true,
            false,
            false,
            false
        );
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') {
            handleSearch();
        }
    };

    return (
        <div ref={refSearch} className={`o-search o-default-box ${ oSearch ? 'o-search--fixed' : '' }`}>
            <ul className="o-list-buttons-clear o-list-buttons-clear--nowrap">
                <li style={{width: '100%'}}>
                    <input
                        type="text"
                        placeholder="Szukaj..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        onKeyDown={handleKeyDown}
                        style={{width: '100%'}}
                    />
                </li>
                <li className="o-list-buttons-clear__single-icon">
                    <button aria-label="Search" onClick={handleSearch}>
                        <i className="icon-search"></i>
                    </button>
                </li>
            </ul>
        </div>
    );
};
export default BrowserSearch;

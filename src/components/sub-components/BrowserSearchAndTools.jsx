import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import useWcagModal from '../../hooks/useWcagModal';

const BrowserSearchAndTools = ({selectAll, deselectAll, removeSelectedCards, copySelectedCards, handleExport, filteredFlashcards, selectedCards}) => {
    const { t, i18n } = useTranslation(); // Hook translation
    const [searchTerm, setSearchTerm] = useState('');
    const refSearch = useRef(null);
    const [oSearch, setOSearch] = useState(false);
    const prevScrollY = useRef(window.scrollY);
    const positionY = useRef(0);
    const isTicking = useRef(false); // Dla throttlingu
    const modalRef = useRef(null);
    const [visibleModalAll, setVisibleModalAll] = useState(null);

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

    useWcagModal(visibleModalAll, setVisibleModalAll, modalRef);

    return (
        <div className="o-search-wrap">
            <div ref={refSearch} className={`o-search o-default-box ${oSearch ? 'o-search--fixed' : ''}`}>
                <ul className="o-list-buttons-clear o-list-buttons-clear--nowrap o-default-box">
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
                    <li className="btn--icon">
                        <button aria-label="Search" onClick={handleSearch}>
                            <i className="icon-search"></i>
                        </button>
                    </li>
                </ul>
                <ul className="o-list-buttons-clear">
                    {filteredFlashcards.length > 0 && (
                        <li>
                            <button className="btn--icon" onClick={selectAll}>
                                <i className="icon-ok-circled"></i> <span>{t('select_all')}</span>
                            </button>
                        </li>
                    )}
                    {selectedCards.length > 0 && (
                        <>
                            <li>
                                <button className="btn--icon" onClick={deselectAll}>
                                    <i className="icon-ok-circled2"></i> <span>{t('deselect_all')}</span>
                                </button>
                            </li>
                            <li>
                                <button className="btn--icon" onClick={copySelectedCards}>
                                    <i className="icon-docs"></i> <span>{t('copy_selected')}</span>
                                </button>
                            </li>
                            <li>
                                <button className="btn--icon" onClick={handleExport}>
                                    <i className="icon-export"></i> <span>{t('export_selected')}</span>
                                </button>
                            </li>
                            <li>
                                <button
                                    className="btn--red btn--icon"
                                    onClick={() => setVisibleModalAll(true)}
                                >
                                    <i className="icon-trash-empty"></i> <span>{t('remove_selected')}</span>
                                </button>
                                {visibleModalAll && (
                                    <div className="o-modal">
                                        <div
                                            className="o-modal__bg-cancel"
                                            type="button"
                                            aria-label={t('cancel')}
                                            onClick={() => setVisibleModalAll(false)}
                                        ></div>
                                        <div className="o-modal__container"
                                             ref={modalRef}
                                             role="dialog"
                                             aria-modal="true"
                                             aria-labelledby="modal-title"
                                        >
                                            <p>{t('are_you_sure_delete_flashcards')}</p>
                                            <ul className="o-list-buttons-clear">
                                                <li>
                                                    <button
                                                        className="btn--red"
                                                        onClick={() => {
                                                            removeSelectedCards();
                                                            setVisibleModalAll(false);
                                                        }}
                                                    >
                                                        <i className="icon-trash-empty"></i>{' '}
                                                        {t('i_confirm_remove')}
                                                    </button>
                                                </li>
                                                <li>
                                                    <button
                                                        onClick={() => setVisibleModalAll(false)}
                                                    >
                                                        <i className="icon-cancel-circled"></i>{' '}
                                                        {t('cancel')}
                                                    </button>
                                                </li>
                                            </ul>
                                        </div>
                                    </div>
                                )}
                            </li>
                        </>
                    )}
                </ul>

            </div>
        </div>
    );
};
export default BrowserSearchAndTools;

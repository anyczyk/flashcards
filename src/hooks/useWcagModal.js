import { useEffect } from 'react';

const useWcagModal = (visibleModalAll, setVisibleModalAll, modalRef) => {

    // const focusFirstElement = (modalElement) => {
    //     if (!modalElement) return;
    //
    //     const focusableElements = modalElement.querySelectorAll(
    //         'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    //     );
    //
    //     if (focusableElements.length > 0) {
    //         focusableElements[0].focus(); // Ustaw focus na pierwszym elemencie
    //     }
    // };

    const focusFirstElement = (modalElement) => {
        if (!modalElement) return;

        // Sprawdź, czy element już ma fokus
        if (document.activeElement && modalElement.contains(document.activeElement)) {
            return; // Nie ustawiaj fokus, jeśli aktualny element już jest aktywny
        }

        const focusableElements = modalElement.querySelectorAll(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );

        if (focusableElements.length > 0) {
            focusableElements[0].focus(); // Ustaw focus na pierwszym elemencie
        }
    };

    const trapFocus = (modalElement) => {
        if (!modalElement) return;

        const focusableElements = modalElement.querySelectorAll(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        const handleFocus = (e) => {
            if (e.key !== 'Tab') return;

            if (e.shiftKey) {
                if (document.activeElement === firstElement) {
                    e.preventDefault();
                    lastElement.focus();
                }
            } else {
                if (document.activeElement === lastElement) {
                    e.preventDefault();
                    firstElement.focus();
                }
            }
        };

        modalElement.addEventListener('keydown', handleFocus);
        return () => modalElement.removeEventListener('keydown', handleFocus);
    };

    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Escape' && visibleModalAll) {
                setVisibleModalAll(false);
            }
        };

        if (visibleModalAll) {
            document.addEventListener('keydown', handleKeyDown);
            trapFocus(modalRef.current);
            focusFirstElement(modalRef.current); // Ustaw focus po otwarciu modala
        } else {
            document.removeEventListener('keydown', handleKeyDown);
        }

        return () => {
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [visibleModalAll]);
}

export default useWcagModal;
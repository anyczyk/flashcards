import React, { useCallback, useContext, useEffect, useRef, useState } from "react";
import { useTranslation } from 'react-i18next';
import useWcagModal from "../../../hooks/useWcagModal";
import { FlashcardContext } from "../../../context/FlashcardContext";
import SelectSuperCategory from "../common/SelectSuperCategory";
import SelectCategory from "../common/SelectCategory";
import { getAllFlashcards } from "../../../db";
import cardsExport from "../../../utils/cardsExport";
import { removeItemFromLocalStorage } from "../../../utils/storage";

const ModalEdit = ({
                       setNameNew,
                       setNameNewSuperCategory,
                       openModalEdit,
                       cancelModal,
                       globalRestart,
                       globalRemove,
                       nameType,
                       nameOld,
                       nameNew,
                       confirmRemove,
                       setConfirmRemove,
                       setPreloader,
                       nameNewSuperCategory,
                       nameSuperCategory
                   }) => {

    const { t } = useTranslation();
    const {
        flashcards,
        removeFlashcard,
        editFlashcard,
        setOrderedCategories,
        loadData,
        superCategoriesArray
    } = useContext(FlashcardContext);

    const modalRef = useRef(null);
    const [currentSelectSuperCategory, setCurrentSelectSuperCategory] = useState('');
    const [categoriesDependentOnSuperCategory, setCategoriesDependentOnSuperCategory] = useState([]);

    const loadDataSelectors = useCallback(async () => {
        const data = await getAllFlashcards();
        let relevantData;

        if (nameNewSuperCategory.trim() !== '') {
            relevantData = data.filter(fc =>
                fc.category && fc.category.trim() !== '' && fc.superCategory === nameNewSuperCategory
            );
        } else {
            relevantData = data.filter(fc =>
                fc.category && fc.category.trim() !== '' && fc.superCategory === currentSelectSuperCategory
            );
        }

        const catDependSuperCategory = [...new Set(relevantData.map(fc => fc.category))];
        setCategoriesDependentOnSuperCategory(catDependSuperCategory);
    }, [nameNewSuperCategory, currentSelectSuperCategory]);

    useEffect(() => {
        loadDataSelectors();
    }, [loadDataSelectors]);

    useEffect(() => {
        if (nameNewSuperCategory.trim() !== '') {
            localStorage.setItem('openDropdownSuperCategory', nameNewSuperCategory);
        }
    }, [nameNewSuperCategory]);

    const handleExport = async (cardsToExport) => {
        try {
            await cardsExport(cardsToExport);
        } catch (error) {
            console.error(t('an_error_occurred_while_exporting_the_flashcards'), error);
            alert(t('an_error_occurred_while_exporting_the_flashcards'));
        }
    };

    const handleQuickEditSave = async (type, action) => {
        setPreloader(true);
        const exportToFile = [];
        let isRemovedFromLocalStorage = false; // Flaga dla jednorazowego usunięcia
        const promises = flashcards.map((card) => {
            if (type === 'super-category') {
                if (card.superCategory === nameOld) {
                    if (action === 'remove') {
                        if (!isRemovedFromLocalStorage) {
                            console.log("remove:", nameOld);
                            removeItemFromLocalStorage("categoryOrder", nameOld);
                            isRemovedFromLocalStorage = true;
                        }
                        return removeFlashcard(card.id);
                    } else if (action === 'export-to-file') {
                        exportToFile.push(card);
                    } else {
                        return editFlashcard(
                            card.id,
                            card.front,
                            card.back,
                            card.category,
                            (action === 'reset') ? '' : card.know,
                            card.langFront,
                            card.langBack,
                            (action === 'reset') ? '' : nameNew
                        );
                    }
                }
            }
            else if (type === 'category-without-super-category') {
                if (card.category === nameOld && card.superCategory === '') {
                    if (action === 'remove') {
                        if (!isRemovedFromLocalStorage) {
                            console.log("remove:", nameOld);
                            removeItemFromLocalStorage("categoryOrder", nameOld);
                            isRemovedFromLocalStorage = true;
                        }
                        return removeFlashcard(card.id);
                    } else if (action === 'export-to-file') {
                        exportToFile.push(card);
                    } else {
                        return editFlashcard(
                            card.id,
                            card.front,
                            card.back,
                            (action === 'reset') ? card.category : nameNew,
                            (action === 'reset') ? '' : card.know,
                            card.langFront,
                            card.langBack,
                            nameNewSuperCategory
                        );
                    }
                }
                else if (card.category === '' && card.superCategory === '' && nameOld === 'Without category') {
                    if (action === 'remove') {
                        return removeFlashcard(card.id);
                    } else if (action === 'export-to-file') {
                        exportToFile.push(card);
                    } else {
                        return editFlashcard(
                            card.id,
                            card.front,
                            card.back,
                            card.category,
                            (action === 'reset') ? '' : card.know,
                            card.langFront,
                            card.langBack,
                            card.superCategory
                        );
                    }
                }
            }
            else if (type === 'category-inside-super-category') {
                if (card.category === nameOld && card.superCategory === nameSuperCategory) {
                    if (action === 'remove') {
                        const categoriesInSuperCatCount = flashcards
                            .filter(fc => fc.superCategory === nameSuperCategory)
                            .map(fc => fc.category)
                            .filter(Boolean)
                            .filter((value, index, self) => self.indexOf(value) === index)
                            .length;
                        if (categoriesInSuperCatCount === 1) {
                            removeItemFromLocalStorage("categoryOrder", nameSuperCategory);
                        }
                        return removeFlashcard(card.id);
                    } else if (action === 'export-to-file') {
                        exportToFile.push(card);
                    } else {
                        return editFlashcard(
                            card.id,
                            card.front,
                            card.back,
                            (action === 'reset') ? card.category : nameNew,
                            (action === 'reset') ? '' : card.know,
                            card.langFront,
                            card.langBack,
                            nameNewSuperCategory
                        );
                    }
                }
            }
            else if (type === 'reset-all-flashcards') {
                return editFlashcard(
                    card.id,
                    card.front,
                    card.back,
                    card.category,
                    '',
                    card.langFront,
                    card.langBack,
                    card.superCategory
                );
            } else if (type === 'remove-all-flashcards') {
                localStorage.removeItem("categoryOrder");
                return removeFlashcard(card.id);
            }

            return null;
        });

        if (action === 'export-to-file') {
            handleExport(exportToFile);
        }

        const filteredPromises = promises.filter(Boolean);

        try {
            await Promise.all(filteredPromises);

            setOrderedCategories(prevCategories => {
                const updated = prevCategories.map(cat =>
                    cat === nameOld ? nameNew : cat
                );
                return [...new Set(updated)];
            });

            const savedOrder = localStorage.getItem('categoryOrder');
            if (savedOrder) {
                const orderIds = JSON.parse(savedOrder).map(cat =>
                    cat === nameOld ? nameNew : cat
                );
                const uniqueOrderIds = [...new Set(orderIds)];
                localStorage.setItem('categoryOrder', JSON.stringify(uniqueOrderIds));
            }

            cancelModal();
        } catch (error) {
            console.error("Error saving changes:", error);
            alert(t('error_saving_changes'));
        } finally {
            setPreloader(false);
        }
    };

    useWcagModal(openModalEdit, cancelModal, modalRef);

    return (
        <div className="o-modal">
            <div
                className="o-modal__bg-cancel"
                onClick={cancelModal}
                type="button"
                aria-label={t('cancel')}
            />
            <div
                className="o-modal__container w-100"
                ref={modalRef}
                role="dialog"
                aria-modal="true"
                aria-labelledby="modal-title"
            >
                {globalRestart || globalRemove ? (
                    <>
                        {globalRestart && (
                            <>
                                <p>{t('are_you_sure_restart_all_flashcards')}</p>
                                <ul className="o-list-buttons-clear o-list-buttons-clear--nowrap">
                                    <li>
                                        <button
                                            onClick={() => handleQuickEditSave('reset-all-flashcards')}
                                            className="btn--blue"
                                        >
                                            <i className="icon-arrows-cw"></i> {t('yes_reset')}
                                        </button>
                                    </li>
                                    <li>
                                        <button onClick={cancelModal}>
                                            <i className="icon-cancel-circled"></i> {t('cancel')}
                                        </button>
                                    </li>
                                </ul>
                            </>
                        )}
                        {globalRemove && (
                            <>
                                <p>{t('are_you_sure_remove_all_flashcards')}</p>
                                <ul className="o-list-buttons-clear o-list-buttons-clear--nowrap">
                                    <li>
                                        <button
                                            onClick={() => handleQuickEditSave('remove-all-flashcards')}
                                            className="btn--red"
                                        >
                                            <i className="icon-trash-empty"></i> {t('yes_remove')}
                                        </button>
                                    </li>
                                    <li>
                                        <button onClick={cancelModal}>
                                            <i className="icon-cancel-circled"></i> {t('cancel')}
                                        </button>
                                    </li>
                                </ul>
                            </>
                        )}
                    </>
                ) : (
                    <>
                        <h2
                            title={
                                nameType === 'super-category'
                                    ? t('super_category')
                                    : nameType === 'category-without-super-category'
                                        ? t('category_without_super_category')
                                        : nameType === 'category-inside-super-category'
                                            ? t('category_inside_super_category')
                                            : ''
                            }
                        >
                            {t('edit')}
                        </h2>

                        {nameOld !== 'Without category' && !confirmRemove && (
                            <>
                                {(nameType === 'category-without-super-category' ||
                                    nameType === 'category-inside-super-category') && (
                                    <SelectSuperCategory
                                        superCategory={nameNewSuperCategory}
                                        setSuperCategory={setNameNewSuperCategory}
                                        superCategoriesArray={superCategoriesArray}
                                        setCurrentSelectSuperCategory={setCurrentSelectSuperCategory}
                                    />
                                )}

                                {nameType === 'super-category' ? (
                                    <SelectSuperCategory
                                        superCategory={nameNew}
                                        setSuperCategory={setNameNew}
                                        superCategoriesArray={superCategoriesArray}
                                        setCurrentSelectSuperCategory={setCurrentSelectSuperCategory}
                                    />
                                ) : (
                                    <SelectCategory
                                        category={nameNew}
                                        setCategory={setNameNew}
                                        categoriesDependentOnSuperCategory={categoriesDependentOnSuperCategory}
                                    />
                                )}
                            </>
                        )}

                        {confirmRemove ? (
                            <>
                                <p>{t('are_you_sure_delete')}</p>
                                <ul className="o-list-buttons-clear o-list-buttons-clear--nowrap o-default-box">
                                    <li>
                                        <button
                                            className="btn--red h-auto"
                                            onClick={() => handleQuickEditSave(nameType, 'remove')}
                                        >
                                            <i className="icon-trash-empty"></i>{" "}
                                            <span>{t('confirm')}</span>
                                        </button>
                                    </li>
                                    <li>
                                        <button onClick={() => setConfirmRemove(false)}>
                                            <i className="icon-cancel-circled"></i>{" "}
                                            <span>{t('cancel')}</span>
                                        </button>
                                    </li>
                                </ul>
                            </>
                        ) : (
                            <ul className="o-list-buttons-clear o-default-box">
                                <li>
                                    <button
                                        onClick={() => setConfirmRemove(true)}
                                        className="btn--red btn--icon"
                                    >
                                        <i className="icon-trash-empty"></i>{" "}
                                        <span>{t('remove')}</span>
                                    </button>
                                </li>
                                <li>
                                    <button
                                        className="btn--icon btn--blue"
                                        onClick={() => handleQuickEditSave(nameType, 'reset')}
                                    >
                                        <i className="icon-arrows-cw"></i>{" "}
                                        <span>{t('progress_reset')}</span>
                                    </button>
                                </li>
                                <li>
                                    <button
                                        className="btn--icon btn--yellow"
                                        onClick={() => handleQuickEditSave(nameType, 'export-to-file')}
                                    >
                                        <i className="icon-export"></i>{" "}
                                        <span>{t('export_to_file')}</span>
                                    </button>
                                </li>
                                {nameOld !== 'Without category' && (
                                    <li>
                                        <button
                                            className="btn--icon btn--green"
                                            onClick={() => handleQuickEditSave(nameType)}
                                        >
                                            <i className="icon-floppy-1"></i>{" "}
                                            <span>{t('save')}</span>
                                        </button>
                                    </li>
                                )}
                            </ul>
                        )}

                        {!confirmRemove && (
                            <>
                                <hr />
                                <button onClick={cancelModal}>
                                    <i className="icon-cancel-circled"></i> {t('close')}
                                </button>
                            </>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};

export default ModalEdit;

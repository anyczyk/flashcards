// EditFlashcardList.jsx
import React, {useContext, useEffect} from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from "react-router-dom";
import BrowserSearchAndTools from "./sub-components/EditFlashcardList/BrowserSearchAndTools";
import { FlashcardContext } from '../context/FlashcardContext';
import { EditSearchContext } from '../context/EditSearchContext';
import CategoryListDragDrop from "./sub-components/EditFlashcardList/CategoryListDragDrop";
import ModalEdit from "./sub-components/EditFlashcardList/ModalEdit";
import FlashCardListEdit from "./sub-components/common/FlashCardListEdit";
import NoFlashcards from "./sub-components/common/NoFlashcards";

function EditFlashcardList({preloader, setPreloader, editPageLoad, setEditPageLoad}) {
    const { t } = useTranslation(); // Hook translation
    const {
        flashcards
    } = useContext(FlashcardContext);

    const {
        editMode, setEditMode,
        editFront, setEditFront,
        editBack, setEditBack,
        editFrontDesc, setEditFrontDesc,
        editBackDesc, setEditBackDesc,
        editCategory, setEditCategory,
        editSuperCategory, setEditSuperCategory,
        editKnow, setEditKnow,
        editType, setEditType,
        selectedCategory, setSelectedCategory,
        selectedSuperCategory, setSelectedSuperCategory,
        selectedCards, setSelectedCards,
        editFrontLang, setEditFrontLang,
        editBackLang, setEditBackLang,
        showStillLearning, setShowStillLearning,
        openModalEdit, setOpenModalEdit,
        nameOld, setNameOld,
        nameNew, setNameNew,
        nameSuperCategory, setNameSuperCategory,
        nameNewSuperCategory, setNameNewSuperCategory,
        nameType, setNameType,
        confirmRemove, setConfirmRemove,
        toolsItemActive, setToolsItemActive,
        globalRestart,setGlobalRestart,
        globalRemove, setGlobalRemove,
        availableLanguages, setAvailableLanguages,
        visibleModalSingle, setVisibleModalSingle,
        categoriesInSuperCategoryCount, setCategoriesInSuperCategoryCount,
        filteredFlashcards,
        getFilteredFlashcardCount,
        cancelEditing,
        cancelModal,
        backToEditlist
    } = useContext(EditSearchContext);

    const handleEditPageLoad = () => {
        setSelectedCategory(null);
        setEditPageLoad(false);
    };

    useEffect(() => {
        handleEditPageLoad();
    }, [editPageLoad]);

    return (
        <div className="o-page-edit-flashcard-list">
            <h2>
                {t('edit_flashcards')}
                {selectedSuperCategory ? ` / ${selectedSuperCategory}` : ''}
                {(selectedCategory !== null) && (
                    <span> / {selectedCategory === 'All' ? t('all') : selectedCategory
                    } (
                        {getFilteredFlashcardCount})
                    </span>
                )}
            </h2>
            <hr />

            {(!(selectedCategory === null) && !(flashcards.length < 1)) && (
                <>
                    <p>
                        <button
                            className="w-100"
                            onClick={backToEditlist}
                        >
                            {t('choose_another_deck')}
                        </button>
                    </p>
                    <hr/>
                </>
            )}

            {(flashcards.length < 1) ? <NoFlashcards /> : (
                <>
                    {(selectedCategory === null) ? (
                        <>
                            <ul className="o-list-buttons-clear o-list-buttons-clear--nowrap-columns o-default-box">
                                <li>
                                    <button
                                        onClick={() => {
                                            setOpenModalEdit(true);
                                            setGlobalRemove(true);
                                        }}
                                        className="btn--red"
                                    >
                                        <i className="icon-trash-empty"></i> {t('remove_all_flashcards')}
                                    </button>
                                </li>
                                <li>
                                    <button
                                        onClick={() => {
                                            setOpenModalEdit(true);
                                            setGlobalRestart(true);
                                        }}
                                        className="btn--blue"
                                    >
                                        <i className="icon-arrows-cw"></i> {t('reset_all_flashcard_progress')}
                                    </button>
                                </li>
                            </ul>
                            {!preloader && (
                                <CategoryListDragDrop
                                    setSelectedCards={setSelectedCards}
                                    selectedCategory={selectedCategory}
                                    setSelectedSuperCategory={setSelectedSuperCategory}
                                    selectedSuperCategory={selectedSuperCategory}
                                    setOpenModalEdit={setOpenModalEdit}
                                    setNameNew={setNameNew}
                                    setNameOld={setNameOld}
                                    setNameSuperCategory={setNameSuperCategory}
                                    setNameType={setNameType}
                                    setNameNewSuperCategory={setNameNewSuperCategory}
                                    setSelectedCategory={setSelectedCategory}
                                    toolsItemActive={toolsItemActive}
                                    setToolsItemActive={setToolsItemActive}
                                    setCategoriesInSuperCategoryCount={setCategoriesInSuperCategoryCount}
                                />
                            )}
                        </>
                    ) : ''}

                    {openModalEdit && (
                        <ModalEdit
                            setNameNew={setNameNew}
                            setNameNewSuperCategory={setNameNewSuperCategory}
                            openModalEdit={openModalEdit}
                            cancelModal={cancelModal}
                            globalRestart={globalRestart}
                            globalRemove={globalRemove}
                            nameType={nameType}
                            nameOld={nameOld}
                            nameNew={nameNew}
                            confirmRemove={confirmRemove}
                            setConfirmRemove={setConfirmRemove}
                            setPreloader={setPreloader}
                            nameNewSuperCategory={nameNewSuperCategory}
                            nameSuperCategory={nameSuperCategory}
                            editSuperCategory={editSuperCategory}
                            setEditSuperCategory={setEditSuperCategory}
                        />
                    )}
                    {selectedCategory !== null && (
                        <>
                            {(filteredFlashcards.length > 0 || selectedCards.length > 0) && (
                                <BrowserSearchAndTools
                                    setSelectedCards={setSelectedCards}
                                    selectedCards={selectedCards}
                                    backToEditlist={backToEditlist}
                                    filteredFlashcards={filteredFlashcards}
                                    setShowStillLearning={setShowStillLearning}
                                    showStillLearning={showStillLearning}
                                    cancelEditing={cancelEditing}
                                />
                            )}
                            <hr />

                            {filteredFlashcards.length > 0 && (
                                <FlashCardListEdit
                                    backToEditlist={backToEditlist}
                                    setSelectedCards={setSelectedCards}
                                    selectedCards={selectedCards}
                                    setEditMode={setEditMode}
                                    availableLanguages={availableLanguages}
                                    filteredFlashcards={filteredFlashcards}
                                    showStillLearning={showStillLearning}
                                    editMode={editMode}
                                    cancelEditing={cancelEditing}
                                    visibleModalSingle={visibleModalSingle}
                                    setVisibleModalSingle={setVisibleModalSingle}
                                    editFront={editFront}
                                    setEditFront={setEditFront}
                                    editFrontDesc={editFrontDesc}
                                    setEditFrontDesc={setEditFrontDesc}
                                    editFrontLang={editFrontLang}
                                    setEditFrontLang={setEditFrontLang}
                                    editBack={editBack}
                                    setEditBack={setEditBack}
                                    editBackDesc={editBackDesc}
                                    setEditBackDesc={setEditBackDesc}
                                    editBackLang={editBackLang}
                                    setEditBackLang={setEditBackLang}
                                    editCategory={editCategory}
                                    setEditCategory={setEditCategory}
                                    editSuperCategory={editSuperCategory}
                                    setEditSuperCategory={setEditSuperCategory}
                                    editKnow={editKnow}
                                    setEditKnow={setEditKnow}
                                    editType={editType}
                                    setEditType={setEditType}
                                    typePage={'main-edit'}
                                />
                            )}
                        </>
                    )}
                </>
            )}
        </div>
    );
}

export default EditFlashcardList;

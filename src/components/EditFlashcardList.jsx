// EditFlashcardList.jsx
import React, {useState, useMemo, useEffect, useContext} from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from "react-router-dom";
import { loadLanguages } from '../utils/loadLanguages';
import { topScroll } from "../utils/topScroll";
import BrowserSearchAndTools from "./sub-components/EditFlashcardList/BrowserSearchAndTools";
import useOrderedCategories from "../hooks/useOrderedCategories";
import { FlashcardContext } from '../context/FlashcardContext';
import CategoryListDragDrop from "./sub-components/EditFlashcardList/CategoryListDragDrop";
import ModalEdit from "./sub-components/EditFlashcardList/ModalEdit";
import FlashCardListEdit from "./sub-components/EditFlashcardList/FlashCardListEdit";

function EditFlashcardList({preloader, setPreloader}) {
    const { t } = useTranslation(); // Hook translation
    const {
        flashcards,
        categories,
        setOrderedCategories
    } = useContext(FlashcardContext);

    const [editMode, setEditMode] = useState(null);

    const [editFront, setEditFront] = useState('');
    const [editBack, setEditBack] = useState('');
    const [editCategory, setEditCategory] = useState('');
    const [editSuperCategory, setEditSuperCategory] = useState('');
    const [editKnow, setEditKnow] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [selectedSuperCategory, setSelectedSuperCategory] = useState(null);
    const [selectedCards, setSelectedCards] = useState([]);
    const [editFrontLang, setEditFrontLang] = useState('');
    const [editBackLang, setEditBackLang] = useState('');
    const [showStillLearning, setShowStillLearning] = useState(false);
    const [openModalEdit, setOpenModalEdit] = useState(false);
    const [nameOld, setNameOld] = useState('');
    const [nameNew, setNameNew] = useState('');
    const [nameSuperCategory, setNameSuperCategory] = useState('');
    const [nameNewSuperCategory, setNameNewSuperCategory] = useState('');
    const [nameType, setNameType] = useState('');
    const [confirmRemove, setConfirmRemove] = useState(false);
    const [toolsItemActive, setToolsItemActive] = useState(null);
    const [globalRestart,setGlobalRestart ] = useState(false);
    const [globalRemove, setGlobalRemove] = useState(false);
    const [availableLanguages, setAvailableLanguages] = useState([]);
    const [visibleModalSingle, setVisibleModalSingle] = useState({});
    const [categoriesInSuperCategoryCount, setCategoriesInSuperCategoryCount] = useState(null);

    useEffect(() => {
        const fetchLanguages = async () => {
            try {
                const languages = await loadLanguages();
                setAvailableLanguages(languages);
            } catch (error) {
                console.error("Error loading languages:", error);
                setAvailableLanguages(['en-US']);
            }
        };
        fetchLanguages();
    }, []);

    useOrderedCategories(categories, setOrderedCategories);
    const cancelEditing = () => {
        setEditMode(null);
        setEditFront('');
        setEditBack('');
        setEditCategory('');
        setEditKnow(false);
        setEditFrontLang('');
        setEditBackLang('');
        setEditSuperCategory('');
    };

    const filteredFlashcards = useMemo(() => {
        let filtered = [];
        if (selectedSuperCategory !== null && selectedCategory === 'Without category') {
            filtered = flashcards.filter(fc =>
                fc.superCategory === selectedSuperCategory &&
                (!fc.category || fc.category.trim() === '')
            );
        }
        else if (selectedSuperCategory !== null && selectedCategory !== null) {
            filtered = flashcards.filter(fc =>
                fc.superCategory === selectedSuperCategory &&
                fc.category === selectedCategory
            );
        }
        else if (selectedSuperCategory !== null) {
            filtered = flashcards.filter(fc => fc.superCategory === selectedSuperCategory);
        }
        else if (selectedCategory === 'All') {
            filtered = [...flashcards];
        }
        else if (selectedCategory === 'Without category') {
            filtered = flashcards.filter(fc =>
                (!fc.category || fc.category.trim() === '') && !fc.superCategory
            );
        }
        else if (selectedCategory) {
            filtered = flashcards.filter(fc =>
                fc.category === selectedCategory && !fc.superCategory
            );
        }

        if (showStillLearning) {
            filtered = filtered.filter(fc => !fc.know);
        }

        return filtered;
    }, [selectedCategory, selectedSuperCategory, flashcards, showStillLearning]);

    const getFilteredFlashcardCount = filteredFlashcards.length;

    const cancelModal = () => {
        setNameNew('');
        setNameOld('');
        setNameType('');
        setNameSuperCategory('');
        setNameNewSuperCategory('');
        setConfirmRemove(false);
        setToolsItemActive(null);
        setGlobalRemove(false);
        setGlobalRestart(false);
        setOpenModalEdit(false);
    };

    const backToEditlist = () => {
        setSelectedCategory(null);
        setSelectedSuperCategory(null);
        setSelectedCards([]);
        setShowStillLearning(false);
        cancelEditing();
        topScroll();
    };

    return (
        <div className="o-page-edit-flashcard-list">
            <h2>
                {t('edit_flashcards')}
                {selectedSuperCategory ? ` / ${selectedSuperCategory}` : ''}
                {(selectedCategory !== null) && (
                    <span> / {selectedCategory === 'All'
                        ? t('all')
                        : (selectedCategory === 'Without category'
                            ? t('without_category')
                            : selectedCategory)
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
                            {t('choose_another_category')}
                        </button>
                    </p>
                    <hr/>
                </>
            )}

            {(flashcards.length < 1) ? (
                <div className="o-no-flashcards">
                    <p>{t('no_flashcards')}</p>
                    <ul className="o-list-buttons-clear">
                        <li>
                            <Link className="btn" to="/create">
                                <i className="icon-plus"></i> {t('create_flashcard')}
                            </Link>
                        </li>
                        <li>
                            <Link className="btn" to="/import-export">
                                <i className="icon-export"></i> {t('import_export')}
                            </Link>
                        </li>
                    </ul>
                </div>
            ) : (
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
                                    editFrontLang={editFrontLang}
                                    setEditFrontLang={setEditFrontLang}
                                    editBack={editBack}
                                    setEditBack={setEditBack}
                                    editBackLang={editBackLang}
                                    setEditBackLang={setEditBackLang}
                                    editCategory={editCategory}
                                    setEditCategory={setEditCategory}
                                    editSuperCategory={editSuperCategory}
                                    setEditSuperCategory={setEditSuperCategory}
                                    editKnow={editKnow}
                                    setEditKnow={setEditKnow}
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

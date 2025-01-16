import React, {createContext, useState, useEffect, useContext, useMemo} from 'react';
import {FlashcardContext} from "./FlashcardContext";
import {loadLanguages} from "../utils/loadLanguages";
import useOrderedCategories from "../hooks/useOrderedCategories";
import {topScroll} from "../utils/topScroll";

export const EditSearchContext = createContext();

export const EditSearchProvider = ({ children }) => {
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
        <EditSearchContext.Provider
            value={{
                editMode, setEditMode,
                editFront, setEditFront,
                editBack, setEditBack,
                editCategory, setEditCategory,
                editSuperCategory, setEditSuperCategory,
                editKnow, setEditKnow,
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
        }}>
            {children}
        </EditSearchContext.Provider>
    );
};
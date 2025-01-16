// CategoryList.jsx

import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from 'react-i18next';

function encodeSuperCategoryKey(superCategory) {
    return 'subCategoryOrder_' + btoa(unescape(encodeURIComponent(superCategory)));
}

function getInitialSubcategoriesOrder(superCat, flashcards) {
    return [
        ...new Set(
            flashcards
                .filter(fc => fc.superCategory === superCat)
                .map(fc => fc.category && fc.category.trim() !== '' ? fc.category : 'Without category')
        )
    ];
}

const CategoryList = ({
                          selectedCategory,
                          selectedSuperCategory,
                          flashcards,
                          learningFilter,
                          orderedCategories,
                          setSelectedCategory,
                          setSelectedSuperCategory,
                          setLearningFilter,
                          setCheckedCards,
                          setDeck,
                          setTwoCards
                      }) => {
    const { t } = useTranslation();
    const navigate = useNavigate();

    // Here we read the saved subcategory orders from localStorage.
    // Object of the form:
    // {
    // "subCategoryOrder_abCdE...": ["Subcat A", "Subcat B", ...],
    // "subCategoryOrder_xyZ...": ["Other Subcat", ...],
    // ...
    // }
    const [subCategoriesOrder, setSubCategoriesOrder] = useState(() => {
        try {
            const stored = localStorage.getItem('subCategoriesOrderStorage');
            return stored ? JSON.parse(stored) : {};
        } catch (e) {
            return {};
        }
    });

    const [activeSuperCategory, setActiveSuperCategory] = useState(null);

    const handleActiveSuperCategory = (index) => {
        setActiveSuperCategory(activeSuperCategory === index ? null : index);
    };

    const handleRunFlashCards = (category, superCategory) => {
        setSelectedCategory(category);
        setSelectedSuperCategory(superCategory);
        setLearningFilter('all');
        setCheckedCards(new Set());
        setDeck([]);
        setTwoCards([]);
    };

    return (
        selectedCategory === null && selectedSuperCategory === null ? (
            <>
                {flashcards.length > 0 ? (
                    <ul className="o-list-categories o-list-categories--main">
                        <li>
                            <button
                                className={`btn btn--dark-black-opacity ${
                                    selectedCategory === 'All' && learningFilter === 'all'
                                        ? 'btn--active'
                                        : ''
                                }`}
                                onClick={() => handleRunFlashCards('All', null)}
                            >
                <span>
                  {(() => {
                      const knowCount = flashcards.filter(fc => fc.know).length;
                      const count = flashcards.length;
                      const unknownCount = count - knowCount;
                      const knowPercentage = count > 0
                          ? Math.ceil((knowCount * 100) / count)
                          : 0;
                      return (
                          <>
                              <i className="icon-play-outline"></i> {t('all')} (
                              <strong>{knowCount}</strong>/{count})
                              {unknownCount > 0 ? (
                                  <>
                                      <sub className="bg-color-green">{knowPercentage}%</sub>
                                      <sup className="bg-color-red">{unknownCount}</sup>
                                  </>
                              ) : (
                                  <sub className="o-category-complited bg-color-green vertical-center-count">
                                      <i className="icon-ok"></i>
                                  </sub>
                              )}
                          </>
                      );
                  })()}
                </span>
                            </button>
                        </li>

                        <li className="o-button-add-flashcard">
                            <button
                                onClick={() => navigate('/create?superCategory=')}
                                type="button"
                                className="justify-content-center"
                                aria-label={t('add_flashcard')}
                            >
                                <i className="icon-plus"></i>
                            </button>
                        </li>

                        {orderedCategories.map((cat, index) => {
                            let count;
                            let knowCount;

                            if (cat === 'Without category') {
                                count = flashcards.filter(fc =>
                                    (!fc.category || fc.category.trim() === '') &&
                                    !fc.superCategory
                                ).length;
                                knowCount = flashcards.filter(fc =>
                                    (!fc.category || fc.category.trim() === '') &&
                                    !fc.superCategory &&
                                    fc.know
                                ).length;
                            } else {
                                count = flashcards.filter(fc =>
                                    fc.category === cat && !fc.superCategory
                                ).length;
                                knowCount = flashcards.filter(fc =>
                                    fc.category === cat && fc.know && !fc.superCategory
                                ).length;
                            }

                            const hasSubcategories = flashcards.some(fc => fc.superCategory === cat);

                            if (!hasSubcategories && count === 0) {
                                return null;
                            }

                            return (
                                <li key={cat}>
                                    {hasSubcategories ? (
                                        <>
                                            {(() => {
                                                const knowCountSuper = flashcards.filter(
                                                    fc => fc.know && fc.superCategory === cat
                                                ).length;
                                                const countSuper = flashcards.filter(
                                                    fc => fc.superCategory === cat
                                                ).length;
                                                return (
                                                    <button
                                                        onClick={() => handleActiveSuperCategory(index)}
                                                        className={`bg-color-brow btn-super-category ${
                                                            activeSuperCategory === index
                                                                ? 'btn-super-category--active'
                                                                : ''
                                                        }`}
                                                    >
                            <span>
                              <i
                                  className={
                                      activeSuperCategory === index
                                          ? 'icon-folder-open-empty'
                                          : 'icon-folder-empty'
                                  }
                              ></i>{' '}
                                {cat} (
                              <strong>
                                {knowCountSuper}
                              </strong>/{countSuper})
                            </span>
                                                    </button>
                                                );
                                            })()}

                                            {activeSuperCategory === index && (
                                                <ul className="o-list-categories o-list-categories--sub">
                                                    <li>
                                                        {(() => {
                                                            const knowCountSuper = flashcards.filter(
                                                                fc => fc.know && fc.superCategory === cat
                                                            ).length;
                                                            const countSuper = flashcards.filter(
                                                                fc => fc.superCategory === cat
                                                            ).length;
                                                            const unknownCountSuper = countSuper - knowCountSuper;
                                                            const knowPercentageSuper = countSuper > 0
                                                                ? Math.ceil((knowCountSuper * 100) / countSuper)
                                                                : 0;

                                                            return (
                                                                <button
                                                                    className="btn btn--dark-light-opacity "
                                                                    onClick={() => handleRunFlashCards(null, cat)}
                                                                >
                                  <span>
                                    <i className="icon-play-outline"></i> {t('all')} (
                                    <strong>{knowCountSuper}</strong>/
                                      {countSuper})
                                      {unknownCountSuper > 0 ? (
                                          <>
                                              <sub className="bg-color-green">
                                                  {knowPercentageSuper}%
                                              </sub>
                                              <sup className="bg-color-red">
                                                  {unknownCountSuper}
                                              </sup>
                                          </>
                                      ) : (
                                          <sub className="o-category-complited bg-color-green vertical-center-count">
                                              <i className="icon-ok"></i>
                                          </sub>
                                      )}
                                  </span>
                                                                </button>
                                                            );
                                                        })()}
                                                    </li>
                                                    {(() => {
                                                        const subCatKey = encodeSuperCategoryKey(cat);
                                                        const userDefinedOrder =
                                                            subCategoriesOrder[subCatKey] ||
                                                            getInitialSubcategoriesOrder(cat, flashcards);

                                                        return userDefinedOrder.map((subcat) => {
                                                            const subcatCount = flashcards.filter(
                                                                fc => fc.category === subcat && fc.superCategory === cat
                                                            ).length;
                                                            const knowSubcatCount = flashcards.filter(
                                                                fc => fc.category === subcat && fc.superCategory === cat && fc.know
                                                            ).length;

                                                            return (
                                                                <li key={subcat}>
                                                                    <button
                                                                        className={`btn bg-color-cream color-green-strong-dark ${
                                                                            selectedCategory === subcat && learningFilter === 'all'
                                                                                ? 'btn--active'
                                                                                : ''
                                                                        }`}
                                                                        onClick={() => handleRunFlashCards(subcat, cat)}
                                                                    >
                                    <span>
                                      <i className="icon-play-outline"></i>{' '}
                                        {subcat === 'Without category' || subcat === ''
                                            ? t('without_category')
                                            : subcat}{' '}
                                        (<strong>
                                        {knowSubcatCount}
                                      </strong>/{subcatCount})
                                        {subcatCount - knowSubcatCount > 0 ? (
                                            <>
                                                <sub className="bg-color-green">
                                                    {Math.ceil(
                                                        (knowSubcatCount * 100) / subcatCount
                                                    )}%
                                                </sub>
                                                <sup className="bg-color-red">
                                                    {subcatCount - knowSubcatCount}
                                                </sup>
                                            </>
                                        ) : (
                                            <sub className="o-category-complited bg-color-green vertical-center-count">
                                                <i className="icon-ok"></i>
                                            </sub>
                                        )}
                                    </span>
                                                                    </button>
                                                                </li>
                                                            );
                                                        });
                                                    })()}
                                                </ul>
                                            )}
                                        </>
                                    ) : (
                                        count > 0 && (
                                            <button
                                                className={`btn ${
                                                    selectedCategory === cat && learningFilter === 'all'
                                                        ? 'btn--active'
                                                        : ''
                                                }`}
                                                onClick={() => handleRunFlashCards(cat, null)}
                                            >
                        <span>
                          <i className="icon-play-outline"></i>
                            {cat === 'Without category'
                                ? t('without_category')
                                : cat}{' '}
                            (<strong>{knowCount}</strong>/{count})
                            {count - knowCount > 0 ? (
                                <>
                                    <sub className="bg-color-green">
                                        {Math.ceil((knowCount * 100) / count)}%
                                    </sub>
                                    <sup className="bg-color-red">
                                        {count - knowCount}
                                    </sup>
                                </>
                            ) : (
                                <sub className="o-category-complited bg-color-green vertical-center-count">
                                    <i className="icon-ok"></i>
                                </sub>
                            )}
                        </span>
                                            </button>
                                        )
                                    )}
                                </li>
                            );
                        })}
                    </ul>
                ) : (
                    <div className="o-no-flashcards">
                        <p>{t('no_flashcards')}</p>
                        <ul className="o-list-buttons-clear o-list-buttons-clear--nowrap o-default-box">
                            <li>
                                <Link className="btn w-100" to="/create">
                                    <i className="icon-plus"></i> {t('create_flashcard')}
                                </Link>
                            </li>
                            <li>
                                <Link className="btn w-100" to="/import-export">
                                    <i className="icon-export"></i> {t('import_export')}
                                </Link>
                            </li>
                        </ul>
                        <p>{t('choose_set_from_library')}</p>
                        <p>Lub wybierz zestaw z naszej biblioteki fiszek:</p>
                        <Link className="btn w-100 btn--blue" to="/library">
                            <i className="icon-book"></i> {t('library')}
                        </Link>
                    </div>
                )}
            </>
        ) : null
    );
};

export default CategoryList;

import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from 'react-i18next';

const CategoryList = ({
                          loadData,
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

    const [activeSuperCategory, setActiveSuperCategory] = useState(null);

    const handleActiveSuperCategory = (index) => {
        setActiveSuperCategory(activeSuperCategory === index ? null : index);
    };

    const handleRunFlashCards = (category, superCategory) => {
        setSelectedCategory(category);    // Deselect the selected category
        setSelectedSuperCategory(superCategory); // Set the selected superCategory
        setLearningFilter('all');        // Sets the learning filter to 'all'
        setCheckedCards(new Set());      // Clears the checked cards
        setDeck([]);                     // Clears the deck
        setTwoCards([]);                 // Clears the top two cards
    };

    return (
        selectedCategory === null && selectedSuperCategory === null ? (
            <>
                {flashcards.length > 0 ? (
                    <ul className="o-list-categories o-list-categories--main">
                        {/* Przycisk „All” */}
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

                        {/* Przycisk do dodawania fiszek (brak superCategory) */}
                        <li className="o-button-add-flashcard">
                            <button
                                onClick={() => navigate('/create?superCategory=')}
                                type="button"
                                className="justify-content-center"
                            >
                                <i className="icon-plus"></i>
                            </button>
                        </li>

                        {/* Lista kategorii głównych (bez superCategory) */}
                        {orderedCategories.map((cat, index) => {
                            // Obliczamy liczbę fiszek i tych, które już są 'znane':
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

                            // Sprawdzamy, czy istnieją fiszki, które mają superCategory == cat
                            const hasSubcategories = flashcards.some(fc => fc.superCategory === cat);

                            // Jeżeli to nie jest superkategoria i kategoria jest pusta (count === 0), pomijamy renderowanie:
                            if (!hasSubcategories && count === 0) {
                                return null;
                            }

                            return (
                                <li key={cat}>
                                    {hasSubcategories ? (
                                        <>
                                            {/* Superkategoria (folder) */}
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
                              <strong className="color-black">
                                {knowCountSuper}
                              </strong>/{countSuper})
                            </span>
                                                    </button>
                                                );
                                            })()}

                                            {/* Jeśli folder otwarty, wyświetlamy subkategorie */}
                                            {activeSuperCategory === index && (
                                                <ul className="o-list-categories o-list-categories--sub">
                                                    {[...new Set(
                                                        flashcards
                                                            .filter(fc => fc.superCategory === cat)
                                                            .map(fc => fc.category)
                                                    )].map(subcat => {
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
                                      (<strong className="color-green-dark">
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
                                                    })}

                                                    {/* Przycisk do uruchomienia wszystkich fiszek w superkategorii */}
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
                                                                    className="bg-color-cream color-green-strong-dark"
                                                                    onClick={() => handleRunFlashCards(null, cat)}
                                                                >
                                  <span>
                                    <i className="icon-play-outline"></i> {t('all')} (
                                    <strong className="color-green-dark">{knowCountSuper}</strong>/{countSuper})
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
                                                </ul>
                                            )}
                                        </>
                                    ) : (
                                        // Kategoria zwykła (bez subkategorii) – renderuj tylko, jeśli count > 0
                                        count > 0 && (
                                            <>
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
                              (<strong className="color-green-dark">{knowCount}</strong>/{count})
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
                                            </>
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
                        <p>Lub wybierz zestaw z naszej biblioteki fiszek:</p>
                        <Link className="btn w-100 btn--blue" to="/library">
                            <i className="icon-book"></i> Library
                        </Link>
                    </div>
                )}
            </>
        ) : null
    );
};

export default CategoryList;

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  clearKatalog1Progress,
  loadKatalog1Progress,
  saveKatalog1Progress,
} from '../cookies';
import QuestionMetaPanel from '../components/QuestionMetaPanel';
import { buildAnswerOrder } from '../utils/shuffle';
import { buildActivePool, getNextSequentialVisibleId } from '../utils/practicePool';
import {
  clearKatalog1Reviews,
  filterQuestionsByCategories,
  getCorrectDisplayIndices,
  isKatalog1SelectionCorrect,
  KATALOG1_CATEGORIES,
  KATALOG1_DEFAULT_CATEGORIES,
  katalog1AssetUrl,
  loadKatalog1Reviews,
  parseQuestionCategories,
  saveKatalog1Review,
} from '../utils/katalog1';
import {
  hasQuestionNote,
  isQuestionHard,
  isQuestionHidden,
  loadQuestionMeta,
  toggleQuestionHard,
} from '../utils/questionMeta';

const MASTERY_THRESHOLD = 3;
const KATALOG1_SETTINGS_KEY = 'katalog1Settings';
const META_MODE_KEY = 'katalog1';

export default function Katalog1Practice() {
  const [allQuestions, setAllQuestions] = useState({});
  const [activeQuestionPool, setActiveQuestionPool] = useState([]);
  const [currentQuestionId, setCurrentQuestionId] = useState(null);
  const [progress, setProgress] = useState({});
  const [questionMeta, setQuestionMeta] = useState({});
  const [selectedAnswers, setSelectedAnswers] = useState([]);
  const [isAnswered, setIsAnswered] = useState(false);
  const [isRevealed, setIsRevealed] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [answerOrder, setAnswerOrder] = useState([]);
  const [questionsMenuOpen, setQuestionsMenuOpen] = useState(false);
  const [settingsMenuOpen, setSettingsMenuOpen] = useState(false);
  const [questionReview, setQuestionReview] = useState(null);
  const [settings, setSettings] = useState({
    shuffleQuestions: false,
    shuffleAnswers: false,
    selectedCategories: KATALOG1_DEFAULT_CATEGORIES,
    prioritizeLowest: false,
    showHardOnly: false,
  });

  const settingsRef = useRef(null);
  const questionsRef = useRef(null);

  const filteredQuestions = useMemo(() => {
    return filterQuestionsByCategories(allQuestions, settings.selectedCategories);
  }, [allQuestions, settings.selectedCategories]);

  const categoryCounts = useMemo(() => {
    const counts = Object.fromEntries(KATALOG1_CATEGORIES.map((cat) => [cat, 0]));
    for (const question of Object.values(allQuestions)) {
      for (const cat of parseQuestionCategories(question.categories)) {
        if (counts[cat] !== undefined) counts[cat]++;
      }
    }
    return counts;
  }, [allQuestions]);

  const filteredQuestionIds = useMemo(() => {
    return Object.keys(filteredQuestions).sort((a, b) => Number(a) - Number(b));
  }, [filteredQuestions]);

  const currentQuestionPosition = useMemo(() => {
    const index = filteredQuestionIds.indexOf(String(currentQuestionId));
    return index >= 0 ? index + 1 : 0;
  }, [filteredQuestionIds, currentQuestionId]);

  const sortedQuestions = useMemo(() => {
    const entries = Object.entries(filteredQuestions).sort(([idA], [idB]) => Number(idA) - Number(idB));
    if (!settings.showHardOnly) return entries;
    return entries.filter(([id]) => isQuestionHard(questionMeta, id));
  }, [filteredQuestions, questionMeta, settings.showHardOnly]);

  useEffect(() => {
    const loadData = async () => {
      try {
        const response = await fetch('./katalog1/k1_questions.json');
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const data = await response.json();
        setAllQuestions(data);
        setProgress(loadKatalog1Progress());
        setQuestionMeta(loadQuestionMeta(META_MODE_KEY));

        const savedSettings = JSON.parse(localStorage.getItem(KATALOG1_SETTINGS_KEY) || '{}');
        setSettings((prev) => ({
          ...prev,
          ...savedSettings,
          selectedCategories: savedSettings.selectedCategories ?? KATALOG1_DEFAULT_CATEGORIES,
        }));
      } catch (error) {
        console.error('Failed to load katalog1 questions:', error);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, []);

  const updateSettings = useCallback((patch) => {
    setSettings((prev) => {
      const next = { ...prev, ...patch };
      localStorage.setItem(KATALOG1_SETTINGS_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const refreshActivePool = useCallback((currentProgress, questions, meta, currentSettings, preserveQuestionId = null) => {
    const pool = buildActivePool(questions, currentProgress, meta, currentSettings, MASTERY_THRESHOLD);
    setActiveQuestionPool(pool);
    const preserve = preserveQuestionId != null ? String(preserveQuestionId) : null;
    if (preserve && pool.map(String).includes(preserve)) {
      setCurrentQuestionId(preserve);
    } else if (pool.length > 0) {
      setCurrentQuestionId(pool[0]);
    } else {
      setCurrentQuestionId(null);
    }
  }, []);

  useEffect(() => {
    if (Object.keys(allQuestions).length > 0) {
      refreshActivePool(progress, filteredQuestions, questionMeta, settings);
    }
  }, [allQuestions, filteredQuestions, settings.shuffleQuestions, settings.prioritizeLowest, refreshActivePool]);

  useEffect(() => {
    if (!currentQuestionId || !allQuestions[currentQuestionId] || isAnswered) return;
    const question = allQuestions[currentQuestionId];
    setAnswerOrder(buildAnswerOrder(question.options.length, settings.shuffleAnswers));
  }, [currentQuestionId, allQuestions, settings.shuffleAnswers, isAnswered]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (settingsMenuOpen && settingsRef.current && !settingsRef.current.contains(event.target)) {
        setSettingsMenuOpen(false);
      }
      if (
        questionsMenuOpen &&
        questionsRef.current &&
        !questionsRef.current.contains(event.target) &&
        !event.target.closest('.questions-menu-toggle')
      ) {
        setQuestionsMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [questionsMenuOpen, settingsMenuOpen]);

  const getDisplayOrder = useCallback(() => {
    const question = allQuestions[currentQuestionId];
    if (!question) return [];
    if (answerOrder.length === question.options.length) return answerOrder;
    return buildAnswerOrder(question.options.length, settings.shuffleAnswers);
  }, [allQuestions, currentQuestionId, answerOrder, settings.shuffleAnswers]);

  const resetQuestionState = () => {
    setIsAnswered(false);
    setIsRevealed(false);
    setSelectedAnswers([]);
    setQuestionReview(null);
  };

  useEffect(() => {
    if (Object.keys(allQuestions).length === 0) return;

    if (Object.keys(filteredQuestions).length === 0) {
      if (currentQuestionId !== null) setCurrentQuestionId(null);
      return;
    }

    if (currentQuestionId && !filteredQuestions[currentQuestionId]) {
      refreshActivePool(progress, filteredQuestions, questionMeta, settings);
      resetQuestionState();
    }
  }, [filteredQuestions, currentQuestionId, allQuestions, progress, questionMeta, settings, refreshActivePool]);

  const loadNextQuestion = useCallback(() => {
    resetQuestionState();

    if (!settings.shuffleQuestions) {
      const nextId = getNextSequentialVisibleId(currentQuestionId, filteredQuestions, questionMeta);
      setCurrentQuestionId(nextId);
      return;
    }

    let nextPool = [...activeQuestionPool];
    const currentCount = progress[currentQuestionId] || 0;

    if (currentCount >= MASTERY_THRESHOLD) {
      nextPool = activeQuestionPool.filter((id) => id !== currentQuestionId);
    } else {
      nextPool.shift();
    }

    if (nextPool.length === 0) {
      refreshActivePool(progress, filteredQuestions, questionMeta, settings);
    } else {
      setActiveQuestionPool(nextPool);
      setCurrentQuestionId(nextPool[0]);
    }
  }, [activeQuestionPool, filteredQuestions, progress, questionMeta, refreshActivePool, currentQuestionId, settings]);

  const handleQuestionHidden = useCallback((nextMeta = questionMeta, isNowHidden = true) => {
    resetQuestionState();
    refreshActivePool(
      progress,
      filteredQuestions,
      nextMeta,
      settings,
      isNowHidden ? null : currentQuestionId
    );
  }, [progress, filteredQuestions, questionMeta, settings, refreshActivePool, currentQuestionId]);

  const toggleSelection = useCallback(
    (displayIndex) => {
      if (isAnswered) return;
      setSelectedAnswers((prev) =>
        prev.includes(displayIndex)
          ? prev.filter((index) => index !== displayIndex)
          : [...prev, displayIndex].sort((a, b) => a - b)
      );
    },
    [isAnswered]
  );

  const handleSubmitAnswer = useCallback(() => {
    if (isAnswered) return;

    const question = allQuestions[currentQuestionId];
    if (!question) return;

    const order = getDisplayOrder();
    const isCorrect = isKatalog1SelectionCorrect(question, order, selectedAnswers);

    setIsAnswered(true);
    setIsRevealed(false);
    setQuestionReview(loadKatalog1Reviews()[currentQuestionId] || null);

    if (isCorrect) {
      const newCount = (progress[currentQuestionId] || 0) + 1;
      const newProgress = { ...progress, [currentQuestionId]: newCount };
      setProgress(newProgress);
      saveKatalog1Progress(newProgress);
    }
  }, [isAnswered, allQuestions, currentQuestionId, progress, getDisplayOrder, selectedAnswers]);

  const handleRevealAnswer = useCallback(() => {
    if (isAnswered) return;
    const question = allQuestions[currentQuestionId];
    if (!question) return;

    const order = getDisplayOrder();
    const correctIndices = getCorrectDisplayIndices(question, order);

    setSelectedAnswers(correctIndices);
    setIsAnswered(true);
    setIsRevealed(true);
    setQuestionReview(loadKatalog1Reviews()[currentQuestionId] || null);
  }, [isAnswered, allQuestions, currentQuestionId, getDisplayOrder]);

  const handleReview = (value) => {
    saveKatalog1Review(currentQuestionId, value);
    setQuestionReview(value);
  };

  const handleResetProgress = () => {
    if (window.confirm('Resetovati napredak za propise saobraćaja?')) {
      clearKatalog1Progress();
      setProgress({});
      resetQuestionState();
      refreshActivePool({}, filteredQuestions, questionMeta, settings);
    }
  };

  const handleResetReviews = () => {
    if (window.confirm('Obrisati sve privremene ocjene pitanja?')) {
      clearKatalog1Reviews();
      setQuestionReview(null);
    }
  };

  const handleShuffleQuestionsToggle = () => {
    const next = !settings.shuffleQuestions;
    const nextSettings = { ...settings, shuffleQuestions: next };
    updateSettings({ shuffleQuestions: next });
    refreshActivePool(progress, filteredQuestions, questionMeta, nextSettings);
    resetQuestionState();
  };

  const handleShuffleAnswersToggle = () => {
    updateSettings({ shuffleAnswers: !settings.shuffleAnswers });
  };

  const handlePrioritizeToggle = () => {
    const next = !settings.prioritizeLowest;
    const nextSettings = { ...settings, prioritizeLowest: next };
    updateSettings({ prioritizeLowest: next });
    refreshActivePool(progress, filteredQuestions, questionMeta, nextSettings);
    resetQuestionState();
  };

  const handleShowHardOnlyToggle = () => {
    updateSettings({ showHardOnly: !settings.showHardOnly });
  };

  const handleCategoryToggle = (category) => {
    const current = settings.selectedCategories ?? KATALOG1_DEFAULT_CATEGORIES;
    let next;

    if (current.includes(category)) {
      if (current.length === 1) return;
      next = current.filter((cat) => cat !== category);
    } else {
      next = KATALOG1_CATEGORIES.filter((cat) => current.includes(cat) || cat === category);
    }

    const nextSettings = { ...settings, selectedCategories: next };
    updateSettings({ selectedCategories: next });
    const nextFiltered = filterQuestionsByCategories(allQuestions, next);
    refreshActivePool(progress, nextFiltered, questionMeta, nextSettings);
    resetQuestionState();
  };

  const jumpToQuestion = (id) => {
    if (!filteredQuestions[id]) return;
    resetQuestionState();
    setCurrentQuestionId(id);
    setQuestionsMenuOpen(false);
  };

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.metaKey || event.ctrlKey || event.altKey) return;

      if (
        event.key.toLowerCase() === 'h' &&
        !['INPUT', 'TEXTAREA'].includes(event.target?.tagName) &&
        currentQuestionId
      ) {
        event.preventDefault();
        setQuestionMeta((prev) => toggleQuestionHard(META_MODE_KEY, prev, currentQuestionId));
        return;
      }

      if (isAnswered) {
        if (event.key === 'Enter') {
          event.preventDefault();
          loadNextQuestion();
        }
        return;
      }

      if (event.key === 'Enter') {
        event.preventDefault();
        handleSubmitAnswer();
        return;
      }

      const question = allQuestions[currentQuestionId];
      if (!question) return;

      if (event.key === '4' && question.options.length < 4) {
        event.preventDefault();
        handleRevealAnswer();
        return;
      }

      const optionIndex = parseInt(event.key, 10) - 1;
      if (optionIndex < 0 || Number.isNaN(optionIndex) || optionIndex >= question.options.length) {
        return;
      }

      event.preventDefault();
      toggleSelection(optionIndex);
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    isAnswered,
    loadNextQuestion,
    handleSubmitAnswer,
    handleRevealAnswer,
    toggleSelection,
    allQuestions,
    currentQuestionId,
  ]);

  const renderQuizCard = () => {
    if (isLoading) {
      return (
        <div className="card">
          <h1>Učitavanje...</h1>
        </div>
      );
    }

    if (!currentQuestionId) {
      const filteredIds = Object.keys(filteredQuestions);
      const totalQuestions = filteredIds.length;
      const masteredQuestions = filteredIds.filter(
        (id) => (progress[id] || 0) >= MASTERY_THRESHOLD
      ).length;

      if (totalQuestions > 0 && masteredQuestions === totalQuestions) {
        return (
          <div className="card completion-screen">
            <h1>🎉 Čestitamo! 🎉</h1>
            <p>Savladali ste sva pitanja iz propisa saobraćaja!</p>
          </div>
        );
      }
      return (
        <div className="card">
          <h1>Nema dostupnih pitanja.</h1>
          <p>Odaberite barem jednu kategoriju u postavkama (⚙).</p>
        </div>
      );
    }

    const question = filteredQuestions[currentQuestionId];
    if (!question) {
      return (
        <div className="card">
          <h1>Nema dostupnih pitanja.</h1>
          <p>Odaberite barem jednu kategoriju u postavkama (⚙).</p>
        </div>
      );
    }

    const correctCount = progress[currentQuestionId] || 0;
    const displayOrder = getDisplayOrder();
    const correctDisplayIndices = getCorrectDisplayIndices(question, displayOrder);
    const isCorrectSelection =
      isRevealed ||
      (isAnswered && isKatalog1SelectionCorrect(question, displayOrder, selectedAnswers));
    const hasMultipleCorrect = correctDisplayIndices.length > 1;
    const revealKeyHint = question.options.length < 4 ? '4' : null;

    return (
      <div className="card">
        <div className="question-stats">
          <span>
            Pitanje {currentQuestionPosition} od {filteredQuestionIds.length}
          </span>
          <span style={{ margin: '0 10px' }}>|</span>
          <span>
            Tačno odgovoreno: {correctCount}/{MASTERY_THRESHOLD}
          </span>
          {question.categories && (
            <>
              <span style={{ margin: '0 10px' }}>|</span>
              <span className="question-category">{question.categories}</span>
            </>
          )}
          {isQuestionHard(questionMeta, currentQuestionId) && (
            <>
              <span style={{ margin: '0 10px' }}>|</span>
              <span className="question-hard-badge">★ Teško</span>
            </>
          )}
        </div>

        <h2 className="question-text">{question.question}</h2>

        {hasMultipleCorrect && !isAnswered && (
          <p className="multi-select-hint">Možete odabrati više odgovora prije potvrde.</p>
        )}

        <div className="options-container">
          {displayOrder.map((originalIndex, displayIndex) => {
            let buttonClass = 'option-button';
            const isSelected = selectedAnswers.includes(displayIndex);

            if (isAnswered) {
              if (correctDisplayIndices.includes(displayIndex)) {
                buttonClass += ' correct';
              } else if (isSelected) {
                buttonClass += ' incorrect';
              } else {
                buttonClass += ' neutral';
              }
            } else if (isSelected) {
              buttonClass += ' selected';
            }

            return (
              <button
                key={originalIndex}
                type="button"
                className={buttonClass}
                onClick={() => toggleSelection(displayIndex)}
                disabled={isAnswered}
              >
                {`${String.fromCharCode(65 + displayIndex)}) ${question.options[originalIndex]}`}
              </button>
            );
          })}
        </div>

        {!isAnswered && (
          <div className="submit-actions">
            <button type="button" className="primary-button submit-button" onClick={handleSubmitAnswer}>
              Potvrdi odgovor (Enter)
            </button>
            <button type="button" className="reveal-button" onClick={handleRevealAnswer}>
              Provjeri tačan odgovor{revealKeyHint ? ` (${revealKeyHint})` : ''}
            </button>
          </div>
        )}

        <QuestionMetaPanel
          modeKey={META_MODE_KEY}
          questionId={currentQuestionId}
          meta={questionMeta}
          setMeta={setQuestionMeta}
          onHidden={handleQuestionHidden}
        />

        <div className="feedback-container">
          {isAnswered && (
            <>
              <p className={`feedback-text ${isCorrectSelection ? 'correct' : 'incorrect'}`}>
                {isCorrectSelection ? '✅ TAČNO!' : '❌ NETAČNO!'}
              </p>

              {question.question_pic && (
                <div className="question-pic-review">
                  <p className="question-pic-label">Ilustracija pitanja</p>
                  <div className="question-pic-wrap">
                    <img
                      src={katalog1AssetUrl(question.question_pic)}
                      alt={`Ilustracija za pitanje ${currentQuestionId}`}
                      className="question-pic"
                    />
                  </div>
                  <p className="review-prompt">Kako vam se čini ovo pitanje?</p>
                  <div className="review-buttons">
                    <button
                      type="button"
                      className={`review-button agree${questionReview === 'agree' ? ' selected' : ''}`}
                      onClick={() => handleReview('agree')}
                    >
                      Slažem se
                    </button>
                    <button
                      type="button"
                      className={`review-button disagree${questionReview === 'disagree' ? ' selected' : ''}`}
                      onClick={() => handleReview('disagree')}
                    >
                      Ne slažem se
                    </button>
                  </div>
                  {questionReview && (
                    <p className="review-saved">Ocena sačuvana lokalno (privremeno).</p>
                  )}
                </div>
              )}

              <button type="button" className="next-button" onClick={loadNextQuestion}>
                Dalje (Enter)
              </button>
            </>
          )}
        </div>

        <div className="keyboard-hints">
          <p>
            <kbd>1</kbd>–<kbd>{question.options.length}</kbd> — odaberi / poništi odgovor
          </p>
          <p><kbd>Enter</kbd> — potvrdi odgovor</p>
          {revealKeyHint && <p><kbd>{revealKeyHint}</kbd> — provjeri tačan odgovor</p>}
          <p><kbd>h</kbd> — označi / poništi teško</p>
          <p><kbd>Enter</kbd> (nakon odgovora) — nastavi</p>
        </div>
      </div>
    );
  };

  return (
    <>
      <div className="worksheet-toolbar">
        <button
          type="button"
          className={`icon-button questions-menu-toggle ${questionsMenuOpen ? 'active' : ''}`}
          onClick={() => setQuestionsMenuOpen((open) => !open)}
          aria-label="Lista pitanja"
          aria-expanded={questionsMenuOpen}
        >
          ?
        </button>

        <div className="settings-menu" ref={settingsRef}>
          <button
            type="button"
            className={`icon-button settings-menu-toggle ${settingsMenuOpen ? 'active' : ''}`}
            onClick={() => setSettingsMenuOpen((open) => !open)}
            aria-label="Postavke"
            aria-expanded={settingsMenuOpen}
          >
            ⚙
          </button>
          {settingsMenuOpen && (
            <div className="toolbar-dropdown settings-dropdown">
              <h4>Postavke</h4>
              <label className="settings-option">
                <input
                  type="checkbox"
                  checked={settings.shuffleQuestions}
                  onChange={handleShuffleQuestionsToggle}
                />
                <span>Miješaj pitanja</span>
              </label>
              <label className="settings-option">
                <input
                  type="checkbox"
                  checked={settings.shuffleAnswers}
                  onChange={handleShuffleAnswersToggle}
                />
                <span>Miješaj odgovore</span>
              </label>
              <label className="settings-option">
                <input
                  type="checkbox"
                  checked={settings.prioritizeLowest}
                  onChange={handlePrioritizeToggle}
                />
                <span>Prioritizuj najslabija pitanja</span>
              </label>
              <label className="settings-option">
                <input
                  type="checkbox"
                  checked={settings.showHardOnly}
                  onChange={handleShowHardOnlyToggle}
                />
                <span>Samo teška u listi (?)</span>
              </label>
              <div className="settings-categories">
                <h5>Kategorije dozvola</h5>
                <p className="settings-categories-hint">
                  Uključena: {settings.selectedCategories.join(', ')} (
                  {Object.keys(filteredQuestions).length} pitanja)
                </p>
                {KATALOG1_CATEGORIES.map((category) => (
                  <label key={category} className="settings-option">
                    <input
                      type="checkbox"
                      checked={settings.selectedCategories.includes(category)}
                      onChange={() => handleCategoryToggle(category)}
                    />
                    <span>
                      {category} ({categoryCounts[category]})
                    </span>
                  </label>
                ))}
              </div>
              <button type="button" className="settings-reset" onClick={handleResetProgress}>
                Resetuj napredak
              </button>
              <button type="button" className="settings-reset" onClick={handleResetReviews}>
                Obriši ocjene pitanja
              </button>
            </div>
          )}
        </div>
      </div>

      {questionsMenuOpen && (
        <button
          type="button"
          className="sidebar-backdrop"
          aria-label="Zatvori listu pitanja"
          onClick={() => setQuestionsMenuOpen(false)}
        />
      )}

      <div className={`app-container ${questionsMenuOpen ? 'sidebar-open' : ''}`}>
        <aside
          ref={questionsRef}
          className={`progress-sidebar ${questionsMenuOpen ? 'open' : ''}`}
          aria-hidden={!questionsMenuOpen}
        >
          <div className="progress-sidebar-header">
            <h3>Napredak — propisi</h3>
            <button
              type="button"
              className="sidebar-close"
              onClick={() => setQuestionsMenuOpen(false)}
              aria-label="Zatvori"
            >
              ×
            </button>
          </div>
          <div className="progress-list">
            {sortedQuestions.map(([id, q]) => {
              const correctCount = progress[id] || 0;
              const isMastered = correctCount >= MASTERY_THRESHOLD;
              const isCurrent = id === currentQuestionId;
              const review = loadKatalog1Reviews()[id];
              const hidden = isQuestionHidden(questionMeta, id);
              const hard = isQuestionHard(questionMeta, id);
              const noted = hasQuestionNote(questionMeta, id);
              return (
                <button
                  key={id}
                  type="button"
                  className={`progress-item ${isMastered ? 'mastered' : ''} ${isCurrent ? 'current' : ''} ${hidden ? 'hidden-question' : ''} ${hard ? 'hard-question' : ''}`}
                  onClick={() => jumpToQuestion(id)}
                >
                  <span className="progress-item-text">
                    {hard && '★ '}
                    {noted && '📝 '}
                    {hidden && '🚫 '}
                    {review === 'agree' && '👍 '}
                    {review === 'disagree' && '👎 '}
                    Pitanje {id}: {q.question.substring(0, 28)}...
                  </span>
                  <div className="progress-bar-container">
                    <div
                      className="progress-bar"
                      style={{ width: `${(correctCount / MASTERY_THRESHOLD) * 100}%` }}
                    />
                  </div>
                  <span className="progress-item-count">
                    {correctCount}/{MASTERY_THRESHOLD}
                  </span>
                </button>
              );
            })}
          </div>
        </aside>

        <div className="quiz-card">{renderQuizCard()}</div>
      </div>
    </>
  );
}

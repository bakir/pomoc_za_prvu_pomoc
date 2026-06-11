import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  clearKatalog2Progress,
  loadKatalog2Progress,
  saveKatalog2Progress,
} from '../cookies';
import { buildAnswerOrder, orderQuestionIds } from '../utils/shuffle';
import {
  clearKatalog2Reviews,
  getCorrectDisplayIndices,
  isKatalog2SelectionCorrect,
  katalog2AssetUrl,
  loadKatalog2Reviews,
  saveKatalog2Review,
} from '../utils/katalog2';

const MASTERY_THRESHOLD = 3;
const KATALOG2_SETTINGS_KEY = 'katalog2Settings';

export default function Katalog2Practice() {
  const [allQuestions, setAllQuestions] = useState({});
  const [activeQuestionPool, setActiveQuestionPool] = useState([]);
  const [currentQuestionId, setCurrentQuestionId] = useState(null);
  const [progress, setProgress] = useState({});
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
  });

  const settingsRef = useRef(null);
  const questionsRef = useRef(null);

  const sortedQuestions = useMemo(() => {
    return Object.entries(allQuestions).sort(([idA], [idB]) => Number(idA) - Number(idB));
  }, [allQuestions]);

  useEffect(() => {
    const loadData = async () => {
      try {
        const response = await fetch('./katalog2/k2_questions.json');
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const data = await response.json();
        setAllQuestions(data);
        setProgress(loadKatalog2Progress());

        const savedSettings = JSON.parse(localStorage.getItem(KATALOG2_SETTINGS_KEY) || '{}');
        setSettings((prev) => ({ ...prev, ...savedSettings }));
      } catch (error) {
        console.error('Failed to load katalog2 questions:', error);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, []);

  const updateSettings = useCallback((patch) => {
    setSettings((prev) => {
      const next = { ...prev, ...patch };
      localStorage.setItem(KATALOG2_SETTINGS_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const refreshActivePool = useCallback((currentProgress, questions, shuffleQuestions) => {
    const unmasteredIds = Object.keys(questions).filter(
      (id) => (currentProgress[id] || 0) < MASTERY_THRESHOLD
    );
    const ordered = orderQuestionIds(unmasteredIds, shuffleQuestions);
    setActiveQuestionPool(ordered);
    setCurrentQuestionId(ordered.length > 0 ? ordered[0] : null);
  }, []);

  useEffect(() => {
    if (Object.keys(allQuestions).length > 0) {
      refreshActivePool(progress, allQuestions, settings.shuffleQuestions);
    }
  }, [allQuestions, refreshActivePool]);

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

  const loadNextQuestion = useCallback(() => {
    resetQuestionState();

    let nextPool = [...activeQuestionPool];
    const currentCount = progress[currentQuestionId] || 0;

    if (currentCount >= MASTERY_THRESHOLD) {
      nextPool = activeQuestionPool.filter((id) => id !== currentQuestionId);
    } else {
      nextPool.shift();
    }

    if (nextPool.length === 0) {
      refreshActivePool(progress, allQuestions, settings.shuffleQuestions);
    } else {
      setActiveQuestionPool(nextPool);
      setCurrentQuestionId(nextPool[0]);
    }
  }, [activeQuestionPool, allQuestions, progress, refreshActivePool, currentQuestionId, settings.shuffleQuestions]);

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
    const isCorrect = isKatalog2SelectionCorrect(question, order, selectedAnswers);

    setIsAnswered(true);
    setIsRevealed(false);
    setQuestionReview(loadKatalog2Reviews()[currentQuestionId] || null);

    if (isCorrect) {
      const newCount = (progress[currentQuestionId] || 0) + 1;
      const newProgress = { ...progress, [currentQuestionId]: newCount };
      setProgress(newProgress);
      saveKatalog2Progress(newProgress);
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
    setQuestionReview(loadKatalog2Reviews()[currentQuestionId] || null);
  }, [isAnswered, allQuestions, currentQuestionId, getDisplayOrder]);

  const handleReview = (value) => {
    saveKatalog2Review(currentQuestionId, value);
    setQuestionReview(value);
  };

  const handleResetProgress = () => {
    if (window.confirm('Resetovati napredak za saobraćajne znakove?')) {
      clearKatalog2Progress();
      setProgress({});
      resetQuestionState();
      refreshActivePool({}, allQuestions, settings.shuffleQuestions);
    }
  };

  const handleResetReviews = () => {
    if (window.confirm('Obrisati sve privremene ocjene pitanja?')) {
      clearKatalog2Reviews();
      setQuestionReview(null);
    }
  };

  const handleShuffleQuestionsToggle = () => {
    const next = !settings.shuffleQuestions;
    updateSettings({ shuffleQuestions: next });
    refreshActivePool(progress, allQuestions, next);
    resetQuestionState();
  };

  const handleShuffleAnswersToggle = () => {
    updateSettings({ shuffleAnswers: !settings.shuffleAnswers });
  };

  const jumpToQuestion = (id) => {
    resetQuestionState();
    setCurrentQuestionId(id);
    setQuestionsMenuOpen(false);
  };

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.metaKey || event.ctrlKey || event.altKey) return;

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

      if (event.key === '4') {
        event.preventDefault();
        handleRevealAnswer();
        return;
      }

      const optionIndex = parseInt(event.key, 10) - 1;
      if (optionIndex < 0 || Number.isNaN(optionIndex)) return;

      const question = allQuestions[currentQuestionId];
      if (!question || optionIndex >= question.options.length) return;

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
      const totalQuestions = Object.keys(allQuestions).length;
      const masteredQuestions = Object.values(progress).filter((count) => count >= MASTERY_THRESHOLD).length;

      if (totalQuestions > 0 && masteredQuestions === totalQuestions) {
        return (
          <div className="card completion-screen">
            <h1>🎉 Čestitamo! 🎉</h1>
            <p>Savladali ste sva pitanja o saobraćajnim znakovima!</p>
          </div>
        );
      }
      return (
        <div className="card">
          <h1>Nema dostupnih pitanja.</h1>
        </div>
      );
    }

    const question = allQuestions[currentQuestionId];
    const correctCount = progress[currentQuestionId] || 0;
    const displayOrder = getDisplayOrder();
    const correctDisplayIndices = getCorrectDisplayIndices(question, displayOrder);
    const isCorrectSelection =
      isRevealed ||
      (isAnswered && isKatalog2SelectionCorrect(question, displayOrder, selectedAnswers));
    const hasMultipleCorrect = correctDisplayIndices.length > 1;

    return (
      <div className="card">
        <div className="question-stats">
          <span>
            Pitanje {currentQuestionId} od {Object.keys(allQuestions).length}
          </span>
          <span style={{ margin: '0 10px' }}>|</span>
          <span>
            Tačno odgovoreno: {correctCount}/{MASTERY_THRESHOLD}
          </span>
        </div>

        {question.image && (
          <div className="question-image-wrap">
            <img
              src={katalog2AssetUrl(question.image)}
              alt={`Saobraćajni znak za pitanje ${currentQuestionId}`}
              className="question-image"
            />
          </div>
        )}

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
              Provjeri tačan odgovor (4)
            </button>
          </div>
        )}

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
                      src={katalog2AssetUrl(question.question_pic)}
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
          <p><kbd>1</kbd>–<kbd>3</kbd> — odaberi / poništi odgovor</p>
          <p><kbd>Enter</kbd> — potvrdi odgovor</p>
          <p><kbd>4</kbd> — provjeri tačan odgovor</p>
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
            <h3>Napredak — znakovi</h3>
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
              const review = loadKatalog2Reviews()[id];
              return (
                <button
                  key={id}
                  type="button"
                  className={`progress-item ${isMastered ? 'mastered' : ''} ${isCurrent ? 'current' : ''}`}
                  onClick={() => jumpToQuestion(id)}
                >
                  <span className="progress-item-text">
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

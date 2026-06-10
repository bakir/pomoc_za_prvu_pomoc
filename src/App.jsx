import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  clearProgress,
  ensureInstanceCookie,
  loadProgress,
  saveProgress,
} from './cookies';
import { buildAnswerOrder, orderQuestionIds } from './utils/shuffle';
import { getViewFromHash, setViewHash, VIEWS } from './routing';
import AboutPage from './pages/AboutPage';
import ExamMode from './pages/ExamMode';

const MASTERY_THRESHOLD = 3;
const LEGACY_PROGRESS_STORAGE_KEY = 'firstAidProgress';
const SETTINGS_STORAGE_KEY = 'firstAidSettings';

function App() {
  const [view, setView] = useState(getViewFromHash);
  const [allQuestions, setAllQuestions] = useState({});
  const [activeQuestionPool, setActiveQuestionPool] = useState([]);
  const [currentQuestionId, setCurrentQuestionId] = useState(null);
  const [progress, setProgress] = useState({});
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [isRevealed, setIsRevealed] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [answerOrder, setAnswerOrder] = useState([]);
  const [questionsMenuOpen, setQuestionsMenuOpen] = useState(false);
  const [settingsMenuOpen, setSettingsMenuOpen] = useState(false);
  const [settings, setSettings] = useState({
    shuffleQuestions: false,
    shuffleAnswers: false,
  });

  const settingsRef = useRef(null);
  const questionsRef = useRef(null);

  const navigate = useCallback((nextView) => {
    setViewHash(nextView);
    setView(nextView);
    setQuestionsMenuOpen(false);
    setSettingsMenuOpen(false);
  }, []);

  useEffect(() => {
    const onHashChange = () => setView(getViewFromHash());
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  const sortedQuestions = useMemo(() => {
    return Object.entries(allQuestions).sort(([idA], [idB]) => Number(idA) - Number(idB));
  }, [allQuestions]);

  useEffect(() => {
    const loadData = async () => {
      try {
        const response = await fetch('./questions.json');
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        setAllQuestions(data);

        ensureInstanceCookie();
        const savedProgress = loadProgress(LEGACY_PROGRESS_STORAGE_KEY);
        setProgress(savedProgress);

        const savedSettings = JSON.parse(localStorage.getItem(SETTINGS_STORAGE_KEY) || '{}');
        setSettings((prev) => ({ ...prev, ...savedSettings }));
      } catch (error) {
        console.error('Failed to load questions:', error);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, []);

  const updateSettings = useCallback((patch) => {
    setSettings((prev) => {
      const next = { ...prev, ...patch };
      localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const refreshActivePool = useCallback((currentProgress, questions, shuffleQuestions) => {
    const unmasteredIds = Object.keys(questions).filter(
      (id) => (currentProgress[id] || 0) < MASTERY_THRESHOLD
    );

    const ordered = orderQuestionIds(unmasteredIds, shuffleQuestions);
    setActiveQuestionPool(ordered);

    if (ordered.length > 0) {
      setCurrentQuestionId(ordered[0]);
    } else {
      setCurrentQuestionId(null);
    }
  }, []);

  useEffect(() => {
    if (Object.keys(allQuestions).length > 0) {
      refreshActivePool(progress, allQuestions, settings.shuffleQuestions);
    }
  }, [allQuestions, refreshActivePool]);

  useEffect(() => {
    if (view !== VIEWS.PRACTICE) return;
    if (!currentQuestionId || !allQuestions[currentQuestionId] || isAnswered) return;
    const question = allQuestions[currentQuestionId];
    setAnswerOrder(buildAnswerOrder(question.options.length, settings.shuffleAnswers));
  }, [view, currentQuestionId, allQuestions, settings.shuffleAnswers, isAnswered]);

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

  const loadNextQuestion = useCallback(() => {
    setIsAnswered(false);
    setIsRevealed(false);
    setSelectedAnswer(null);

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

  const handleAnswer = useCallback(
    (displayIndex) => {
      if (isAnswered) return;

      const question = allQuestions[currentQuestionId];
      if (!question) return;

      const order = getDisplayOrder();
      const originalIndex = order[displayIndex];
      const isCorrect = originalIndex === question.correct_index;

      setSelectedAnswer(displayIndex);
      setIsAnswered(true);
      setIsRevealed(false);

      if (isCorrect) {
        const newCount = (progress[currentQuestionId] || 0) + 1;
        const newProgress = { ...progress, [currentQuestionId]: newCount };
        setProgress(newProgress);
        saveProgress(newProgress);
      }
    },
    [isAnswered, allQuestions, currentQuestionId, progress, getDisplayOrder]
  );

  const handleRevealAnswer = useCallback(() => {
    if (isAnswered) return;

    const question = allQuestions[currentQuestionId];
    if (!question) return;

    const order = getDisplayOrder();
    const correctDisplayIndex = order.indexOf(question.correct_index);

    setSelectedAnswer(correctDisplayIndex);
    setIsAnswered(true);
    setIsRevealed(true);
  }, [isAnswered, allQuestions, currentQuestionId, getDisplayOrder]);

  const handleResetProgress = () => {
    if (window.confirm('Are you sure you want to reset all your progress?')) {
      clearProgress();
      setProgress({});
      setIsAnswered(false);
      setIsRevealed(false);
      setSelectedAnswer(null);
      refreshActivePool({}, allQuestions, settings.shuffleQuestions);
    }
  };

  const handleShuffleQuestionsToggle = () => {
    const next = !settings.shuffleQuestions;
    updateSettings({ shuffleQuestions: next });
    refreshActivePool(progress, allQuestions, next);
    setIsAnswered(false);
    setIsRevealed(false);
    setSelectedAnswer(null);
  };

  const handleShuffleAnswersToggle = () => {
    updateSettings({ shuffleAnswers: !settings.shuffleAnswers });
  };

  const jumpToQuestion = (id) => {
    setIsAnswered(false);
    setIsRevealed(false);
    setSelectedAnswer(null);
    setCurrentQuestionId(id);
    setQuestionsMenuOpen(false);
  };

  useEffect(() => {
    if (view !== VIEWS.PRACTICE) return;

    const handleKeyDown = (event) => {
      if (event.metaKey || event.ctrlKey || event.altKey) return;

      if (isAnswered) {
        if (event.key === 'Enter') {
          event.preventDefault();
          loadNextQuestion();
        }
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
      handleAnswer(optionIndex);
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [view, isAnswered, loadNextQuestion, handleAnswer, handleRevealAnswer, allQuestions, currentQuestionId]);

  const renderPracticeContent = () => {
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
            <p>Uspješno ste savladali sva pitanja!</p>
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
    const correctDisplayIndex = displayOrder.indexOf(question.correct_index);
    const isCorrectSelection = isRevealed || selectedAnswer === correctDisplayIndex;

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
        <h2 className="question-text">{question.question}</h2>

        <div className="options-container">
          {displayOrder.map((originalIndex, displayIndex) => {
            let buttonClass = 'option-button';
            if (isAnswered) {
              if (displayIndex === correctDisplayIndex) {
                buttonClass += ' correct';
              } else if (displayIndex === selectedAnswer) {
                buttonClass += ' incorrect';
              } else {
                buttonClass += ' neutral';
              }
            }
            return (
              <button
                key={originalIndex}
                className={buttonClass}
                onClick={() => handleAnswer(displayIndex)}
                disabled={isAnswered}
              >
                {`${String.fromCharCode(65 + displayIndex)}) ${question.options[originalIndex]}`}
              </button>
            );
          })}
        </div>

        {!isAnswered && (
          <button type="button" className="reveal-button" onClick={handleRevealAnswer}>
            Provjeri tačan odgovor (4)
          </button>
        )}

        <div className="feedback-container">
          {isAnswered && (
            <>
              <p className={`feedback-text ${isCorrectSelection ? 'correct' : 'incorrect'}`}>
                {isCorrectSelection ? '✅ TAČNO!' : '❌ NETAČNO!'}
              </p>
              <button className="next-button" onClick={loadNextQuestion}>
                Dalje (Enter)
              </button>
            </>
          )}
        </div>

        <div className="keyboard-hints">
          <p><kbd>1</kbd> — prvi odgovor</p>
          <p><kbd>2</kbd> — drugi odgovor</p>
          <p><kbd>3</kbd> — treći odgovor</p>
          <p><kbd>4</kbd> — provjeri tačan odgovor</p>
          <p><kbd>Enter</kbd> — nastavi</p>
        </div>
      </div>
    );
  };

  const renderMainContent = () => {
    if (view === VIEWS.ABOUT) {
      return <AboutPage onNavigate={navigate} />;
    }
    if (view === VIEWS.EXAM) {
      return <ExamMode allQuestions={allQuestions} isLoading={isLoading} onNavigate={navigate} />;
    }
    return renderPracticeContent();
  };

  return (
    <div className="app-shell">
      <header className="app-toolbar">
        <div className="toolbar-left">
          {view === VIEWS.PRACTICE && (
            <button
              type="button"
              className={`icon-button questions-menu-toggle ${questionsMenuOpen ? 'active' : ''}`}
              onClick={() => setQuestionsMenuOpen((open) => !open)}
              aria-label="Lista pitanja"
              aria-expanded={questionsMenuOpen}
            >
              ?
            </button>
          )}

          {view === VIEWS.PRACTICE && (
            <div className="settings-menu" ref={settingsRef}>
              <button
                type="button"
                className={`icon-button settings-menu-toggle ${settingsMenuOpen ? 'active' : ''}`}
                onClick={() => {
                  setSettingsMenuOpen((open) => !open);
                }}
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
                </div>
              )}
            </div>
          )}
        </div>

        <nav className="mode-nav" aria-label="Način rada">
          <button
            type="button"
            className={`mode-nav-button ${view === VIEWS.PRACTICE ? 'active' : ''}`}
            onClick={() => navigate(VIEWS.PRACTICE)}
          >
            Vježba
          </button>
          <button
            type="button"
            className={`mode-nav-button ${view === VIEWS.EXAM ? 'active' : ''}`}
            onClick={() => navigate(VIEWS.EXAM)}
          >
            Ispit
          </button>
          <button
            type="button"
            className={`mode-nav-button ${view === VIEWS.ABOUT ? 'active' : ''}`}
            onClick={() => navigate(VIEWS.ABOUT)}
          >
            O aplikaciji
          </button>
        </nav>
      </header>

      {view === VIEWS.PRACTICE && questionsMenuOpen && (
        <button
          type="button"
          className="sidebar-backdrop"
          aria-label="Zatvori listu pitanja"
          onClick={() => setQuestionsMenuOpen(false)}
        />
      )}

      <div className={`app-container ${view === VIEWS.PRACTICE && questionsMenuOpen ? 'sidebar-open' : ''}`}>
        {view === VIEWS.PRACTICE && (
          <aside
            ref={questionsRef}
            className={`progress-sidebar ${questionsMenuOpen ? 'open' : ''}`}
            aria-hidden={!questionsMenuOpen}
          >
            <div className="progress-sidebar-header">
              <h3>Napredak</h3>
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
              {sortedQuestions.map(([id, question]) => {
                const correctCount = progress[id] || 0;
                const isMastered = correctCount >= MASTERY_THRESHOLD;
                const isCurrent = id === currentQuestionId;
                return (
                  <button
                    key={id}
                    type="button"
                    className={`progress-item ${isMastered ? 'mastered' : ''} ${isCurrent ? 'current' : ''}`}
                    onClick={() => jumpToQuestion(id)}
                  >
                    <span className="progress-item-text">
                      Pitanje {id}: {question.question.substring(0, 30)}...
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
        )}

        <div className="quiz-card">{renderMainContent()}</div>
      </div>

      <footer className="cookie-notice">
        <p>
          Koristimo <strong>kolačiće</strong> isključivo za pohranu vašeg napretka u kvizu.
          Podaci ostaju u vašem pregledniku i ne dijele se s trećim stranama.
        </p>
      </footer>
    </div>
  );
}

export default App;

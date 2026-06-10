import { useState, useEffect, useCallback, useMemo } from 'react';

const MASTERY_THRESHOLD = 3;
const PROGRESS_STORAGE_KEY = 'firstAidProgress';

function App() {
  const [allQuestions, setAllQuestions] = useState({});
  const [activeQuestionPool, setActiveQuestionPool] = useState([]);
  const [currentQuestionId, setCurrentQuestionId] = useState(null);
  const [progress, setProgress] = useState({});
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Memoize the sorted list of all questions
  const sortedQuestions = useMemo(() => {
    return Object.entries(allQuestions).sort(([idA], [idB]) => Number(idA) - Number(idB));
  }, [allQuestions]);

  // Load data and progress on initial render
  useEffect(() => {
    const loadData = async () => {
      try {
        const response = await fetch('./questions.json');
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        setAllQuestions(data);

        const savedProgress = JSON.parse(localStorage.getItem(PROGRESS_STORAGE_KEY) || '{}');
        setProgress(savedProgress);
        
      } catch (error) {
        console.error("Failed to load questions:", error);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, []);

  const refreshActivePool = useCallback((currentProgress, questions) => {
    const unmasteredIds = Object.keys(questions).filter(id => 
      (currentProgress[id] || 0) < MASTERY_THRESHOLD
    );
    
    const shuffled = unmasteredIds.sort(() => 0.5 - Math.random());
    setActiveQuestionPool(shuffled);

    if (shuffled.length > 0) {
      setCurrentQuestionId(shuffled[0]);
    } else {
      setCurrentQuestionId(null);
    }
  }, []);

  useEffect(() => {
    if (Object.keys(allQuestions).length > 0) {
      refreshActivePool(progress, allQuestions);
    }
    // Only re-run when questions load — not on every progress update,
    // otherwise a correct answer immediately jumps to the next question.
  }, [allQuestions, refreshActivePool]);


  const loadNextQuestion = useCallback(() => {
    setIsAnswered(false);
    setSelectedAnswer(null);

    let nextPool = [...activeQuestionPool];
    
    const currentCount = progress[currentQuestionId] || 0;
    if (currentCount >= MASTERY_THRESHOLD) {
        nextPool = activeQuestionPool.filter(id => id !== currentQuestionId);
    } else {
        nextPool.shift();
    }

    if (nextPool.length === 0) {
      refreshActivePool(progress, allQuestions);
    } else {
      setActiveQuestionPool(nextPool);
      setCurrentQuestionId(nextPool[0]);
    }
  }, [activeQuestionPool, allQuestions, progress, refreshActivePool, currentQuestionId]);

  const handleAnswer = useCallback((selectedIndex) => {
    if (isAnswered) return;

    const question = allQuestions[currentQuestionId];
    if (!question) return; // Guard against race conditions

    const isCorrect = selectedIndex === question.correct_index;

    setSelectedAnswer(selectedIndex);
    setIsAnswered(true);

    if (isCorrect) {
      const newCount = (progress[currentQuestionId] || 0) + 1;
      const newProgress = { ...progress, [currentQuestionId]: newCount };
      setProgress(newProgress);
      localStorage.setItem(PROGRESS_STORAGE_KEY, JSON.stringify(newProgress));
    }
  }, [isAnswered, allQuestions, currentQuestionId, progress]);

  const handleResetProgress = () => {
    if (window.confirm("Are you sure you want to reset all your progress?")) {
      localStorage.removeItem(PROGRESS_STORAGE_KEY);
      setProgress({});
      setIsAnswered(false);
      setSelectedAnswer(null);
      refreshActivePool({}, allQuestions);
    }
  };

  // Keyboard shortcuts: 1–9 to pick an answer, Enter for next (no modifiers)
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

      const optionIndex = parseInt(event.key, 10) - 1;
      if (optionIndex < 0 || Number.isNaN(optionIndex)) return;

      const question = allQuestions[currentQuestionId];
      if (!question || optionIndex >= question.options.length) return;

      event.preventDefault();
      handleAnswer(optionIndex);
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isAnswered, loadNextQuestion, handleAnswer, allQuestions, currentQuestionId]);

  const renderQuizContent = () => {
    if (isLoading) {
      return <div className="card"><h1>Loading...</h1></div>;
    }

    if (!currentQuestionId) {
      const totalQuestions = Object.keys(allQuestions).length;
      const masteredQuestions = Object.values(progress).filter(count => count >= MASTERY_THRESHOLD).length;

      if (totalQuestions > 0 && masteredQuestions === totalQuestions) {
          return (
              <div className="card completion-screen">
                  <h1>🎉 Čestitamo! 🎉</h1>
                  <p>Uspješno ste savladali sva pitanja!</p>
              </div>
          );
      }
      return <div className="card"><h1>No questions available.</h1></div>
    }

    const question = allQuestions[currentQuestionId];
    const correctCount = progress[currentQuestionId] || 0;
    const isCorrectSelection = selectedAnswer === question.correct_index;

    return (
      <div className="card">
        <div className="question-stats">
          <span>Pitanje {currentQuestionId} od {Object.keys(allQuestions).length}</span>
          <span style={{ margin: '0 10px' }}>|</span>
          <span>Nivo: {correctCount}/{MASTERY_THRESHOLD}</span>
        </div>
        <h2 className="question-text">{question.question}</h2>
        
        <div className="options-container">
          {question.options.map((option, index) => {
            let buttonClass = 'option-button';
            if (isAnswered) {
              if (index === question.correct_index) {
                buttonClass += ' correct';
              } else if (index === selectedAnswer) {
                buttonClass += ' incorrect';
              } else {
                buttonClass += ' neutral';
              }
            }
            return (
              <button
                key={index}
                className={buttonClass}
                onClick={() => handleAnswer(index)}
                disabled={isAnswered}
              >
                {`${String.fromCharCode(65 + index)}) ${option}`}
              </button>
            );
          })}
        </div>

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

        <p className="keyboard-hints">
          Pritisni <kbd>1</kbd> za prvi odgovor, <kbd>2</kbd> za drugi, itd.
          {' '}Pritisni <kbd>Enter</kbd> da nastaviš.
        </p>
      </div>
    );
  };

  return (
    <div className="app-container">
      <button className="reset-button" onClick={handleResetProgress}>Reset Progress</button>
      <div className="quiz-card">
        {renderQuizContent()}
      </div>
      <aside className="progress-sidebar">
        <h3>Napredak</h3>
        <div className="progress-list">
          {sortedQuestions.map(([id, question]) => {
            const correctCount = progress[id] || 0;
            const isMastered = correctCount >= MASTERY_THRESHOLD;
            return (
              <div key={id} className={`progress-item ${isMastered ? 'mastered' : ''}`}>
                <span className="progress-item-text">
                  Pitanje {id}: {question.question.substring(0, 30)}...
                </span>
                <div className="progress-bar-container">
                  <div 
                    className="progress-bar"
                    style={{ width: `${(correctCount / MASTERY_THRESHOLD) * 100}%` }}
                  ></div>
                </div>
                <span className="progress-item-count">{correctCount}/{MASTERY_THRESHOLD}</span>
              </div>
            );
          })}
        </div>
      </aside>
    </div>
  );
}

export default App;

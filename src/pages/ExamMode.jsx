import { useState, useEffect, useCallback, useMemo } from 'react';
import { buildAnswerOrder, pickRandomQuestionIds } from '../utils/shuffle';

const EXAM_SIZE = 10;

export default function ExamMode({ allQuestions, isLoading, onNavigate }) {
  const [phase, setPhase] = useState('intro');
  const [questionIds, setQuestionIds] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [answerOrder, setAnswerOrder] = useState([]);
  const [results, setResults] = useState([]);

  const currentQuestionId = questionIds[currentIndex];
  const question = currentQuestionId ? allQuestions[currentQuestionId] : null;

  const startExam = useCallback(() => {
    const ids = pickRandomQuestionIds(allQuestions, EXAM_SIZE);
    setQuestionIds(ids);
    setCurrentIndex(0);
    setSelectedAnswer(null);
    setIsAnswered(false);
    setResults([]);
    setPhase('active');
  }, [allQuestions]);

  useEffect(() => {
    if (phase !== 'active' || !question) return;
    setAnswerOrder(buildAnswerOrder(question.options.length, true));
    setSelectedAnswer(null);
    setIsAnswered(false);
  }, [phase, currentIndex, question]);

  const correctDisplayIndex = useMemo(() => {
    if (!question) return -1;
    return answerOrder.indexOf(question.correct_index);
  }, [question, answerOrder]);

  const handleAnswer = (displayIndex) => {
    if (isAnswered || !question) return;

    const originalIndex = answerOrder[displayIndex];
    const isCorrect = originalIndex === question.correct_index;

    setSelectedAnswer(displayIndex);
    setIsAnswered(true);
    setResults((prev) => [
      ...prev,
      {
        id: currentQuestionId,
        questionText: question.question,
        isCorrect,
        selectedText: question.options[originalIndex],
        correctText: question.options[question.correct_index],
      },
    ]);
  };

  const handleNext = useCallback(() => {
    if (currentIndex + 1 >= questionIds.length) {
      setPhase('results');
      return;
    }
    setCurrentIndex((i) => i + 1);
  }, [currentIndex, questionIds.length]);

  useEffect(() => {
    if (phase !== 'active') return;

    const handleKeyDown = (event) => {
      if (event.metaKey || event.ctrlKey || event.altKey) return;

      if (isAnswered) {
        if (event.key === 'Enter') {
          event.preventDefault();
          handleNext();
        }
        return;
      }

      const optionIndex = parseInt(event.key, 10) - 1;
      if (optionIndex < 0 || Number.isNaN(optionIndex)) return;
      if (!question || optionIndex >= question.options.length) return;

      event.preventDefault();
      handleAnswer(optionIndex);
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [phase, isAnswered, question, handleNext]);

  if (isLoading) {
    return (
      <div className="card">
        <h1>Učitavanje...</h1>
      </div>
    );
  }

  if (phase === 'intro') {
    return (
      <div className="card exam-intro">
        <h1>Ispit — 10 pitanja</h1>
        <p>
          Dobijate <strong>{EXAM_SIZE} nasumičnih pitanja</strong> iz cijele baze. Odgovori se
          miješaju. Nakon svakog pitanja vidite da li ste tačno odgovorili.
        </p>
        <ul className="exam-rules">
          <li>Ispit ne utiče na napredak u vježbi</li>
          <li>Nema opcije „provjeri odgovor” — samo vaš izbor</li>
          <li>Na kraju dobijate ukupan rezultat</li>
        </ul>
        <div className="exam-intro-actions">
          <button type="button" className="primary-button" onClick={startExam}>
            Započni ispit
          </button>
          <button type="button" className="secondary-button" onClick={() => onNavigate('practice')}>
            Nazad na vježbu
          </button>
        </div>
      </div>
    );
  }

  if (phase === 'results') {
    const score = results.filter((r) => r.isCorrect).length;
    const passed = score >= 7;

    return (
      <div className="card exam-results">
        <h1>Rezultat ispita</h1>
        <p className={`exam-score ${passed ? 'passed' : 'failed'}`}>
          {score}/{EXAM_SIZE} tačno
        </p>
        <p className="exam-score-message">
          {passed
            ? 'Odličan rezultat! Nastavite vježbati za još bolji skor.'
            : 'Nastavite učiti — vježba je najbolji put do uspjeha.'}
        </p>

        <div className="exam-review">
          <h2>Pregled odgovora</h2>
          {results.map((item, index) => (
            <div
              key={`${item.id}-${index}`}
              className={`exam-review-item ${item.isCorrect ? 'correct' : 'incorrect'}`}
            >
              <p className="exam-review-question">
                {index + 1}. {item.questionText}
              </p>
              {!item.isCorrect && (
                <p className="exam-review-wrong">Vaš odgovor: {item.selectedText}</p>
              )}
              <p className="exam-review-correct">Tačan odgovor: {item.correctText}</p>
            </div>
          ))}
        </div>

        <div className="exam-intro-actions">
          <button type="button" className="primary-button" onClick={startExam}>
            Novi ispit
          </button>
          <button type="button" className="secondary-button" onClick={() => onNavigate('practice')}>
            Nazad na vježbu
          </button>
        </div>
      </div>
    );
  }

  const isCorrectSelection = selectedAnswer === correctDisplayIndex;

  return (
    <div className="card">
      <div className="question-stats">
        <span>
          Ispit — pitanje {currentIndex + 1} od {questionIds.length}
        </span>
        <span style={{ margin: '0 10px' }}>|</span>
        <span>Tačno do sada: {results.filter((r) => r.isCorrect).length}</span>
      </div>
      <h2 className="question-text">{question.question}</h2>

      <div className="options-container">
        {answerOrder.map((originalIndex, displayIndex) => {
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
              type="button"
              className={buttonClass}
              onClick={() => handleAnswer(displayIndex)}
              disabled={isAnswered}
            >
              {`${String.fromCharCode(65 + displayIndex)}) ${question.options[originalIndex]}`}
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
            <button type="button" className="next-button" onClick={handleNext}>
              {currentIndex + 1 >= questionIds.length ? 'Vidi rezultat (Enter)' : 'Dalje (Enter)'}
            </button>
          </>
        )}
      </div>

      <div className="keyboard-hints">
        <p><kbd>1</kbd> — prvi odgovor</p>
        <p><kbd>2</kbd> — drugi odgovor</p>
        <p><kbd>3</kbd> — treći odgovor</p>
        <p><kbd>Enter</kbd> — nastavi</p>
      </div>
    </div>
  );
}

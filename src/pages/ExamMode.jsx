import { useState, useCallback, useMemo } from 'react';
import { buildAnswerOrder, pickRandomQuestionIds } from '../utils/shuffle';

const EXAM_SIZE = 10;

export default function ExamMode({ allQuestions, isLoading, onNavigate }) {
  const [phase, setPhase] = useState('intro');
  const [questionIds, setQuestionIds] = useState([]);
  const [answerOrders, setAnswerOrders] = useState({});
  const [selections, setSelections] = useState({});
  const [results, setResults] = useState([]);

  const answeredCount = useMemo(
    () => questionIds.filter((id) => selections[id] !== undefined).length,
    [questionIds, selections]
  );

  const startExam = useCallback(() => {
    const ids = pickRandomQuestionIds(allQuestions, EXAM_SIZE);
    const orders = {};

    ids.forEach((id) => {
      const question = allQuestions[id];
      orders[id] = buildAnswerOrder(question.options.length, false);
    });

    setQuestionIds(ids);
    setAnswerOrders(orders);
    setSelections({});
    setResults([]);
    setPhase('active');
  }, [allQuestions]);

  const handleSelect = (questionId, displayIndex) => {
    setSelections((prev) => ({ ...prev, [questionId]: displayIndex }));
  };

  const handleSubmit = () => {
    if (answeredCount < questionIds.length) {
      window.alert(`Odgovorite na sva pitanja prije predaje. (${answeredCount}/${questionIds.length})`);
      return;
    }

    const graded = questionIds.map((id) => {
      const question = allQuestions[id];
      const order = answerOrders[id];
      const displayIndex = selections[id];
      const originalIndex = order[displayIndex];
      const isCorrect = originalIndex === question.correct_index;

      return {
        id,
        questionText: question.question,
        isCorrect,
        selectedText: question.options[originalIndex],
        correctText: question.options[question.correct_index],
      };
    });

    setResults(graded);
    setPhase('results');
  };

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
          Dobijate <strong>{EXAM_SIZE} nasumičnih pitanja</strong> iz cijele baze. Sva pitanja su
          prikazana odjednom — odaberite odgovore i predajte ispit na kraju.
        </p>
        <ul className="exam-rules">
          <li>Ispit ne utiče na napredak u vježbi</li>
          <li>Nema povratne informacije dok ne kliknete „Predaj ispit”</li>
          <li>Na kraju vidite rezultat i pregled svih odgovora</li>
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

  return (
    <div className="card exam-form">
      <div className="exam-form-header">
        <h1>Ispit — {EXAM_SIZE} pitanja</h1>
        <p className="exam-progress">
          Odgovoreno: {answeredCount}/{questionIds.length}
        </p>
      </div>

      <div className="exam-questions-list">
        {questionIds.map((id, index) => {
          const question = allQuestions[id];
          const order = answerOrders[id] || [];
          const selected = selections[id];

          return (
            <section key={id} className="exam-question-block">
              <h2 className="exam-question-title">
                {index + 1}. {question.question}
              </h2>
              <div className="options-container">
                {order.map((originalIndex, displayIndex) => {
                  const isSelected = selected === displayIndex;
                  return (
                    <button
                      key={originalIndex}
                      type="button"
                      className={`option-button${isSelected ? ' selected' : ''}`}
                      onClick={() => handleSelect(id, displayIndex)}
                    >
                      {`${String.fromCharCode(65 + displayIndex)}) ${question.options[originalIndex]}`}
                    </button>
                  );
                })}
              </div>
            </section>
          );
        })}
      </div>

      <div className="exam-submit-area">
        <button
          type="button"
          className="primary-button exam-submit-button"
          onClick={handleSubmit}
        >
          Predaj ispit
        </button>
        <p className="exam-submit-hint">
          {answeredCount < questionIds.length
            ? `Odgovorite na preostalih ${questionIds.length - answeredCount} pitanja prije predaje.`
            : 'Sva pitanja su odgovorena. Možete predati ispit.'}
        </p>
      </div>
    </div>
  );
}

import { useCallback, useEffect, useMemo, useState } from 'react';
import { UDALJENOSTI_QUIZ_IDS, UDALJENOSTI_SECTIONS } from '../data/udaljenosti';
import {
  filterQuestionsByCategories,
  getCorrectDisplayIndices,
  isKatalog1SelectionCorrect,
  KATALOG1_DEFAULT_CATEGORIES,
  katalog1AssetUrl,
} from '../utils/katalog1';
import { navigateToLekcijeHub } from '../routing';

function formatQuestionIds(ids) {
  if (ids.length === 1) return `Pitanje br. ${ids[0]}`;
  return `Pitanja br. ${ids.join(', ')}`;
}

export default function LekcijeUdaljenosti() {
  const [phase, setPhase] = useState('hub');
  const [openSections, setOpenSections] = useState(() =>
    Object.fromEntries(UDALJENOSTI_SECTIONS.map((section) => [section.id, true]))
  );
  const [allQuestions, setAllQuestions] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [selections, setSelections] = useState({});
  const [results, setResults] = useState([]);

  useEffect(() => {
    const loadData = async () => {
      try {
        const response = await fetch('./katalog1/k1_questions.json');
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const data = await response.json();
        setAllQuestions(data);
      } catch (error) {
        console.error('Failed to load katalog1 questions:', error);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, []);

  const quizQuestions = useMemo(() => {
    const bOnly = filterQuestionsByCategories(allQuestions, KATALOG1_DEFAULT_CATEGORIES);
    return UDALJENOSTI_QUIZ_IDS.filter((id) => bOnly[id]).map((id) => [id, bOnly[id]]);
  }, [allQuestions]);

  const answeredCount = useMemo(
    () => quizQuestions.filter(([id]) => (selections[id]?.length ?? 0) > 0).length,
    [quizQuestions, selections]
  );

  const toggleSection = (sectionId) => {
    setOpenSections((prev) => ({ ...prev, [sectionId]: !prev[sectionId] }));
  };

  const toggleSelection = useCallback((questionId, displayIndex) => {
    setSelections((prev) => {
      const current = prev[questionId] ?? [];
      const next = current.includes(displayIndex)
        ? current.filter((index) => index !== displayIndex)
        : [...current, displayIndex].sort((a, b) => a - b);
      return { ...prev, [questionId]: next };
    });
  }, []);

  const startQuiz = () => {
    setSelections({});
    setResults([]);
    setPhase('quiz');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmit = () => {
    if (answeredCount < quizQuestions.length) {
      window.alert(`Odgovorite na sva pitanja prije predaje. (${answeredCount}/${quizQuestions.length})`);
      return;
    }

    const graded = quizQuestions.map(([id, question]) => {
      const displayOrder = question.options.map((_, index) => index);
      const selected = selections[id] ?? [];
      const isCorrect = isKatalog1SelectionCorrect(question, displayOrder, selected);
      const correctIndices = getCorrectDisplayIndices(question, displayOrder);

      return {
        id,
        question,
        isCorrect,
        selectedTexts: selected.map((index) => question.options[displayOrder[index]]),
        correctTexts: correctIndices.map((index) => question.options[displayOrder[index]]),
      };
    });

    setResults(graded);
    setPhase('results');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (isLoading) {
    return (
      <div className="card lekcije-page">
        <h1>Učitavanje...</h1>
      </div>
    );
  }

  if (phase === 'results') {
    const score = results.filter((item) => item.isCorrect).length;
    const total = results.length;
    const passed = score >= Math.ceil(total * 0.7);

    return (
      <div className="card lekcije-page exam-results">
        <p className="lekcije-eyebrow">Udaljenosti · Kviz</p>
        <h1>Rezultat kviza</h1>
        <p className={`exam-score ${passed ? 'passed' : 'failed'}`}>
          {score}/{total} tačno
        </p>
        <p className="exam-score-message">
          {passed
            ? 'Odlično! Savladali ste pitanja o udaljenostima i rastojanjima za B kategoriju.'
            : 'Pregledajte lekcije i pokušajte ponovo.'}
        </p>

        <div className="exam-review">
          <h2>Pregled odgovora</h2>
          {results.map((item, index) => (
            <div
              key={item.id}
              className={`exam-review-item ${item.isCorrect ? 'correct' : 'incorrect'}`}
            >
              <p className="exam-review-question">
                {index + 1}. (br. {item.id}) {item.question.question}
              </p>
              {!item.isCorrect && (
                <p className="exam-review-wrong">
                  Vaš odgovor: {item.selectedTexts.join('; ') || '—'}
                </p>
              )}
              <p className="exam-review-correct">Tačan odgovor: {item.correctTexts.join('; ')}</p>
              {item.question.question_pic && (
                <div className="question-pic-wrap lekcije-review-pic">
                  <img
                    src={katalog1AssetUrl(item.question.question_pic)}
                    alt={`Ilustracija pitanja ${item.id}`}
                    className="question-pic"
                  />
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="exam-intro-actions">
          <button type="button" className="primary-button" onClick={startQuiz}>
            Ponovi kviz
          </button>
          <button type="button" className="secondary-button" onClick={() => setPhase('hub')}>
            Nazad na lekcije
          </button>
        </div>
      </div>
    );
  }

  if (phase === 'quiz') {
    return (
      <div className="card lekcije-page exam-form">
        <div className="exam-form-header">
          <p className="lekcije-eyebrow">Udaljenosti · Kviz</p>
          <h1>Kviz — udaljenosti i rastojanja (B)</h1>
          <p className="exam-progress">
            Odgovoreno: {answeredCount}/{quizQuestions.length}
          </p>
          <p className="lekcije-quiz-note">
            Pitanja su iz kataloga propisa. Kod pitanja s više tačnih odgovora odaberite sve
            ispravne opcije prije predaje.
          </p>
        </div>

        <div className="exam-questions-list">
          {quizQuestions.map(([id, question], index) => {
            const displayOrder = question.options.map((_, optionIndex) => optionIndex);
            const selected = selections[id] ?? [];
            const hasMultiple = question.answers.length > 1;

            return (
              <section key={id} className="exam-question-block">
                <h2 className="exam-question-title">
                  {index + 1}. (katalog br. {id}) {question.question}
                </h2>
                {hasMultiple && (
                  <p className="multi-select-hint">Odaberite sve tačne odgovore.</p>
                )}
                <div className="options-container">
                  {displayOrder.map((originalIndex, displayIndex) => {
                    const isSelected = selected.includes(displayIndex);
                    return (
                      <button
                        key={originalIndex}
                        type="button"
                        className={`option-button${isSelected ? ' selected' : ''}`}
                        onClick={() => toggleSelection(id, displayIndex)}
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
          <button type="button" className="primary-button exam-submit-button" onClick={handleSubmit}>
            Predaj kviz
          </button>
          <p className="exam-submit-hint">
            {answeredCount < quizQuestions.length
              ? `Odgovorite na preostalih ${quizQuestions.length - answeredCount} pitanja prije predaje.`
              : 'Sva pitanja su odgovorena. Možete predati kviz.'}
          </p>
          <button type="button" className="secondary-button lekcije-back-link" onClick={() => setPhase('hub')}>
            Nazad na lekcije
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="lekcije-page">
      <button type="button" className="lekcije-hub-back" onClick={navigateToLekcijeHub}>
        ← Sve lekcije
      </button>

      <header className="lekcije-hero card lekcije-hero-distance">
        <p className="lekcije-eyebrow">Lekcije · B kategorija</p>
        <h1>Udaljenosti i rastojanja</h1>
        <p className="lekcije-intro">
          Propisi o udaljenostima u saobraćaju u Bosni i Hercegovini — sažetak pravila i povezanih
          pitanja iz kataloga. Proširite sekcije za učenje, zatim uradite kviz na dnu.
        </p>
        <div className="lekcije-stats">
          <span>{UDALJENOSTI_SECTIONS.length} teme</span>
          <span>{quizQuestions.length} pitanja u kvizu</span>
        </div>
      </header>

      <div className="lekcije-sections">
        {UDALJENOSTI_SECTIONS.map((section) => {
          const isOpen = openSections[section.id];
          return (
            <section key={section.id} className="lekcije-accordion card">
              <button
                type="button"
                className={`lekcije-accordion-trigger${isOpen ? ' open' : ''}`}
                onClick={() => toggleSection(section.id)}
                aria-expanded={isOpen}
              >
                <span>{section.title}</span>
                <span className="lekcije-accordion-icon" aria-hidden="true">
                  {isOpen ? '−' : '+'}
                </span>
              </button>
              {isOpen && (
                <div className="lekcije-accordion-panel">
                  {section.items.map((item) => (
                    <article key={`${section.id}-${item.distance}`} className="lekcije-rule-card">
                      <div className="lekcije-rule-distance">{item.distance}</div>
                      <p className="lekcije-rule-text">{item.text}</p>
                      <p className="lekcije-rule-questions">{formatQuestionIds(item.questionIds)}</p>
                    </article>
                  ))}
                </div>
              )}
            </section>
          );
        })}
      </div>

      <section className="lekcije-quiz-cta card lekcije-quiz-cta-distance">
        <h2>Kviz — Udaljenosti i rastojanja</h2>
        <p>
          Testirajte znanje na <strong>{quizQuestions.length} pitanja</strong> iz kataloga koja
          pokrivaju ova pravila o udaljenostima. Sva pitanja su prikazana odjednom; predajte kviz na
          kraju da vidite rezultat.
        </p>
        <ul className="exam-rules lekcije-quiz-rules">
          <li>Samo pitanja relevantna za B kategoriju</li>
          <li>Bez povratne informacije dok ne kliknete „Predaj kviz”</li>
          <li>Višestruki odgovori gdje je potrebno</li>
        </ul>
        <button type="button" className="primary-button" onClick={startQuiz}>
          Započni kviz
        </button>
      </section>
    </div>
  );
}

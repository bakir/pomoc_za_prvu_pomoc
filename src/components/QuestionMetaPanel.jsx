import { useEffect, useState } from 'react';
import { getQuestionMetaEntry, updateQuestionMeta } from '../utils/questionMeta';

export default function QuestionMetaPanel({ modeKey, questionId, meta, setMeta, onHidden }) {
  const entry = getQuestionMetaEntry(meta, questionId);
  const [note, setNote] = useState(entry.note || '');

  useEffect(() => {
    setNote(entry.note || '');
  }, [questionId, entry.note]);

  const handleNoteBlur = () => {
    const next = updateQuestionMeta(modeKey, meta, questionId, { note });
    setMeta(next);
  };

  const toggleHidden = () => {
    const hidden = !entry.hidden;
    const next = updateQuestionMeta(modeKey, meta, questionId, { hidden });
    setMeta(next);
    onHidden?.(next, hidden);
  };

  const toggleHard = () => {
    const next = updateQuestionMeta(modeKey, meta, questionId, { hard: !entry.hard });
    setMeta(next);
  };

  return (
    <div className="question-meta-panel">
      <label className="question-meta-label" htmlFor={`note-${modeKey}-${questionId}`}>
        Bilješke
      </label>
      <textarea
        id={`note-${modeKey}-${questionId}`}
        className="question-meta-note"
        value={note}
        onChange={(event) => setNote(event.target.value)}
        onBlur={handleNoteBlur}
        placeholder="Vaše bilješke za ovo pitanje..."
        rows={2}
      />
      <div className="question-meta-actions">
        <button type="button" className="meta-action-button" onClick={toggleHidden}>
          {entry.hidden ? 'Vrati u kviz' : 'Sakrij pitanje'}
        </button>
        <button
          type="button"
          className={`meta-action-button hard-button${entry.hard ? ' selected' : ''}`}
          onClick={toggleHard}
        >
          {entry.hard ? '★ Teško' : '☆ Označi teško'}
        </button>
      </div>
    </div>
  );
}

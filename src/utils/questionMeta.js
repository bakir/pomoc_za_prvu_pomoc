import { loadJsonCookie, saveJsonCookie } from '../cookies';

export const META_COOKIE_KEYS = {
  practice: 'firstAidQuestionMeta',
  katalog1: 'katalog1QuestionMeta',
  katalog2: 'katalog2QuestionMeta',
  katalog3: 'katalog3QuestionMeta',
};

export function loadQuestionMeta(modeKey) {
  return loadJsonCookie(META_COOKIE_KEYS[modeKey], {});
}

export function saveQuestionMeta(modeKey, meta) {
  saveJsonCookie(META_COOKIE_KEYS[modeKey], meta);
}

export function getQuestionMetaEntry(meta, questionId) {
  return meta[questionId] || { note: '', hidden: false, hard: false };
}

export function isQuestionHidden(meta, questionId) {
  return !!getQuestionMetaEntry(meta, questionId).hidden;
}

export function isQuestionHard(meta, questionId) {
  return !!getQuestionMetaEntry(meta, questionId).hard;
}

export function hasQuestionNote(meta, questionId) {
  return !!getQuestionMetaEntry(meta, questionId).note?.trim();
}

export function updateQuestionMeta(modeKey, meta, questionId, patch) {
  const current = getQuestionMetaEntry(meta, questionId);
  const updated = { ...current, ...patch };
  const next = { ...meta, [questionId]: updated };

  if (!updated.note?.trim() && !updated.hidden && !updated.hard) {
    delete next[questionId];
  }

  saveQuestionMeta(modeKey, next);
  return next;
}

export function clearQuestionMeta(modeKey) {
  saveQuestionMeta(modeKey, {});
  return {};
}

const KATALOG3_REVIEWS_KEY = 'katalog3QuestionReviews';

export function katalog3AssetUrl(relativePath) {
  const base = import.meta.env.BASE_URL;
  return `${base}katalog3/${relativePath}`;
}

export function isKatalog3AnswerCorrect(question, originalIndex) {
  return question.answers.includes(originalIndex + 1);
}

export function getCorrectDisplayIndices(question, displayOrder) {
  return displayOrder
    .map((originalIndex, displayIndex) =>
      isKatalog3AnswerCorrect(question, originalIndex) ? displayIndex : -1
    )
    .filter((index) => index >= 0);
}

export function isKatalog3SelectionCorrect(question, displayOrder, selectedDisplayIndices) {
  const correctIndices = getCorrectDisplayIndices(question, displayOrder);
  if (selectedDisplayIndices.length !== correctIndices.length) return false;

  const selectedSet = new Set(selectedDisplayIndices);
  return correctIndices.every((index) => selectedSet.has(index));
}

export function loadKatalog3Reviews() {
  try {
    return JSON.parse(localStorage.getItem(KATALOG3_REVIEWS_KEY) || '{}');
  } catch {
    return {};
  }
}

export function saveKatalog3Review(questionId, value) {
  const reviews = loadKatalog3Reviews();
  reviews[questionId] = value;
  localStorage.setItem(KATALOG3_REVIEWS_KEY, JSON.stringify(reviews));
}

export function clearKatalog3Reviews() {
  localStorage.removeItem(KATALOG3_REVIEWS_KEY);
}

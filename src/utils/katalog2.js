const KATALOG2_REVIEWS_KEY = 'katalog2QuestionReviews';

export function katalog2AssetUrl(relativePath) {
  const base = import.meta.env.BASE_URL;
  return `${base}katalog2/${relativePath}`;
}

export function isKatalog2AnswerCorrect(question, originalIndex) {
  return question.answers.includes(originalIndex + 1);
}

export function getCorrectDisplayIndices(question, displayOrder) {
  return displayOrder
    .map((originalIndex, displayIndex) =>
      isKatalog2AnswerCorrect(question, originalIndex) ? displayIndex : -1
    )
    .filter((index) => index >= 0);
}

export function loadKatalog2Reviews() {
  try {
    return JSON.parse(localStorage.getItem(KATALOG2_REVIEWS_KEY) || '{}');
  } catch {
    return {};
  }
}

export function saveKatalog2Review(questionId, value) {
  const reviews = loadKatalog2Reviews();
  reviews[questionId] = value;
  localStorage.setItem(KATALOG2_REVIEWS_KEY, JSON.stringify(reviews));
}

export function clearKatalog2Reviews() {
  localStorage.removeItem(KATALOG2_REVIEWS_KEY);
}

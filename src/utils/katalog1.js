const KATALOG1_REVIEWS_KEY = 'katalog1QuestionReviews';

export const KATALOG1_CATEGORIES = ['A', 'B', 'C', 'D', 'T'];

export const KATALOG1_DEFAULT_CATEGORIES = ['B'];

export function parseQuestionCategories(categories) {
  if (!categories) return [];
  return categories.split(',').map((c) => c.trim()).filter(Boolean);
}

export function questionMatchesCategories(question, selectedCategories) {
  if (!selectedCategories?.length) return false;
  const questionCategories = parseQuestionCategories(question.categories);
  return selectedCategories.some((cat) => questionCategories.includes(cat));
}

export function filterQuestionsByCategories(questions, selectedCategories) {
  return Object.fromEntries(
    Object.entries(questions).filter(([, question]) =>
      questionMatchesCategories(question, selectedCategories)
    )
  );
}

export function katalog1AssetUrl(relativePath) {
  const base = import.meta.env.BASE_URL;
  return `${base}katalog1/${relativePath}`;
}

export function isKatalog1AnswerCorrect(question, originalIndex) {
  return question.answers.includes(originalIndex + 1);
}

export function getCorrectDisplayIndices(question, displayOrder) {
  return displayOrder
    .map((originalIndex, displayIndex) =>
      isKatalog1AnswerCorrect(question, originalIndex) ? displayIndex : -1
    )
    .filter((index) => index >= 0);
}

export function isKatalog1SelectionCorrect(question, displayOrder, selectedDisplayIndices) {
  const correctIndices = getCorrectDisplayIndices(question, displayOrder);
  if (selectedDisplayIndices.length !== correctIndices.length) return false;

  const selectedSet = new Set(selectedDisplayIndices);
  return correctIndices.every((index) => selectedSet.has(index));
}

export function loadKatalog1Reviews() {
  try {
    return JSON.parse(localStorage.getItem(KATALOG1_REVIEWS_KEY) || '{}');
  } catch {
    return {};
  }
}

export function saveKatalog1Review(questionId, value) {
  const reviews = loadKatalog1Reviews();
  reviews[questionId] = value;
  localStorage.setItem(KATALOG1_REVIEWS_KEY, JSON.stringify(reviews));
}

export function clearKatalog1Reviews() {
  localStorage.removeItem(KATALOG1_REVIEWS_KEY);
}

import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
export const root = join(__dirname, '../..');

export const MULTI_HINT_RE = /vi[sš]e\s+t[oao][cč]nih\s+odgovora/i;

export const SOURCES = [
  {
    label: 'katalog1',
    path: 'katalog1/katalog1_final.json',
    load: (data) => data.questions ?? data,
    getAnswers: (q) => q.answers,
    getCategories: (q) => q.categories,
  },
  {
    label: 'katalog2',
    path: 'katalog2/k2_questions.json',
    load: (data) => data,
    getAnswers: (q) => q.answers,
    getCategories: () => null,
  },
  {
    label: 'katalog3',
    path: 'katalog3/k3_answers.json',
    load: (data) => data,
    getAnswers: (q) => q.answers,
    getCategories: () => null,
  },
  {
    label: 'prva_pomoc',
    path: 'public/questions.json',
    load: (data) => data,
    getAnswers: (q) => (q.answers ?? (q.correct_index != null ? [q.correct_index + 1] : [])),
    getCategories: () => null,
  },
];

export function hasMultiHint(text) {
  return MULTI_HINT_RE.test(text ?? '');
}

export function parseCategories(categories) {
  if (!categories) return [];
  return String(categories)
    .split(',')
    .map((c) => c.trim())
    .filter(Boolean);
}

export function matchesCategories(question, selected, getCategories) {
  if (!selected?.length) return true;
  const cats = parseCategories(getCategories(question));
  return selected.some((cat) => cats.includes(cat));
}

export function answerCount(question, getAnswers) {
  const answers = getAnswers(question);
  return Array.isArray(answers) ? answers.length : 0;
}

export function checkSource(source, { categoryFilter = null } = {}) {
  const { label, path, load, getAnswers, getCategories } = source;
  const filePath = join(root, path);
  const data = JSON.parse(readFileSync(filePath, 'utf8'));
  const questions = load(data);

  const missingHint = [];
  const hintButSingle = [];
  let total = 0;
  let multiCount = 0;

  for (const [id, question] of Object.entries(questions)) {
    if (!matchesCategories(question, categoryFilter, getCategories)) continue;

    total += 1;
    const count = answerCount(question, getAnswers);
    const hinted = hasMultiHint(question.question);

    if (count > 1) {
      multiCount += 1;
      if (!hinted) {
        missingHint.push({ id, count, question: question.question });
      }
    } else if (hinted) {
      hintButSingle.push({ id, count, question: question.question });
    }
  }

  return { label, path, total, multiCount, missingHint, hintButSingle };
}

export function checkAllSources(options = {}) {
  return SOURCES.map((source) => checkSource(source, options));
}

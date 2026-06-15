import { getNextSequentialQuestionId, orderQuestionIds } from './shuffle';
import { isQuestionHard, isQuestionHidden } from './questionMeta';

export function getVisibleQuestionIds(questions, meta) {
  return Object.keys(questions).filter((id) => !isQuestionHidden(meta, id));
}

/** Question IDs eligible for quiz navigation (matches sidebar when showHardOnly is on). */
export function getNavigableQuestionIds(questions, meta, settings = {}) {
  let ids = getVisibleQuestionIds(questions, meta);
  if (settings.showHardOnly) {
    ids = ids.filter((id) => isQuestionHard(meta, id));
  }
  return ids.sort((a, b) => Number(a) - Number(b));
}

export function getUnmasteredIds(ids, progress, masteryThreshold) {
  return ids.filter((id) => (progress[id] || 0) < masteryThreshold);
}

export function orderPracticePool(ids, progress, { shuffleQuestions, prioritizeLowest }) {
  if (!ids.length) return [];

  if (prioritizeLowest) {
    const sorted = [...ids].sort((a, b) => {
      const diff = (progress[a] || 0) - (progress[b] || 0);
      if (diff !== 0) return diff;
      return Number(a) - Number(b);
    });

    if (shuffleQuestions) {
      const minProgress = Math.min(...sorted.map((id) => progress[id] || 0));
      const lowestTier = sorted.filter((id) => (progress[id] || 0) === minProgress);
      const rest = sorted.filter((id) => (progress[id] || 0) !== minProgress);
      return [
        ...lowestTier.sort(() => 0.5 - Math.random()),
        ...rest.sort(() => 0.5 - Math.random()),
      ];
    }

    return sorted;
  }

  return orderQuestionIds(ids, shuffleQuestions);
}

export function buildActivePool(questions, progress, meta, settings, masteryThreshold) {
  const navigable = getNavigableQuestionIds(questions, meta, settings);
  const unmastered = getUnmasteredIds(navigable, progress, masteryThreshold);
  return orderPracticePool(unmastered, progress, settings);
}

export function getNextSequentialVisibleId(currentId, questions, meta, settings = {}) {
  const navigableIds = getNavigableQuestionIds(questions, meta, settings);
  return getNextSequentialQuestionId(currentId, navigableIds);
}

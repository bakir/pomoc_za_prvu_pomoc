export function buildAnswerOrder(optionCount, shuffle = true) {
  const order = Array.from({ length: optionCount }, (_, i) => i);
  if (shuffle) {
    for (let i = order.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [order[i], order[j]] = [order[j], order[i]];
    }
  }
  return order;
}

export function orderQuestionIds(ids, shuffle) {
  const sorted = [...ids].sort((a, b) => Number(a) - Number(b));
  if (!shuffle) return sorted;
  return sorted.sort(() => 0.5 - Math.random());
}

export function getNextSequentialQuestionId(currentId, questionIds) {
  const sorted = [...questionIds].map(String).sort((a, b) => Number(a) - Number(b));
  if (sorted.length === 0) return null;
  const currentIndex = sorted.indexOf(String(currentId));
  if (currentIndex === -1) return sorted[0];
  return sorted[(currentIndex + 1) % sorted.length];
}

export function pickRandomQuestionIds(questions, count) {
  const ids = Object.keys(questions);
  const shuffled = [...ids].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, Math.min(count, shuffled.length));
}

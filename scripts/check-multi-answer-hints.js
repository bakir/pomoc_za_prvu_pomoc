#!/usr/bin/env node
/**
 * Finds questions with multiple correct answers but no "(više tačnih odgovora)" hint.
 *
 * Usage: node scripts/check-multi-answer-hints.js
 */

import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

const MULTI_HINT_RE = /vi[sš]e\s+t[oao][cč]nih\s+odgovora/i;

const SOURCES = [
  {
    label: 'katalog1',
    path: 'katalog1/katalog1_final.json',
    load: (data) => data.questions ?? data,
    getAnswers: (q) => q.answers,
  },
  {
    label: 'katalog2',
    path: 'katalog2/k2_questions.json',
    load: (data) => data,
    getAnswers: (q) => q.answers,
  },
  {
    label: 'katalog3',
    path: 'katalog3/k3_answers.json',
    load: (data) => data,
    getAnswers: (q) => q.answers,
  },
  {
    label: 'prva_pomoc',
    path: 'public/questions.json',
    load: (data) => data,
    getAnswers: (q) => (q.answers ?? (q.correct_index != null ? [q.correct_index + 1] : [])),
  },
];

function hasMultiHint(text) {
  return MULTI_HINT_RE.test(text ?? '');
}

function answerCount(question, getAnswers) {
  const answers = getAnswers(question);
  return Array.isArray(answers) ? answers.length : 0;
}

function checkSource({ label, path, load, getAnswers }) {
  const filePath = join(root, path);
  const data = JSON.parse(readFileSync(filePath, 'utf8'));
  const questions = load(data);

  const missingHint = [];
  const hintButSingle = [];
  let total = 0;
  let multiCount = 0;

  for (const [id, question] of Object.entries(questions)) {
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

function printSection(result) {
  const { label, path, total, multiCount, missingHint, hintButSingle } = result;

  console.log(`\n${'='.repeat(72)}`);
  console.log(`${label} (${path})`);
  console.log(`  Total questions: ${total}`);
  console.log(`  Multiple correct answers: ${multiCount}`);

  if (missingHint.length === 0) {
    console.log('  ✓ No multi-answer questions missing the hint.');
  } else {
    console.log(`  ✗ Missing "(više tačnih odgovora)" (${missingHint.length}):`);
    for (const item of missingHint) {
      console.log(`    #${item.id} [${item.count} answers] ${item.question}`);
    }
  }

  if (hintButSingle.length > 0) {
    console.log(`  ⚠ Hint present but only one answer (${hintButSingle.length}):`);
    for (const item of hintButSingle) {
      console.log(`    #${item.id} ${item.question}`);
    }
  }
}

console.log('Checking multi-answer questions vs "(više tačnih odgovora)" hint...\n');

const results = SOURCES.map(checkSource);
let grandMissing = 0;

for (const result of results) {
  printSection(result);
  grandMissing += result.missingHint.length;
}

console.log(`\n${'='.repeat(72)}`);
console.log(`Done. ${grandMissing} question(s) need the hint added.`);
process.exit(grandMissing > 0 ? 1 : 0);

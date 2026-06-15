#!/usr/bin/env node
/**
 * Finds questions where "(više tačnih odgovora)" does not match answer count.
 *
 * Usage:
 *   node scripts/check-multi-answer-hints.js
 *   node scripts/check-multi-answer-hints.js --category B
 */

import { checkAllSources } from './lib/multiAnswerHints.js';

const args = process.argv.slice(2);
const categoryIdx = args.indexOf('--category');
const categoryFilter =
  categoryIdx >= 0 && args[categoryIdx + 1] ? [args[categoryIdx + 1]] : null;

function printSection(result) {
  const { label, path, total, multiCount, missingHint, hintButSingle } = result;

  console.log(`\n${'='.repeat(72)}`);
  console.log(`${label} (${path})${categoryFilter ? ` [category: ${categoryFilter.join(',')}]` : ''}`);
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

  if (hintButSingle.length === 0) {
    console.log('  ✓ No single-answer questions with a false hint.');
  } else {
    console.log(`  ⚠ Hint present but only one answer (${hintButSingle.length}):`);
    for (const item of hintButSingle) {
      console.log(`    #${item.id} ${item.question}`);
    }
  }
}

console.log('Checking multi-answer questions vs "(više tačnih odgovora)" hint...\n');

const results = checkAllSources({ categoryFilter });
let grandMissing = 0;
let grandFalseHint = 0;

for (const result of results) {
  printSection(result);
  grandMissing += result.missingHint.length;
  grandFalseHint += result.hintButSingle.length;
}

const grandTotal = grandMissing + grandFalseHint;

console.log(`\n${'='.repeat(72)}`);
console.log(
  `Done. ${grandTotal} mismatch(es): ${grandMissing} missing hint, ${grandFalseHint} false hint.`
);
process.exit(grandTotal > 0 ? 1 : 0);

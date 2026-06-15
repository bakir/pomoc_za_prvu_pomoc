#!/usr/bin/env node
/**
 * Generates src/data/bitneBrzine.js and src/data/udaljenosti.js from katalog1 B-category analysis.
 * Usage: node scripts/generate-speed-distance-lessons.js
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const questions = JSON.parse(
  readFileSync(join(root, 'katalog1/katalog1_final.json'), 'utf8')
).questions;

const WORD_NUMBERS = {
  jedan: 1,
  jednog: 1,
  dva: 2,
  tri: 3,
  četiri: 4,
  pet: 5,
  šest: 6,
  sedam: 7,
  osam: 8,
  devet: 9,
  deset: 10,
  jedanaest: 11,
  dvanaest: 12,
  petnaest: 15,
  dvadeset: 20,
  trideset: 30,
  četrdeset: 40,
  pedeset: 50,
  šezdeset: 60,
  sedamdeset: 70,
  osamdeset: 80,
  devedeset: 90,
  sto: 100,
  dvjesto: 200,
};

function isB(q) {
  return String(q.categories || '')
    .split(',')
    .map((c) => c.trim())
    .includes('B');
}

function correctTexts(q) {
  return (q.answers || []).map((i) => q.options[i - 1]).filter(Boolean);
}

function normalizeWordNumbers(text) {
  let out = text;
  out = out.replace(/\bjednog\s+metra\b/gi, '1 m');
  for (const [word, num] of Object.entries(WORD_NUMBERS)) {
    out = out.replace(new RegExp(`\\b${word}\\s+metar[a]?\\b`, 'gi'), `${num} m`);
  }
  return out;
}

function extractSpeedValues(text) {
  const normalized = normalizeWordNumbers(text);
  const values = new Set();
  const patterns = [/(\d+)\s*km\/h/gi, /(\d+)\s*km\s+na\s+čas/gi];
  for (const re of patterns) {
    let m;
    while ((m = re.exec(normalized)) !== null) {
      values.add(`${m[1]} km/h`);
    }
  }
  return [...values];
}

function extractDistanceValues(text) {
  const normalized = normalizeWordNumbers(text);
  const values = new Set();

  const rangeRe = /od\s+(\d+(?:[.,]\d+)?)\s*m\s+do\s+(\d+(?:[.,]\d+)?)\s*m/gi;
  let m;
  while ((m = rangeRe.exec(normalized)) !== null) {
    values.add(`${m[1]}–${m[2]} m`);
  }

  const patterns = [
    /najmanje\s+(\d+(?:[.,]\d+)?)\s*a\s+najviše\s+(\d+(?:[.,]\d+)?)\s*m/gi,
    /manjoj\s+od\s+(\d+(?:[.,]\d+)?)\s*m/gi,
    /više\s+od\s+(\d+(?:[.,]\d+)?)\s*m/gi,
    /najmanje\s+(\d+(?:[.,]\d+)?)\s*m/gi,
    /minimalno\s+(\d+(?:[.,]\d+)?)\s*m/gi,
    /(\d+(?:[.,]\d+)?)\s*m\b/gi,
    /(\d+(?:[.,]\d+)?)\s*metar/gi,
    /(\d+(?:[.,]\d+)?)\s*cm/gi,
  ];

  for (const re of patterns) {
    while ((m = re.exec(normalized)) !== null) {
      if (m[2] && !re.source.includes('manjoj')) {
        values.add(`${m[1]}–${m[2]} m`);
      } else {
        const unit = /cm/i.test(m[0]) ? 'cm' : 'm';
        values.add(`${m[1]} ${unit}`);
      }
    }
  }

  return [...values].sort((a, b) => parseFloat(a) - parseFloat(b));
}

function cleanQuestion(text) {
  return text.replace(/\s*\(više tačnih odgovora\)\s*/gi, '').trim();
}

function categorizeSpeedQuestion(q) {
  const text = q.question.toLowerCase();
  if (/početnik|dvije godine|prve\s+2|dobilo vozačku dozvolu.*ne smije dvije godine/i.test(text)) {
    return 'pocetnici';
  }
  if (/traktor|prikolic|vuč|vuče|kamp|vuče drugo/i.test(text)) return 'vozila';
  if (/autoput|brzi put|rezervisan|naselj|van naselja|ograničen|stop-svjetla|radna mašina/i.test(text)) {
    return 'put';
  }
  return 'ostalo';
}

function categorizeDistanceQuestion(q) {
  const text = q.question.toLowerCase();
  const correct = correctTexts(q).join(' ').toLowerCase();
  const full = `${text} ${correct}`;
  if (/trokut|bezbjednosni trokut/i.test(full)) return 'trokut';
  if (/pješak|pješačk.*prelaz/i.test(text) || /^na putu koja ima obilježene pješačke/i.test(text)) {
    return 'pjesaci';
  }
  if (/željeznič|andrejin|šin/i.test(text)) return 'zeljeznicka';
  if (/zaštitn.*pojas|reklam|javni put izvan/i.test(text)) return 'zastitni-pojas';
  if (/stajališt|parkir|zaustav|raskrsnic|slobodnog prolaza/i.test(text)) return 'parkiranje';
  if (/zaprež|vuč.*užet|odstojanje.*vozil|opasne materije/i.test(text)) return 'odstojanje';
  if (/smanjena vidljivost|nepovoljnih atmosferskih/i.test(text)) return 'vidljivost';
  if (/širin|šira od|visin|dužin|teret|gabarit|nadgradnj|kolovoza javnog puta|označena:/i.test(text)) {
    return 'dimenzije';
  }
  if (/svjetl|vidljiv|uoči|osvjetljava/i.test(text)) return 'vidljivost';
  return 'ostalo';
}

const SPEED_SECTION_TITLES = {
  pocetnici: '1. Vozači početnici (prve 2 godine)',
  vozila: '2. Brzine za vuču i specifična vozila',
  put: '3. Ograničenja po tipu puta',
  ostalo: '4. Ostala pravila o brzini',
};

const DIST_SECTION_TITLES = {
  parkiranje: '1. Zaustavljanje i parkiranje',
  pjesaci: '2. Pješaci i pješački prelazi',
  trokut: '3. Bezbjednosni trokut',
  zeljeznicka: '4. Željeznička pruga',
  odstojanje: '5. Odstojanje vozila u kretanju',
  'zastitni-pojas': '6. Zaštitni pojas puta i reklame',
  vidljivost: '7. Vidljivost i svjetla',
  dimenzije: '8. Dimenzije vozila i tereta',
  ostalo: '9. Ostale udaljenosti',
};

function isSpeedQuestion(q) {
  if (/fotografija|videozapis|tahograf|radar|optičkih/i.test(q.question)) return false;
  const correct = correctTexts(q);
  const combined = [q.question, ...q.options, ...correct].join(' ');
  if (!/brzin|km\/h|km na čas/i.test(combined)) return false;
  return /\d+\s*km\/h|\d+\s*km\s+na\s+čas|brzinom većom od|ne prelazi \d+/i.test(combined);
}

function isDistanceQuestion(q) {
  const correct = correctTexts(q);
  const correctText = correct.join(' ');
  const correctHasMeasure = extractDistanceValues(correctText).length > 0;
  const questionHasMeasure = extractDistanceValues(q.question).length > 0;
  if (!correctHasMeasure && !questionHasMeasure) return false;

  const topic =
    /odstojanje|razdaljin|udaljen|rastojanje|širin|visin|dužin|metar|daljin|prolaz|parkir|zaustav|trokut|pješak|željeznič|andrejin|šin|zaštitn|reklam|svjetl|vidljiv|teret|gabarit|kolovoz|stajališt|javni put/i.test(
      q.question
    );
  if (!topic) return false;

  if (!correctHasMeasure && questionHasMeasure) {
    return /manjoj od|najmanje|najviše|odstojanje|razdaljin|udaljen|širin|visin/i.test(q.question);
  }

  if (/lanci za snijeg/i.test(q.question) && !correctHasMeasure) return false;
  if (/širina kolovoza ne smije biti manja/i.test(q.question) && !correctHasMeasure) return false;

  return true;
}

function buildSpeedLessons() {
  const bySection = new Map();

  for (const [id, q] of Object.entries(questions)) {
    if (!isB(q) || !isSpeedQuestion(q)) continue;
    const correct = correctTexts(q);
    const speedsFromCorrect = extractSpeedValues(correct.join(' '));
    const isSlowTrafficRule = /smanj.*brzin/i.test(q.question) && speedsFromCorrect.length === 0;
    if (speedsFromCorrect.length === 0 && !isSlowTrafficRule) continue;

    const section = categorizeSpeedQuestion(q);
    const speedsFromQuestion = extractSpeedValues(q.question);
    const speedsFromOptions = extractSpeedValues(q.options.join(' '));
    const speeds = speedsFromCorrect.length
      ? speedsFromCorrect
      : speedsFromQuestion.length
        ? speedsFromQuestion
        : speedsFromOptions;
    const badge = speeds.length > 0 ? speeds.join(', ') : 'Brzina';

    const answerSummary = correct.map((t) => t.replace(/\s+/g, ' ').trim()).join(' · ');

    const item = {
      speed: badge,
      text: `${cleanQuestion(q.question)} → Tačno: ${answerSummary}`,
      questionIds: [id],
    };

    if (!bySection.has(section)) bySection.set(section, []);
    bySection.get(section).push(item);
  }

  const order = ['pocetnici', 'vozila', 'put', 'ostalo'];
  const sections = order
    .filter((id) => bySection.has(id))
    .map((id) => ({
      id,
      title: SPEED_SECTION_TITLES[id],
      items: bySection.get(id).sort((a, b) => Number(a.questionIds[0]) - Number(b.questionIds[0])),
    }));

  const quizIds = [
    ...new Set(sections.flatMap((s) => s.items.flatMap((i) => i.questionIds))),
  ].sort((a, b) => Number(a) - Number(b));

  return { sections, quizIds };
}

function buildDistanceLessons() {
  const bySection = new Map();

  for (const [id, q] of Object.entries(questions)) {
    if (!isB(q) || !isDistanceQuestion(q)) continue;
    const correct = correctTexts(q);
    const section = categorizeDistanceQuestion(q);
    const distancesFromCorrect = extractDistanceValues(correct.join(' '));
    const distancesFromQuestion = extractDistanceValues(q.question);
    const distances =
      distancesFromCorrect.length > 0 ? distancesFromCorrect : distancesFromQuestion;
    const badge = distances.length > 0 ? distances.join(', ') : 'Udaljenost';

    const answerSummary = correct.map((t) => t.replace(/\s+/g, ' ').trim()).join(' · ');

    const item = {
      distance: badge,
      text: `${cleanQuestion(q.question)} → Tačno: ${answerSummary}`,
      questionIds: [id],
    };

    if (!bySection.has(section)) bySection.set(section, []);
    bySection.get(section).push(item);
  }

  const order = [
    'parkiranje',
    'pjesaci',
    'trokut',
    'zeljeznicka',
    'odstojanje',
    'zastitni-pojas',
    'vidljivost',
    'dimenzije',
    'ostalo',
  ];

  const sections = order
    .filter((id) => bySection.has(id))
    .map((id) => ({
      id,
      title: DIST_SECTION_TITLES[id],
      items: bySection.get(id).sort((a, b) => Number(a.questionIds[0]) - Number(b.questionIds[0])),
    }));

  const quizIds = [
    ...new Set(sections.flatMap((s) => s.items.flatMap((i) => i.questionIds))),
  ].sort((a, b) => Number(a) - Number(b));

  return { sections, quizIds };
}

const speeds = buildSpeedLessons();
const distances = buildDistanceLessons();

function writeModule(path, exportName, sections, quizIds) {
  const content = `// Auto-generated by scripts/generate-speed-distance-lessons.js — do not edit by hand.
// Re-run: npm run generate:lessons

export const ${exportName}_QUIZ_IDS = ${JSON.stringify(quizIds, null, 2)};

export const ${exportName}_SECTIONS = ${JSON.stringify(sections, null, 2)};
`;
  writeFileSync(join(root, path), content, 'utf8');
}

writeModule('src/data/bitneBrzine.js', 'BITNE_BRZINE', speeds.sections, speeds.quizIds);
writeModule('src/data/udaljenosti.js', 'UDALJENOSTI', distances.sections, distances.quizIds);

console.log(`Speeds: ${speeds.quizIds.length} questions in ${speeds.sections.length} sections`);
for (const s of speeds.sections) {
  console.log(`  ${s.title}: ${s.items.map((i) => `#${i.questionIds[0]} ${i.speed}`).join(', ')}`);
}
console.log(`Distances: ${distances.quizIds.length} questions in ${distances.sections.length} sections`);
for (const s of distances.sections) {
  console.log(`  ${s.title}: ${s.items.map((i) => `#${i.questionIds[0]} ${i.distance}`).join(', ')}`);
}

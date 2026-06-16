import {
  getCookie,
  setCookie,
  PROGRESS_COOKIE_KEY,
  KATALOG1_PROGRESS_COOKIE_KEY,
  KATALOG2_PROGRESS_COOKIE_KEY,
  KATALOG3_PROGRESS_COOKIE_KEY,
  INSTANCE_COOKIE_KEY,
} from '../cookies';

const COOKIE_KEYS = [
  PROGRESS_COOKIE_KEY,
  KATALOG1_PROGRESS_COOKIE_KEY,
  KATALOG2_PROGRESS_COOKIE_KEY,
  KATALOG3_PROGRESS_COOKIE_KEY,
  INSTANCE_COOKIE_KEY,
  'firstAidQuestionMeta',
  'katalog1QuestionMeta',
  'katalog2QuestionMeta',
  'katalog3QuestionMeta',
];

const LOCAL_STORAGE_KEYS = [
  'firstAidSettings',
  'katalog1Settings',
  'katalog2Settings',
  'katalog3Settings',
  'katalog1QuestionReviews',
  'katalog2QuestionReviews',
  'katalog3QuestionReviews',
];

function encodeBase64(str) {
  const bytes = new TextEncoder().encode(str);
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

function decodeBase64(str) {
  const normalized = str.replace(/-/g, '+').replace(/_/g, '/');
  const padded = normalized + '='.repeat((4 - (normalized.length % 4)) % 4);
  const binary = atob(padded);
  const bytes = Uint8Array.from(binary, (ch) => ch.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

export function buildProgressTransferKey() {
  const cookies = {};
  const storage = {};

  for (const key of COOKIE_KEYS) {
    const value = getCookie(key);
    if (value != null && value !== '') cookies[key] = value;
  }

  for (const key of LOCAL_STORAGE_KEYS) {
    const value = localStorage.getItem(key);
    if (value != null) storage[key] = value;
  }

  const payload = {
    v: 1,
    ts: Date.now(),
    cookies,
    storage,
  };

  return encodeBase64(JSON.stringify(payload));
}

export function applyProgressTransferKey(transferKey) {
  const decoded = decodeBase64(transferKey.trim());
  const payload = JSON.parse(decoded);

  if (!payload || payload.v !== 1 || typeof payload !== 'object') {
    throw new Error('Neispravan format ključa.');
  }

  const cookies = payload.cookies && typeof payload.cookies === 'object' ? payload.cookies : {};
  const storage = payload.storage && typeof payload.storage === 'object' ? payload.storage : {};

  for (const key of COOKIE_KEYS) {
    if (typeof cookies[key] === 'string') {
      setCookie(key, cookies[key]);
    }
  }

  for (const key of LOCAL_STORAGE_KEYS) {
    if (typeof storage[key] === 'string') {
      localStorage.setItem(key, storage[key]);
    }
  }
}

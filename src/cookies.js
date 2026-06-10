const ONE_YEAR_SECONDS = 365 * 24 * 60 * 60;

export const PROGRESS_COOKIE_KEY = 'firstAidProgress';
export const INSTANCE_COOKIE_KEY = 'firstAidInstance';

export function getCookie(name) {
  const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const match = document.cookie.match(new RegExp(`(?:^|; )${escaped}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

export function setCookie(name, value, maxAgeSeconds = ONE_YEAR_SECONDS) {
  const secure = window.location.protocol === 'https:' ? '; Secure' : '';
  document.cookie = `${name}=${encodeURIComponent(value)}; Path=/; Max-Age=${maxAgeSeconds}; SameSite=Lax${secure}`;
}

export function deleteCookie(name) {
  document.cookie = `${name}=; Path=/; Max-Age=0; SameSite=Lax`;
}

export function loadJsonCookie(name, fallback = {}) {
  try {
    const raw = getCookie(name);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : fallback;
  } catch {
    return fallback;
  }
}

export function saveJsonCookie(name, data) {
  setCookie(name, JSON.stringify(data));
}

export function ensureInstanceCookie() {
  let id = getCookie(INSTANCE_COOKIE_KEY);
  if (!id) {
    id = crypto.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    setCookie(INSTANCE_COOKIE_KEY, id);
  }
  return id;
}

export function loadProgress(legacyStorageKey) {
  const existingCookie = getCookie(PROGRESS_COOKIE_KEY);
  let progress = loadJsonCookie(PROGRESS_COOKIE_KEY);

  if (!existingCookie && legacyStorageKey) {
    try {
      const legacy = localStorage.getItem(legacyStorageKey);
      if (legacy) {
        progress = JSON.parse(legacy);
        saveJsonCookie(PROGRESS_COOKIE_KEY, progress);
        localStorage.removeItem(legacyStorageKey);
      }
    } catch {
      progress = {};
    }
  }

  if (!existingCookie) {
    saveJsonCookie(PROGRESS_COOKIE_KEY, progress);
  }

  return progress;
}

export function saveProgress(progress) {
  saveJsonCookie(PROGRESS_COOKIE_KEY, progress);
}

export function clearProgress() {
  deleteCookie(PROGRESS_COOKIE_KEY);
}

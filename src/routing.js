export const VIEWS = {
  PRACTICE: 'practice',
  KATALOG1: 'katalog1',
  KATALOG2: 'katalog2',
  KATALOG3: 'katalog3',
  LEKCIJE: 'lekcije',
  ABOUT: 'about',
  EXAM: 'exam',
};

export const LEKCIJE_LESSONS = {
  HUB: 'hub',
  BITNE_BRZINE: 'bitne-brzine',
  UDALJENOSTI: 'udaljenosti',
  VISE_TACNIH: 'vise-tacnih',
};

export function getLekcijeLessonFromHash() {
  const hash = window.location.hash.replace(/^#\/?/, '');
  if (hash === 'lekcije/vise-tacnih') return LEKCIJE_LESSONS.VISE_TACNIH;
  if (hash === 'lekcije/udaljenosti') return LEKCIJE_LESSONS.UDALJENOSTI;
  if (hash === 'lekcije/bitne-brzine' || hash === 'bitne-brzine') return LEKCIJE_LESSONS.BITNE_BRZINE;
  return LEKCIJE_LESSONS.HUB;
}

export function navigateToLekcijeHub() {
  window.location.hash = '#/lekcije';
}

export function navigateToLekcijeLesson(lessonId) {
  window.location.hash = `#/lekcije/${lessonId}`;
}

export function getViewFromHash() {
  const hash = window.location.hash.replace(/^#\/?/, '');
  if (hash === 'o-aplikaciji' || hash === 'uputstvo') return VIEWS.ABOUT;
  if (hash === 'ispit') return VIEWS.EXAM;
  if (hash === 'znakovi' || hash === 'katalog2') return VIEWS.KATALOG2;
  if (hash === 'propisi' || hash === 'katalog1') return VIEWS.KATALOG1;
  if (hash === 'raskrsnice' || hash === 'katalog3') return VIEWS.KATALOG3;
  if (hash.startsWith('lekcije') || hash === 'bitne-brzine') return VIEWS.LEKCIJE;
  return VIEWS.PRACTICE;
}

export function setViewHash(view) {
  if (view === VIEWS.ABOUT) {
    window.location.hash = '#/o-aplikaciji';
    return;
  }
  if (view === VIEWS.EXAM) {
    window.location.hash = '#/ispit';
    return;
  }
  if (view === VIEWS.KATALOG2) {
    window.location.hash = '#/znakovi';
    return;
  }
  if (view === VIEWS.KATALOG1) {
    window.location.hash = '#/propisi';
    return;
  }
  if (view === VIEWS.KATALOG3) {
    window.location.hash = '#/raskrsnice';
    return;
  }
  if (view === VIEWS.LEKCIJE) {
    window.location.hash = '#/lekcije';
    return;
  }
  window.location.hash = '';
}

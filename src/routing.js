export const VIEWS = {
  PRACTICE: 'practice',
  KATALOG1: 'katalog1',
  KATALOG2: 'katalog2',
  KATALOG3: 'katalog3',
  LEKCIJE: 'lekcije',
  ABOUT: 'about',
  EXAM: 'exam',
};

export function getViewFromHash() {
  const hash = window.location.hash.replace(/^#\/?/, '');
  if (hash === 'o-aplikaciji' || hash === 'uputstvo') return VIEWS.ABOUT;
  if (hash === 'ispit') return VIEWS.EXAM;
  if (hash === 'znakovi' || hash === 'katalog2') return VIEWS.KATALOG2;
  if (hash === 'propisi' || hash === 'katalog1') return VIEWS.KATALOG1;
  if (hash === 'raskrsnice' || hash === 'katalog3') return VIEWS.KATALOG3;
  if (hash === 'lekcije' || hash === 'bitne-brzine') return VIEWS.LEKCIJE;
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

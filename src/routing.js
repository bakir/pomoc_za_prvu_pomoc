export const VIEWS = {
  PRACTICE: 'practice',
  ABOUT: 'about',
  EXAM: 'exam',
};

export function getViewFromHash() {
  const hash = window.location.hash.replace(/^#\/?/, '');
  if (hash === 'o-aplikaciji' || hash === 'uputstvo') return VIEWS.ABOUT;
  if (hash === 'ispit') return VIEWS.EXAM;
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
  window.location.hash = '';
}

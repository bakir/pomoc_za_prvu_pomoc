export const VIEWS = {
  PRACTICE: 'practice',
  HELP: 'help',
  EXAM: 'exam',
};

export function getViewFromHash() {
  const hash = window.location.hash.replace(/^#\/?/, '');
  if (hash === 'uputstvo') return VIEWS.HELP;
  if (hash === 'ispit') return VIEWS.EXAM;
  return VIEWS.PRACTICE;
}

export function setViewHash(view) {
  if (view === VIEWS.HELP) {
    window.location.hash = '#/uputstvo';
    return;
  }
  if (view === VIEWS.EXAM) {
    window.location.hash = '#/ispit';
    return;
  }
  window.location.hash = '';
}

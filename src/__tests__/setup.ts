import '@testing-library/jest-dom/vitest';

// happy-dom follows a clicked link and replaces the document, which ends a test
// part way through. Tests check what a click calls, not where it goes.
document.addEventListener('click', event => {
  if (event.target instanceof Element && event.target.closest('a[href]')) {
    event.preventDefault();
  }
});

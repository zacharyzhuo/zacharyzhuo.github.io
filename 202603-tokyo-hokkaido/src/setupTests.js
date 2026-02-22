// jest-dom adds custom jest matchers for asserting on DOM nodes.
// allows you to do things like:
// expect(element).toHaveTextContent(/react/i)
// learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom';

// jsdom 未實作部分 browser API，mock 避免測試報錯
Object.defineProperty(window, 'scrollTo', { value: () => {}, writable: true });
Element.prototype.scrollIntoView = () => {};
Storage.prototype.getItem = jest.fn(() => null);
Storage.prototype.setItem = jest.fn();
window.matchMedia = jest.fn().mockImplementation((query) => ({
  matches: false,
  media: query,
  addListener: () => {},
  removeListener: () => {},
  addEventListener: () => {},
  removeEventListener: () => {},
  dispatchEvent: () => {},
}));
Object.defineProperty(navigator, 'onLine', { value: true, writable: true });

import '@testing-library/jest-dom/vitest';
import { createElement } from 'react';
import { vi } from 'vitest';

const motionElement = (Component = 'div') => ({ children, ...props }) =>
  createElement(Component, props, children);

const motionProxy = new Proxy(motionElement, {
  apply: (_target, _thisArg, args) => motionElement(args[0] || 'div'),
  get: (_target, prop) => {
    if (prop === 'create') return (Component) => motionElement(Component || 'div');
    return motionElement(prop);
  },
});

vi.mock('framer-motion', () => ({
  motion: motionProxy,
  AnimatePresence: ({ children }) => children,
}));

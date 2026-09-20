import { expect, it } from 'vitest';
import { dropIndex } from './handLayout';
it('maps drag distance to the nearest casting position', () => {
  expect(dropIndex(0, 100, 50, 4)).toBe(2);
  expect(dropIndex(3, -100, 50, 4)).toBe(1);
  expect(dropIndex(1, 20, 50, 4)).toBe(1);
});
it('clamps drops at both hand edges, including a full hand', () => {
  expect(dropIndex(2, -1000, 40, 10)).toBe(0);
  expect(dropIndex(0, 1000, 40, 10)).toBe(9);
  expect(dropIndex(0, 200, 40, 1)).toBe(0);
  expect(dropIndex(1, 100, 0, 4)).toBe(1);
});

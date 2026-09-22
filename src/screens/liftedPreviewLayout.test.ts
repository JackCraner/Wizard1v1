import { expect, it } from 'vitest';
import { liftedPreviewLayout, PREVIEW_FINGER_GAP, spellPreviewSize } from './liftedPreviewLayout';

const bounds = { left: 8, top: 8, right: 836, bottom: 382 };
it('keeps a hand preview above the thumb without changing its reading height', () => {
  const preview = liftedPreviewLayout(420, 334, 326, 218, bounds);
  expect(preview.top + 218).toBe(334 - PREVIEW_FINGER_GAP);
  expect(liftedPreviewLayout(600, 334, 326, 218, bounds).top).toBe(preview.top);
});
it('keeps both edges of a wide keyword preview within the safe area', () => {
  for (const x of [-100, 8, 420, 836, 1000]) {
    const preview = liftedPreviewLayout(x, 334, 326, 218, bounds);
    expect(preview.left).toBeGreaterThanOrEqual(bounds.left);
    expect(preview.left + 326).toBeLessThanOrEqual(bounds.right);
    expect(preview.top).toBeGreaterThanOrEqual(bounds.top);
    expect(preview.top + 218).toBeLessThanOrEqual(bounds.bottom);
  }
});
it('moves shop previews to the clear side when there is no room above', () => {
  const leftTouch = liftedPreviewLayout(230, 130, 330, 225, bounds);
  const rightTouch = liftedPreviewLayout(765, 130, 330, 225, bounds);
  expect(leftTouch.top).toBe(bounds.top);
  expect(leftTouch.left).toBeGreaterThan(230 + PREVIEW_FINGER_GAP);
  expect(rightTouch.left + 330).toBeLessThan(765 - PREVIEW_FINGER_GAP);
});

it('fits an S24 Ultra reading panel beside the thumb with safe-area padding', () => {
  const safeArea = { left: 34, top: 10, right: 822, bottom: 360 };
  const size = spellPreviewSize(safeArea);
  expect(size.height).toBe(300);
  for (const x of [60, 240, 420, 580, 800]) {
    const position = liftedPreviewLayout(x, 180, size.width, size.height, safeArea);
    expect(position.left).toBeGreaterThanOrEqual(safeArea.left);
    expect(position.left + size.width).toBeLessThanOrEqual(safeArea.right);
    expect(position.top + size.height).toBeLessThanOrEqual(safeArea.bottom);
    expect(position.left >= x + PREVIEW_FINGER_GAP || position.left + size.width <= x - PREVIEW_FINGER_GAP).toBe(true);
  }
});

it('fits shorter browser windows without scaling down the reading font', () => {
  const safeArea = { left: 10, top: 10, right: 657, bottom: 294 };
  const size = spellPreviewSize(safeArea);
  expect(size.height).toBe(264);
  const position = liftedPreviewLayout(100, 160, size.width, size.height, safeArea);
  expect(position.top + size.height).toBeLessThanOrEqual(safeArea.bottom);
});

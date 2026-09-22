export const PREVIEW_FINGER_GAP = 56;

export type PreviewBounds = { left: number; top: number; right: number; bottom: number };

/** Logical pixels: leave space beside the thumb even in phone landscape. */
export function spellPreviewSize(bounds: PreviewBounds) {
  const availableWidth = bounds.right - bounds.left;
  const availableHeight = bounds.bottom - bounds.top;
  const height = Math.min(300, availableHeight - 20);
  const width = Math.min(440, Math.max(280, availableWidth / 2 - 56), availableWidth);
  return { width, height };
}

/** All positions use the same coordinate space as the containing overlay. */
export function liftedPreviewLayout(x: number, y: number, width: number, height: number,
  bounds: PreviewBounds) {
  const maxLeft = Math.max(bounds.left, bounds.right - width);
  const maxTop = Math.max(bounds.top, bounds.bottom - height);
  let left = Math.max(bounds.left, Math.min(maxLeft, x - width / 2));
  const above = y - PREVIEW_FINGER_GAP - height;
  const top = Math.max(bounds.top, Math.min(maxTop, above));
  // In short landscape windows, use the side furthest from the thumb.
  if (above < bounds.top) left = x < (bounds.left + bounds.right) / 2 ? maxLeft : bounds.left;
  return { left, top };
}

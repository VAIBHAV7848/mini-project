/**
 * Accurately measures the pixel position of the text caret in an HTMLInputElement
 * in screen/viewport coordinates, mirroring styling for sub-pixel accuracy.
 */
export function getCaretCoordinates(
  input: HTMLInputElement,
  selectionIndex?: number
): { x: number; y: number } {
  if (typeof window === 'undefined' || !input) {
    return { x: 0, y: 0 };
  }

  let index = selectionIndex;
  if (index === undefined) {
    try {
      index = input.selectionEnd ?? input.value.length;
    } catch {
      // WHATWG HTML spec: input type="email" throws DOMException on selectionEnd access in some browsers
      index = input.value.length;
    }
  }
  const div = document.createElement('div');
  const span = document.createElement('span');
  const style = window.getComputedStyle(input);

  // Copy essential input font and box model properties
  const propertiesToCopy = [
    'direction',
    'boxSizing',
    'width',
    'height',
    'overflowX',
    'overflowY',
    'borderTopWidth',
    'borderRightWidth',
    'borderBottomWidth',
    'borderLeftWidth',
    'borderStyle',
    'paddingTop',
    'paddingRight',
    'paddingBottom',
    'paddingLeft',
    'fontStyle',
    'fontVariant',
    'fontWeight',
    'fontStretch',
    'fontSize',
    'fontSizeAdjust',
    'lineHeight',
    'fontFamily',
    'textAlign',
    'textTransform',
    'textIndent',
    'textDecoration',
    'letterSpacing',
    'wordSpacing',
    'tabSize',
    'MozTabSize',
  ];

  propertiesToCopy.forEach((prop) => {
    // @ts-expect-error dynamic style assignment
    div.style[prop] = style[prop];
  });

  div.style.position = 'fixed';
  div.style.top = '0px';
  div.style.left = '-9999px';
  div.style.visibility = 'hidden';
  div.style.whiteSpace = 'pre';
  div.style.pointerEvents = 'none';

  div.textContent = input.value.substring(0, index);
  span.textContent = input.value.substring(index) || '.';
  div.appendChild(span);

  document.body.appendChild(div);

  const rect = input.getBoundingClientRect();
  const spanRect = span.getBoundingClientRect();
  const divRect = div.getBoundingClientRect();

  const x = rect.left + (spanRect.left - divRect.left) - input.scrollLeft;
  const y = rect.top + (spanRect.top - divRect.top);

  document.body.removeChild(div);

  return { x, y };
}

import { useLayoutEffect, useState } from 'react';

export const tokenizeNeonText = (text) => {
  let wordIndex = 0;
  return text.split(/(\s+)/).filter(Boolean).map((value) => {
    if (/^\s+$/.test(value)) return { type: 'space', value };
    const token = { type: 'word', value, wordIndex };
    wordIndex += 1;
    return token;
  });
};

export const limitNeonInput = (value, maxWordLength = 30, maxLines = 6) => value
  .replace(/\r/g, '')
  .split('\n')
  .slice(0, maxLines)
  .map((line) => line
    .split(/(\s+)/)
    .map((part) => (/\s/.test(part) ? part : [...part].slice(0, maxWordLength).join('')))
    .join(''))
  .join('\n');

export const estimateNeonDimensions = (text) => {
  const lines = String(text || '').split('\n');
  const estimates = lines.map((line) => {
    const characters = [...line].filter((character) => !/\s/.test(character)).length;
    const spaces = [...line].filter((character) => /\s/.test(character)).length;
    return {
      minLength: (characters * 5) + (spaces * 2),
      maxLength: (characters * 6) + (spaces * 2),
    };
  });

  return {
    minLength: Math.max(0, ...estimates.map((estimate) => estimate.minLength)),
    maxLength: Math.max(0, ...estimates.map((estimate) => estimate.maxLength)),
    minHeight: 10,
    maxHeight: 20,
  };
};

export function useFittedNeonText(containerRef, text, fontFamily, options = {}) {
  const {
    baseSize = 70,
    minSize = 6,
    maxSize = 118,
    widthRatio = 0.78,
    singleLineHeightRatio = 0.2,
    multiLineHeightRatio = 0.7,
  } = options;
  const [fontSize, setFontSize] = useState(baseSize);

  useLayoutEffect(() => {
    const container = containerRef.current;
    if (!container || !text || !fontFamily) return undefined;
    let active = true;

    const fitText = async () => {
      try {
        await document.fonts.load(`${baseSize}px "${fontFamily}"`);
      } catch {
        // Continue with the browser fallback while a custom font is loading.
      }
      if (!active) return;

      const lines = text.split('\n');
      const probe = document.createElement('span');
      Object.assign(probe.style, {
        position: 'fixed', left: '-9999px', top: '0', visibility: 'hidden',
        whiteSpace: 'nowrap', fontFamily, fontSize: `${baseSize}px`, lineHeight: '1',
      });
      document.body.appendChild(probe);

      let widestLine = 1;
      let lineHeight = 1;
      lines.forEach((line) => {
        probe.textContent = line || ' ';
        const range = document.createRange();
        range.selectNodeContents(probe);
        const box = range.getBoundingClientRect();
        widestLine = Math.max(widestLine, box.width);
        lineHeight = Math.max(lineHeight, box.height);
      });
      probe.remove();

      const targetWidth = container.clientWidth * widthRatio;
      const targetHeight = container.clientHeight * (lines.length > 1 ? multiLineHeightRatio : singleLineHeightRatio);
      const fitted = baseSize * Math.min(targetWidth / widestLine, targetHeight / (lineHeight * lines.length));
      setFontSize(Math.max(minSize, Math.min(maxSize, fitted)));
    };

    fitText();
    const observer = new ResizeObserver(fitText);
    observer.observe(container);
    return () => {
      active = false;
      observer.disconnect();
    };
  }, [baseSize, containerRef, fontFamily, maxSize, minSize, multiLineHeightRatio, singleLineHeightRatio, text, widthRatio]);

  return fontSize;
}

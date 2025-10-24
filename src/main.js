import './style.css';

const DEFAULT_TEXT = `Memorize your favourite passages by revealing them as you scroll. Paste or type any text below and use the scrollable panel to control how much of the text is visible. This simple tool keeps the rest hidden so you can test your memory.`;

const MIN_SCROLL_LENGTH = 400;
const MAX_SCROLL_LENGTH = 6000;
const WORD_SCROLL_RATIO = 12;

const textInput = document.getElementById('text-input');
const previewText = document.getElementById('preview-text');
const statsElement = document.getElementById('stats');
const scrollLengthRange = document.getElementById('scroll-length-range');
const scrollLengthNumber = document.getElementById('scroll-length-number');
const resetButton = document.getElementById('reset-scroll-length');
const scrollSpace = document.getElementById('scroll-space');

let tokens = [];
let totalWords = 0;
let visibleWords = 0;
let scrollLength = MIN_SCROLL_LENGTH;
let isCustomScrollLength = false;
let scrollScheduled = false;

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function computeScrollLength(wordCount) {
  const estimated = wordCount * WORD_SCROLL_RATIO;
  return clamp(estimated, MIN_SCROLL_LENGTH, MAX_SCROLL_LENGTH);
}

function buildTokens(text) {
  if (!text) {
    return [];
  }

  const rawTokens = text.match(/\S+|\s+/g) ?? [];
  let wordCounter = 0;

  return rawTokens.map((token) => {
    const isWord = /\S/.test(token);
    const wordIndex = isWord ? wordCounter : Math.max(wordCounter - 1, 0);
    if (isWord) {
      wordCounter += 1;
    }
    return {
      text: token,
      isWord,
      wordIndex,
    };
  });
}

function updateTokenVisibility() {
  tokens.forEach((token) => {
    const shouldShow = !token.isWord || token.wordIndex < visibleWords;
    token.element.className = shouldShow ? 'word word--visible' : 'word word--hidden';
  });
}

function updateStats() {
  statsElement.textContent = `Visible words: ${visibleWords} / ${totalWords}`;
}

function setVisibleWords(value) {
  const clamped = clamp(value, 0, totalWords);
  visibleWords = clamped;
  updateTokenVisibility();
  updateStats();
}

function updateVisibleWordsFromScroll() {
  if (totalWords === 0) {
    setVisibleWords(0);
    return;
  }

  const doc = document.documentElement;
  const viewportHeight = window.innerHeight || doc.clientHeight;
  const totalScrollableHeight = doc.scrollHeight;
  const scrollable = totalScrollableHeight - viewportHeight;

  if (scrollable <= 0) {
    setVisibleWords(totalWords);
    return;
  }

  const baseline = Math.min(1, viewportHeight / totalScrollableHeight);
  const rawProgress = scrollable > 0 ? window.scrollY / scrollable : 1;
  const progress = Math.min(1, Math.max(rawProgress, baseline));
  const visible = Math.ceil(progress * totalWords);
  setVisibleWords(clamp(visible, 0, totalWords));
}

function scheduleScrollUpdate() {
  if (scrollScheduled) {
    return;
  }
  scrollScheduled = true;
  requestAnimationFrame(() => {
    scrollScheduled = false;
    updateVisibleWordsFromScroll();
  });
}

function setScrollLength(value, options = {}) {
  const { markCustom = true } = options;
  if (!Number.isFinite(value)) {
    return;
  }
  const rounded = Math.round(value);
  const clamped = clamp(rounded, MIN_SCROLL_LENGTH, MAX_SCROLL_LENGTH);
  scrollLength = clamped;
  scrollLengthRange.value = String(clamped);
  scrollLengthNumber.value = String(clamped);
  scrollSpace.style.height = `${clamped}px`;

  if (markCustom) {
    isCustomScrollLength = true;
  } else {
    isCustomScrollLength = false;
  }
  resetButton.disabled = !isCustomScrollLength;
  scheduleScrollUpdate();
}

function rebuildPreview(newTokens) {
  previewText.textContent = '';
  tokens = newTokens.map((token) => {
    const span = document.createElement('span');
    span.textContent = token.text;
    span.className = 'word word--visible';
    previewText.appendChild(span);
    return { ...token, element: span };
  });
}

function refreshTextContent(text) {
  const builtTokens = buildTokens(text);
  totalWords = builtTokens.reduce((count, token) => (token.isWord ? count + 1 : count), 0);
  rebuildPreview(builtTokens);
  visibleWords = totalWords;
  updateTokenVisibility();
  updateStats();

  window.scrollTo({ top: 0, behavior: 'auto' });
  if (!isCustomScrollLength) {
    setScrollLength(computeScrollLength(totalWords), { markCustom: false });
  } else {
    scheduleScrollUpdate();
  }
}

textInput.addEventListener('input', (event) => {
  refreshTextContent(event.target.value);
});

scrollLengthRange.addEventListener('input', (event) => {
  setScrollLength(Number(event.target.value));
});

scrollLengthNumber.addEventListener('input', (event) => {
  if (event.target.value === '') {
    return;
  }
  setScrollLength(Number(event.target.value));
});

scrollLengthNumber.addEventListener('blur', () => {
  if (scrollLengthNumber.value === '') {
    scrollLengthNumber.value = String(scrollLength);
  }
});

resetButton.addEventListener('click', () => {
  setScrollLength(computeScrollLength(totalWords), { markCustom: false });
});

window.addEventListener('scroll', () => {
  scheduleScrollUpdate();
}, { passive: true });

textInput.value = DEFAULT_TEXT;
resetButton.disabled = true;
refreshTextContent(DEFAULT_TEXT);

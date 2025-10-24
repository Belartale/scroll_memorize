import { useCallback, useEffect, useMemo, useState } from 'react';
import './App.css';

const DEFAULT_TEXT = `Memorize your favourite passages by revealing them as you scroll. Paste or type any text below and use the
 scrollable panel to control how much of the text is visible. This simple tool keeps the rest hidden so you can test your memory
.`;

const MIN_SCROLL_LENGTH = 400;
const MAX_SCROLL_LENGTH = 6000;
const WORD_SCROLL_RATIO = 12;

function computeScrollLength(wordCount) {
  const estimated = wordCount * WORD_SCROLL_RATIO;
  return Math.max(MIN_SCROLL_LENGTH, Math.min(MAX_SCROLL_LENGTH, estimated));
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

function App() {
  const [text, setText] = useState(DEFAULT_TEXT);
  const tokens = useMemo(() => buildTokens(text), [text]);
  const totalWords = useMemo(
    () => tokens.reduce((count, token) => (token.isWord ? count + 1 : count), 0),
    [tokens],
  );
  const [visibleWords, setVisibleWords] = useState(totalWords);
  const [isCustomScrollLength, setIsCustomScrollLength] = useState(false);
  const [scrollLength, setScrollLength] = useState(() => computeScrollLength(totalWords));

  const updateVisibleWords = useCallback(() => {
    if (typeof window === 'undefined' || typeof document === 'undefined' || !document.documentElement) {
      return;
    }

    if (totalWords === 0) {
      setVisibleWords(totalWords);
      return;
    }

    const totalScrollableHeight = document.documentElement.scrollHeight;
    const viewportHeight = window.innerHeight;
    const scrollable = totalScrollableHeight - viewportHeight;

    if (scrollable <= 0) {
      setVisibleWords(totalWords);
      return;
    }

    const baseline = Math.min(1, viewportHeight / totalScrollableHeight);
    const rawProgress = scrollable > 0 ? window.scrollY / scrollable : 1;
    const progress = Math.min(1, Math.max(rawProgress, baseline));
    const visible = Math.ceil(progress * totalWords);
    setVisibleWords(Math.min(Math.max(visible, 0), totalWords));
  }, [totalWords]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return undefined;
    }

    window.addEventListener('scroll', updateVisibleWords, { passive: true });
    updateVisibleWords();

    return () => {
      window.removeEventListener('scroll', updateVisibleWords);
    };
  }, [updateVisibleWords]);

  useEffect(() => {
    if (!isCustomScrollLength) {
      setScrollLength(computeScrollLength(totalWords));
    }
  }, [totalWords, isCustomScrollLength]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    window.scrollTo({ top: 0, behavior: 'auto' });
    requestAnimationFrame(updateVisibleWords);
  }, [text, updateVisibleWords]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    requestAnimationFrame(updateVisibleWords);
  }, [scrollLength, updateVisibleWords]);

  useEffect(() => {
    setVisibleWords((prev) => (prev > totalWords ? totalWords : prev));
  }, [totalWords]);

  const handleScrollLengthChange = (value) => {
    setIsCustomScrollLength(true);
    setScrollLength(value);
  };

  const handleResetScrollLength = () => {
    setIsCustomScrollLength(false);
    setScrollLength(computeScrollLength(totalWords));
    if (typeof window !== 'undefined') {
      requestAnimationFrame(updateVisibleWords);
    }
  };

  return (
    <div className="app">
      <header className="app__header">
        <h1>Scroll Memorize</h1>
        <p>
          Paste text into the editor and scroll the preview panel. The amount of text you have scrolled
          through remains visible while the rest stays hidden.
        </p>
      </header>

      <main className="app__content">
        <section className="app__input">
          <label htmlFor="text-input" className="app__label">
            Text to memorize
          </label>
          <textarea
            id="text-input"
            className="app__textarea"
            value={text}
            onChange={(event) => setText(event.target.value)}
            placeholder="Paste or type your text here..."
            rows={10}
          />

          <div className="app__controls">
            <label htmlFor="scroll-length" className="app__label app__label--small">
              Scroll length (px)
            </label>
            <div className="app__range">
              <input
                id="scroll-length"
                type="range"
                min={MIN_SCROLL_LENGTH}
                max={MAX_SCROLL_LENGTH}
                step={20}
                value={scrollLength}
                onChange={(event) => handleScrollLengthChange(Number(event.target.value))}
              />
              <input
                className="app__numberInput"
                type="number"
                min={MIN_SCROLL_LENGTH}
                max={MAX_SCROLL_LENGTH}
                value={scrollLength}
                onChange={(event) =>
                  handleScrollLengthChange(
                    Math.min(
                      MAX_SCROLL_LENGTH,
                      Math.max(MIN_SCROLL_LENGTH, Number(event.target.value) || MIN_SCROLL_LENGTH),
                    ),
                  )
                }
              />
            </div>
            <button
              type="button"
              className="app__resetButton"
              onClick={handleResetScrollLength}
              disabled={!isCustomScrollLength}
            >
              Use automatic length
            </button>
            <p className="app__helper">
              Scroll down the page to reveal more of the text. Reach the bottom of the page to show every word.
            </p>
          </div>
        </section>

        <section className="app__preview">
          <h2>Scroll to reveal</h2>
          <div className="app__previewBox">
            <p className="app__text">
              {tokens.map((token, index) => {
                const shouldShow = !token.isWord || token.wordIndex < visibleWords;
                return (
                  <span
                    key={`${token.wordIndex}-${index}`}
                    className={shouldShow ? 'word word--visible' : 'word word--hidden'}
                  >
                    {token.text}
                  </span>
                );
              })}
            </p>
          </div>
          <div className="app__stats">
            <span>
              Visible words: {visibleWords} / {totalWords}
            </span>
          </div>
        </section>
      </main>
      <div className="app__scrollSpace" style={{ height: `${scrollLength}px` }} aria-hidden="true" />
    </div>
  );
}

export default App;

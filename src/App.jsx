import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import './App.css';

const DEFAULT_TEXT = `Memorize your favourite passages by revealing them as you scroll. Paste or type any text below and use the scrollable panel to control how much of the text is visible. This simple tool keeps the rest hidden so you can test your memory.`;

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
  const containerRef = useRef(null);
  const tokens = useMemo(() => buildTokens(text), [text]);
  const totalWords = useMemo(
    () => tokens.reduce((count, token) => (token.isWord ? count + 1 : count), 0),
    [tokens],
  );
  const [visibleWords, setVisibleWords] = useState(totalWords);

  const updateVisibleWords = useCallback(() => {
    const element = containerRef.current;

    if (!element || totalWords === 0) {
      setVisibleWords(totalWords);
      return;
    }

    const { scrollTop, scrollHeight, clientHeight } = element;

    if (scrollHeight === 0) {
      setVisibleWords(totalWords);
      return;
    }

    const progress = Math.min(1, (scrollTop + clientHeight) / scrollHeight);
    const adjustedProgress = clientHeight >= scrollHeight ? 1 : Math.max(progress, clientHeight / scrollHeight);
    const visible = Math.ceil(adjustedProgress * totalWords);
    const clamped = Math.min(Math.max(visible, 0), totalWords);
    setVisibleWords(clamped);
  }, [totalWords]);

  useEffect(() => {
    const element = containerRef.current;
    if (!element) {
      return undefined;
    }

    updateVisibleWords();
    element.addEventListener('scroll', updateVisibleWords);

    return () => {
      element.removeEventListener('scroll', updateVisibleWords);
    };
  }, [updateVisibleWords, text]);

  useEffect(() => {
    const element = containerRef.current;
    if (!element) {
      return;
    }

    element.scrollTop = 0;
    requestAnimationFrame(updateVisibleWords);
  }, [text, updateVisibleWords]);

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
        </section>

        <section className="app__preview">
          <h2>Scroll to reveal</h2>
          <div ref={containerRef} className="app__previewBox">
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
    </div>
  );
}

export default App;

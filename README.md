# Scroll Memorize

A single-page tool that helps you memorize passages by revealing text as you scroll down the page. Paste any text into the editor, adjust the virtual scroll length, and move down the page to expose more of the passage while keeping the rest hidden.

## Usage

Install the dependencies and start the Vite dev server:

```bash
npm install
npm run dev
```

Run a production build. The deployable assets are written to the `build/` folder.

```bash
npm run build
```

* Use the textarea to enter the content you want to memorize.
* Drag the range slider or type into the number field to control the scroll length. Select **Use automatic length** to return to the recommended value.
* Scroll down the page to gradually reveal the passage. The counter below the preview shows how many words are currently visible.

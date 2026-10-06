# FFXIV TTRPG Quick Reference

A lightweight, responsive quick-reference site for the FFXIV TTRPG.

## Project structure

```text
.
├── index.html
├── style.css
├── quickref.js
├── rules.json
├── assets/
├── tools/
│   └── run-local-server.py
├── .nojekyll
└── .gitignore
```

### Content

`rules.json` contains the page content and is loaded separately by `quickref.js`.

### Assets

All asset filenames use lowercase to keep references compatible with case-sensitive hosting such as GitHub Pages.

## GitHub Pages

Push the contents of this folder to a GitHub repository and publish the repository through GitHub Pages. The site entry point is `index.html`.

`rules.json` must remain next to `index.html` because it is loaded with a relative `fetch("./rules.json")`.

## Local testing

Do not open `index.html` directly with `file://`; the browser blocks the JSON request in that setup.

From the repository root, run:

```bash
python tools/run-local-server.py
```

The helper starts on `127.0.0.1:8000` and automatically tries higher ports if needed.

## Themes

The Light/Dark switch is user-selectable and stored locally in the browser.

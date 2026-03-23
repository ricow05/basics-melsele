# Art Portfolio (Standalone)

This is a separate React + Vite portfolio project intended for GitHub Pages.

## Run locally

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
npm run preview
```

## Deploy to GitHub Pages

1. Create a new GitHub repository for this `portfolio` folder.
2. Push this folder contents to that repository root.
3. Run:

```bash
npm install
npm run deploy
```

4. In GitHub repo settings:
- Go to `Settings -> Pages`
- Set source to branch `gh-pages` and folder `/ (root)`.

Your site will publish from the generated `dist` build.

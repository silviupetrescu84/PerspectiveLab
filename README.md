# Perspective Lab

Perspective Lab is an open-source reflection tool with 100 everyday situations across ten categories. Search or filter the library, choose a situation, then compare common first thoughts with other plausible interpretations. You can also write about a situation of your own and explore it with guided questions.

## Run locally

Use Node.js 20.19+ on the 20.x line, or Node.js 22.12+.

```sh
npm ci
npm run dev
```

`npm run build` writes the static website to `dist/`. Serve that directory with any static host, or run `npm run preview` to inspect it locally. Hash-based links work without server routing rules. Bookmarks, resume positions, search text, and the custom situation draft are stored in browser `localStorage`.

## Test

```sh
npm test
```

The unit suite checks all 100 catalog entries, search and category filters, exploration steps, deep links, and local storage.

## Source layout

- `src/assets/situations.json` contains the catalog. Add a unique `id`, a declared `category`, the situation text, and both interpretation lists for each new entry.
- `src/features/` contains the home, explorer, and saved views and their styles.
- `src/components/` contains the shared UI. `src/lib/` handles catalog indexing, navigation, and preferences.

## License

The project uses the [MIT License](LICENSE). The [third-party notices](public/third-party-notices.txt) cover Manrope, Instrument Serif, and the bundled Phosphor Icons subset.

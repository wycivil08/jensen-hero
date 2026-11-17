# Deployment

`npm test` builds a complete static site into `dist/`; Python 3.9+ and Node 18+ suffice. All runtime JS/WASM and media are local. Serve HTTP rather than opening `file://`, so WebAssembly and paths load correctly. Use `application/wasm` for `.wasm` on custom hosts.

## GitHub Pages

The public repository is `wycivil08/jensen-hero` (renamed from `runeforge-public`, retaining its history). Settings → Pages uses **GitHub Actions**. `.github/workflows/pages.yml` runs tests and uploads only `dist/`, then deploys after a push to `main`; manual dispatch is also available. No token secret is needed: the workflow uses scoped `GITHUB_TOKEN` permissions. Publishing is intentional, not a side effect of a local commit.

Expected URL: `https://wycivil08.github.io/jensen-hero/`, with `art/`, `combat/`, `game/`, `warrior/`. The old Git repository URL redirects; the old Pages project URL does not have that guarantee. Do not recreate a repository under the previous name just to add a redirect.

## Vercel / other static hosts

Import this repository or deploy `dist/`. `vercel.json` specifies Python build and `dist` output; no install command or environment secrets are required. Do not enable a second automatic production integration unintentionally. Current short review host is `https://jensen-3d.vercel.app`; `/cozy/` remains a redirect to canonical `/combat/` in this package. A static upload should include every dist file and retain relative paths.

For a local check: `npm run build`, then `npm run preview`. Inspect all three entries, historical art, story-image loading and warrior audio requests. For a clean environment, clone the repository elsewhere and run `npm test`; no local archive should be needed.

## Rollback and saves

Use a reviewed revert commit on `main` to rebuild the prior source, or select a previously verified hosting deployment. Do not force push or rewrite ancestry. A rename does not shrink the historical Git object database; the current tree is the curated result. Browser saves are origin-scoped; moving from github.io to vercel.app does not transfer them. Existing key `jensen_r7_career_v1` and schema are preserved; there is no server-side migration.

References: [GitHub repository renaming](https://docs.github.com/en/repositories/creating-and-managing-repositories/renaming-a-repository), [custom Pages workflows](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages).

# Portfolio

0xEr3b0s's personal portfolio — a terminal-styled, GitHub-centered site: black
background, monospace, no gradients, no frameworks fighting the aesthetic.
Built with [Astro](https://astro.build) as a fully static site (no server, no
database) so it can be hosted for free and stays fast by default.

The content is data-driven: every project on the site is a Markdown file with
structured frontmatter (see [Adding a project](#adding-a-project)), so adding,
reordering, or archiving one never touches page code.

## Stack

- **[Astro](https://astro.build)** (static output) + **TypeScript** (strict).
- **Content Collections** (`astro:content`, glob loader) with a **Zod** schema
  for validation — a malformed project file fails `astro check` / `astro build`
  instead of silently rendering wrong.
- **Plain CSS** (`src/styles/terminal.css`) — the whole visual system lives in
  one file via custom properties (`:root { --background, --foreground, ... }`).
  No CSS framework, no client-side JS beyond what Astro needs for nothing (this
  site ships essentially zero JS).

## Structure

```text
src/
├── components/          Header, Footer, ProjectEntry
├── content/projects/    one Markdown file per project (the actual content)
├── content.config.ts    the projects collection schema (Zod)
├── data/site.ts         global config: identity, GitHub link, profile copy —
│                        the single source of truth for text repeated across pages
├── layouts/             TerminalLayout.astro (SEO tags, header/footer wrap)
├── pages/                index, projects/, projects/[id], about, 404
└── styles/terminal.css   the whole visual system (CSS custom properties)
```

## Commands

| Purpose | Command | Notes |
| --- | --- | --- |
| Install | `npm install` | requires Node ≥22.12 |
| Dev server | `npm run dev` | serves `localhost:4321` with hot reload |
| Type check | `npx astro check` | validates content frontmatter against the Zod schema too |
| Build | `npm run build` | outputs the static site to `dist/` |
| Preview build | `npm run preview` | serves the production build from `dist/` locally |

There is no test suite and no linter configured — this is a static content
site; correctness is `astro check` (types + content schema) and `astro build`
(every route actually generates) passing.

## Adding a project

1. Create `src/content/projects/<slug>.md`. The filename becomes the URL slug
   (`/projects/<slug>`).
2. Fill in the frontmatter — see any existing file for the shape, enforced by
   the schema in `src/content.config.ts`:
   - `title`, `description`, `status` (`active` | `maintained` | `experimental`
     | `completed` | `archived`), `year`, `featured`, `order`, `technologies`.
   - `github` — leave `""` if the repo isn't public yet; the page shows
     `[private / on request]` instead of a broken link.
   - Optional: `demo`, `documentation`, `problem`, `solution`.
3. Write the body in Markdown — this becomes the project's full write-up.
4. `npm run build` to confirm it compiles, then commit.

`order` is a deliberate ranking (interdependent projects grouped and kept in
their real appearance order, groups ranked by relevance) — not chronological
or alphabetical. Keep that in mind when inserting a new project rather than
just appending it at the end. `featured: true` projects also appear on the
homepage, in `order`.

## Deployment — GitHub Pages (free)

This site is 100% static, so GitHub Pages hosts it for free with no separate
account needed beyond GitHub itself. Two things decide the URL shape:

- **Repo named `<your-username>.github.io`** → the site is served at the
  root: `https://<your-username>.github.io`. No extra config needed.
- **Repo with any other name** (e.g. `portfolio`) → the site is served at
  `https://<your-username>.github.io/<repo-name>`. Astro needs to know that
  path prefix or every internal link and asset will 404.

### 1. Push the repo to GitHub

```sh
git remote add origin https://github.com/<your-username>/<repo-name>.git
git branch -M main
git push -u origin main
```

(`gh repo create <repo-name> --public --source=. --push` does the same in one
step if you use the GitHub CLI.)

### 2. If the repo is *not* `<username>.github.io`, set `base`

In `astro.config.mjs`:

```js
// @ts-check
import { defineConfig } from 'astro/config';

export default defineConfig({
	site: 'https://<your-username>.github.io',
	base: '/<repo-name>', // omit entirely if the repo IS <username>.github.io
});
```

Setting `site` (regardless of which case you're in) also turns the canonical
URL and Open Graph tags in `TerminalLayout.astro` back on — they're currently
skipped because no production domain is configured yet.

### 3. Add the deploy workflow

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [main]
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: pages
  cancel-in-progress: true

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: withastro/action@v3
  deploy:
    needs: build
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - id: deployment
        uses: actions/deploy-pages@v4
```

`withastro/action` installs dependencies, runs `astro check` + `astro build`,
and uploads `dist/` as the Pages artifact in one step.

### 4. Turn on Pages

In the GitHub repo: **Settings → Pages → Build and deployment → Source →
GitHub Actions**. Push to `main` (or re-run the workflow) and the site goes
live at the URL from step 2 a couple of minutes later — GitHub shows the exact
URL and deploy status on the same Settings → Pages screen.

### Custom domain later (optional)

Settings → Pages → Custom domain, then point the domain's DNS at GitHub Pages
(`ALIAS`/`ANAME` or `A` records to GitHub's IPs for an apex domain, `CNAME` for
a subdomain — GitHub's UI shows the exact records once you type the domain).
Update `site` in `astro.config.mjs` to the new domain and drop `base`.

### Other free static hosts

If GitHub Pages ever feels limiting (e.g. you want image optimisation, edge
functions, or SSR later), this same repo deploys to
[Cloudflare Pages](https://pages.cloudflare.com/), [Netlify](https://netlify.com),
or [Vercel](https://vercel.com) with no code changes — connect the GitHub repo
in any of their dashboards, build command `npm run build`, output directory
`dist`. All three have a free tier and none need the `base` path GitHub Pages
project sites require.

## Before deploying — checklist

- [ ] Set `site` (and `base` if applicable) in `astro.config.mjs`.
- [ ] Re-check that every project's `github` field still resolves — repo
      visibility can change (`gh repo list <username>` to check).
- [ ] `npm run build` locally once more; commit `package-lock.json` if it changed.

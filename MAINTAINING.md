# Maintaining the portfolio

An Astro site. Content is Markdown, styling is one CSS file, structure lives in a few
small files. You edit content without touching code.

Run it:

```
npm install      # once
npm run dev      # preview at localhost while editing
npm run build    # check everything compiles before pushing
```

## Add a project

1. Copy `PROJECT_TEMPLATE.md` (repo root) to `src/content/projects/<slug>.md`.
2. The file name is the URL: `my-tool.md` -> `/projects/my-tool`.
3. Fill the fields, delete the comment lines, write the description below the `---`.
4. `npm run build` to confirm it compiles.

Nothing else to wire: the project appears in its category section, in the filter bar,
and (if `featured`) on the home page, automatically.

## Project fields

Set in the `---` front-matter block at the top of each `.md`.

| Field | What it controls |
| --- | --- |
| `title` | Card title |
| `description` | One-line summary under the title |
| `status` | Colour tag: `active` `planned` `maintained` `experimental` `completed` `archived` |
| `year` | A number |
| `category` | Which section it lands in: `offensive` `network` `systems` `kernel` `infra` |
| `featured` | `true` also shows it on the home page |
| `order` | Lower number = higher in the list |
| `technologies` | Tags under the title, and the values in the filter bar |
| `github` | Full URL. Leave `""` to show `[private / on request]` instead of a link |

`problem` and `solution` are optional and show only on the project's own page.

## Edit or remove a project

- Edit: change the `.md` file.
- Remove: delete the `.md` file.
- Reorder: change `order` numbers. Gaps are fine; only the relative order matters.

## Change the sections

Sections on `/projects` come from `categories` in `src/data/site.ts`, in that order.
To rename, reorder or add one, edit that list, then set the matching `category` on
each project. An `id` there must also exist in the `category` enum in
`src/content.config.ts`.

## The projects page features

- **Status legend** lists only the statuses actually in use. Colours come from the
  `.status-<name>` rules in `src/styles/terminal.css`.
- **Filter bar** (`grep`) is built from every `technologies` value. Click a tag to
  filter, `all` to reset. No config.
- **4-per-row grid** applies on wide screens on `/projects` only. The home page stays
  at two columns.

## Project page (man style)

Each `/projects/<slug>` page is laid out like a Unix `man` page: an ASCII-art
banner of the title, then NAME, SYNOPSIS, DESCRIPTION, STACK, SEE ALSO.

- The banner is generated at build from the title by the `figlet` package (a
  dependency), in the `Classy` font. New projects get one automatically.
- Change the font: edit `font: 'Classy'` in `src/pages/projects/[id].astro`. Run
  `npx figlet-cli -f <Name> "sample"` to preview a font first.
- Change the banner size: edit `.man-banner { font-size: ... }` in
  `src/styles/terminal.css`. It is kept small on purpose; long titles scroll
  sideways rather than wrap.

## Home page

The top of the home page shows a two-line MOTD, like an SSH login banner. The
`last login` value is each visitor's own previous visit, stored per browser
(`localStorage` key `lastVisit`); the first visit shows `first login`. Edit the
lines in `src/pages/index.astro`.

## CRT effect

A scanline overlay and a blinking cursor, on by default, toggled by the `[crt]`
button in the header. The choice is remembered per browser (`localStorage` key
`crt`).

To remove it entirely, delete these three pieces:

- the `html.crt ...` block in `src/styles/terminal.css`,
- the `<button id="crt-toggle">` and its `<script>` in `src/components/Header.astro`,
- the pre-paint `<script>` in `src/layouts/TerminalLayout.astro`.

## Where things live

```
src/content/projects/   one .md per project      <- most edits happen here
src/data/site.ts        name, bio, nav, categories, status legend
src/pages/              home (index), /projects, /about, 404
src/components/          Header, Footer, ProjectEntry (the card)
src/layouts/            TerminalLayout (page shell, <head>, wide flag)
src/styles/terminal.css the whole theme
PROJECT_TEMPLATE.md     copy this to add a project
```

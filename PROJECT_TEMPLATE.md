# How to add a project

1. Copy this file's front-matter block (everything between the two `---` lines
   below) into a new file: `src/content/projects/<slug>.md`
   Example: `src/content/projects/my-new-tool.md`
2. The file name (without `.md`) becomes the URL: `/projects/<slug>`.
3. Fill in the fields, delete the `#` comment lines you don't need, then write the
   project story in Markdown below the closing `---`.
4. Run `npm run dev` to preview, or `npm run build` to check it compiles.

One file feeds two views automatically, from the same fields. You never edit their
templates:

| View | Template (do not edit) | What it shows |
| --- | --- | --- |
| Card on `/projects` | `src/components/ProjectEntry.astro` | title, status, year, technologies, description, links |
| Detail / man page `/projects/<slug>` | `src/pages/projects/[id].astro` | ASCII title banner, NAME, SYNOPSIS, DESCRIPTION (problem, solution, then the Markdown below), STACK, SEE ALSO |

This file itself lives at the repo root and is NOT published — it sits outside
`src/content/projects/`, so Astro never builds it. Only files inside that folder
become pages.

---
title: "project_name"                 # shown as the card title
description: "One sentence describing what it is and what it does."
status: "planned"                      # active | planned | maintained | experimental | completed | archived
year: 2026                             # a number, not a string
category: "offensive"                  # offensive | network | systems | kernel | infra — the section it lands in on /projects
featured: false                        # true = also shown on the home page
order: 99                              # lower number = higher in the list
technologies:                          # free-form tags, shown under the title
  - C
  - Networking
github: ""                             # full URL; leave "" to show "[private / on request]"
demo: ""                               # optional live-demo URL
documentation: ""                      # optional docs URL
# problem and solution are optional; they show on the /projects/<slug> detail page
problem: >
  What gap or question the project addresses. Delete this block if unused.
solution: >
  How the project answers it. Delete this block if unused.
---

Write the full description here in Markdown: what it does, current state, why it
matters. Use `##` headings, lists and tables — see the existing projects in
`src/content/projects/` for the house style.

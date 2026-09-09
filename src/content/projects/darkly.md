---
title: "Darkly"
description: "A web-application security exercise — finding and exploiting the common flaws behind a deliberately vulnerable site."
status: "planned"
year: 2026
category: "offensive"
featured: false
order: 5
technologies:
  - Web
  - OWASP
  - PHP
  - SQL
---

The entry point into web offensive security: a deliberately vulnerable web
application whose flaws have to be found by reading, probing and exploiting the
running site rather than reasoning from source alone.

## What it covers

A spread across the common web vulnerability classes rather than a single trick:

- **Injection** — SQL injection to read or bypass the database layer.
- **Cross-site scripting** — stored and reflected XSS.
- **Broken access control** — forced browsing, missing authorisation checks, and
  predictable identifiers.
- **Path traversal and local file inclusion** — reaching files outside the intended
  scope.
- **Weak cryptography and secrets** — reversible hashes, exposed keys, guessable
  tokens.
- **CSRF and unsafe redirects.**

Each flaw is a small lesson in how a web application actually fails in production,
and in the OWASP-style methodology used to find them.

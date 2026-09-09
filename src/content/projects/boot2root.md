---
title: "boot2root"
description: "A full CTF-style compromise — from an initial foothold on a machine through privilege escalation all the way to root."
status: "planned"
year: 2026
category: "offensive"
featured: false
order: 6
technologies:
  - Linux
  - Pentest
  - Privilege Escalation
---

A machine built around a complete attack path: a chain of vulnerabilities that has
to be walked end to end, from the first foothold to full root, rather than a single
isolated bug.

## What it covers

- **Reconnaissance** — mapping the exposed surface, services and versions.
- **Initial access** — turning a web, service or configuration flaw into code
  execution on the target.
- **Lateral movement** — pivoting between users and services as new credentials and
  paths open up.
- **Privilege escalation** — abusing SUID binaries, misconfigured permissions, weak
  sudo rules, cron jobs and kernel or service flaws to reach root.

The point is the whole chain: no single step is enough, and each one has to be
turned into the foothold for the next.

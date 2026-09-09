---
title: "Famine"
description: "A self-replicating ELF virus written in x86-64 assembly — infecting binaries in target directories while keeping them runnable."
status: "planned"
year: 2026
category: "offensive"
featured: false
order: 7
technologies:
  - Assembly
  - x86-64
  - ELF
  - Linux
---

A hands-on study of how malicious code propagates at the binary level: a
self-replicating virus, written directly in x86-64 assembly, that infects ELF
executables found in target directories.

## What it covers

- **ELF internals** — parsing program headers and segments to find room for injected
  code without breaking the host.
- **Code injection** — inserting the viral payload (PT_NOTE-to-PT_LOAD style
  infection or a code cave) and redirecting the entry point.
- **Preserving the host** — the infected binary still runs its original behaviour, so
  infection stays invisible to a casual user.
- **Self-replication** — the payload carries a full copy of itself and reproduces on
  each run, marking already-infected files to avoid double infection.

The first step in a series on binary-level malware, and the groundwork for the
stealth techniques that come after it.

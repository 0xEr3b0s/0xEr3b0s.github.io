---
title: "Pestilence"
description: "The stealth sequel to Famine — an ELF virus hardened with anti-debugging, anti-analysis and payload obfuscation."
status: "planned"
year: 2026
category: "offensive"
featured: false
order: 8
technologies:
  - Assembly
  - x86-64
  - ELF
  - Anti-Analysis
---

The successor to [Famine](/projects/famine): the same ELF-infection core, rebuilt to
resist the analyst rather than just an unaware user. Where Famine reproduces,
Pestilence reproduces *quietly*.

## What it adds

- **Anti-debugging** — `ptrace`-based self-protection and debugger detection so the
  virus refuses to run, or misbehaves, under a debugger.
- **Anti-analysis** — timing checks and environment detection to spot sandboxes and
  instrumented hosts.
- **Obfuscation** — encrypted or self-modifying payload so the code on disk does not
  reveal what it does statically.
- **Quieter infection** — tightening the injection so it leaves fewer artefacts for
  static and dynamic tooling to catch.

This is the project about evasion: understanding the analyst's tools well enough to
build code that frustrates them, which is exactly the knowledge a defender needs to
detect the same tricks.

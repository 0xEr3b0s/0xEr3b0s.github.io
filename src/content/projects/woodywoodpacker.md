---
title: "WoodyWoodpacker"
description: "An ELF packer — encrypting a binary's code and prepending a stub that decrypts and runs it at load time."
status: "planned"
year: 2026
category: "offensive"
featured: false
order: 9
github: "https://github.com/0xEr3b0s/woody_woodpacker"
technologies:
  - Assembly
  - x86-64
  - ELF
  - Cryptography
---

A packer for ELF executables: it takes a working binary, encrypts its code, and
wraps it in a small assembly stub that decrypts the original in memory and hands
control back to it at runtime.

## What it covers

- **ELF rewriting** — adding a new executable segment and relocating the entry point
  to the unpacking stub.
- **Payload encryption** — encrypting the original code section so the packed binary
  reveals nothing useful to static analysis.
- **In-memory unpacking** — a position-independent stub in x86-64 assembly that
  restores the original bytes at load time and jumps to the real entry point.

The same ELF and assembly skillset as the virus series, turned toward obfuscation:
how packers hide a payload, and therefore how unpacking and detection have to
approach one.

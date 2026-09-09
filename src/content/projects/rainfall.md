---
title: "RainFall"
description: "A binary-exploitation wargame — a ladder of vulnerable SUID binaries, each one a step toward the next."
status: "active"
year: 2026
category: "offensive"
featured: true
order: 3
technologies:
  - C
  - C++
  - Linux
  - GDB
github: "https://github.com/0xEr3b0s/RainFall"
problem: >
  RainFall provides a dedicated VM with a chain of vulnerable SUID binaries, from
  level0 through level9 plus several bonus stages. Each level's binary hides a flaw;
  exploiting it yields a shell as the next user, and with it, the password for the
  level after.
solution: >
  Working through the chain means reading and reasoning about compiled binaries at
  the assembly level with no source available, recognising the signature of a
  vulnerability class in native code, and crafting precise input to redirect
  execution.
---

A currently in-progress binary-exploitation wargame — each level a closed door, and
the key to it sitting one level back.

## What it covers

The levels move through a real spread of exploitation techniques rather than
repeating one trick:

- **Buffer overflows** — overrunning a fixed-size allocation and corrupting adjacent
  memory.
- **Format string vulnerabilities** — abusing an unguarded conversion specifier to
  read and write arbitrary addresses.
- **Return address control** — hijacking a function's return and redirecting
  execution flow.
- **Return-to-libc and code reuse** — building an exploit out of machinery already
  present in the target binary.
- **GOT/PLT manipulation** — abusing a program's indirect call tables.
- **C++ object internals** — vtable exploitation and object-memory quirks, in the
  later, harder stages.

## Why this project

This is the project I am actively working through right now, and it is the clearest
signal of where I want to go professionally: reading a stripped binary, understanding
exactly why it fails, and turning that failure into access. Static and dynamic
analysis tooling (objdump, gdb, and friends) stop being reference material here and
start being daily instruments.

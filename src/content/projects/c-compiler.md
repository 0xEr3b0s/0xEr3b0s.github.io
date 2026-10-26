---
title: "c_compiler"
description: "A C compiler written from scratch in C++ — lexer, parser and code generator, built incrementally with a test-driven approach."
status: "active"
year: 2026
category: "systems"
featured: true
order: 2
technologies:
  - C++
  - CMake
  - Compilers
github: "https://github.com/0xNirmata/c_compiler"
problem: >
  Understanding a language from the outside — writing programs in it — only goes so
  far. Building the compiler itself forces a much deeper account of how source text
  becomes a running program: lexical analysis, grammar, semantic checks, and finally
  machine code.
solution: >
  A C compiler implemented in C++, developed stage by stage: a working lexer first,
  then a recursive-descent parser, then semantic analysis and code generation. Each
  stage is meant to be validated with unit tests (doctest) before the next is built
  on top of it, rather than pushing forward on an untested foundation.
---

The project where I have spent the most time close to first principles: no parser
generator, no borrowed IR, just a lexer, a hand-written parser and a code generator,
built up and tested one stage at a time.

## Current state

This project is under active, honest development — not a finished pipeline dressed
up as one. As of the latest work:

- **Lexer** — functional.
- **Parser** — early stage, being rebuilt on top of the lexer with unit tests
  (doctest) rather than pushed forward untested.
- **Code generation** — not yet started in earnest.

I would rather show the real state of an in-progress systems project than a polished
description that overstates it. The compiler targets portability across macOS and
Linux, including the code-generation pitfalls specific to Apple Silicon.

## Why this project

Writing a compiler is one of the few exercises that forces genuine understanding of
what "close to the metal" actually means: how a grammar becomes a syntax tree, how a
syntax tree becomes decisions about memory and registers, and how those decisions
become bytes a processor executes. It sits at the intersection of the two things I
care about most — systems programming and precise, correct low-level reasoning.

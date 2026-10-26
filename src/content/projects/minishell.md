---
title: "Minishell"
description: "A Unix shell implemented from scratch in C — parsing, pipes, redirections, builtins, job control and signal handling."
status: "completed"
year: 2025
category: "systems"
featured: true
order: 3
technologies:
  - C
  - Linux
  - POSIX
github: "https://github.com/0xnirmata/Minishell"
problem: >
  A shell looks simple from the outside — type a command, watch it run. Underneath
  it is process management, signal handling, and a parser that has to get quoting,
  expansion and redirection exactly right, or subtly wrong in ways that only show up
  later.
solution: >
  A from-scratch implementation covering tokenisation and quote handling, variable
  and wildcard expansion, pipes and redirections, the standard builtins (cd, echo,
  export, unset, ...), process forking and execve, and correct SIGINT / SIGQUIT
  behaviour.
---

A from-scratch Unix shell implementation that mimics real bash behaviour
rather than a toy subset of it.

## What it does

- Tokenises and parses shell input, including single/double quotes, escaping, and
  `$VAR` expansion.
- Implements pipes (`|`) and redirections (`<`, `>`, `>>`).
- Implements the standard builtins: `cd`, `echo`, `export`, `unset`, and others.
- Forks and execs external programs, tracks exit status, and handles `SIGINT` /
  `SIGQUIT` the way bash does.

## Why this project

Minishell is where process management and signal handling in C stopped being
theory. Getting fork/exec, pipes and signal delivery to behave correctly under every
edge case — empty commands, malformed quotes, signals mid-pipeline — is a good forcing
function for precise, defensive systems code.

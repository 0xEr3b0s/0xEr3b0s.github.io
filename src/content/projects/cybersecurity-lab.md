---
title: "cybersecurity-lab"
description: "A set of offensive-security modules: ARP-poisoning MITM, OSINT reconnaissance, TOTP, and a hidden service."
status: "completed"
year: 2026
category: "offensive"
featured: true
order: 1
technologies:
  - C
  - Python
  - Docker
  - Networking
github: "https://github.com/0xNirmata/cybersecurity-lab"
---

An ongoing collection of independent modules, each one a self-contained
offensive-security exercise.

## inquisitor — ARP-poisoning MITM tool

The flagship module in this repository: a full-duplex ARP-poisoning
man-in-the-middle tool written in C, run against a dedicated Docker lab.

[View the inquisitor module →](https://github.com/0xNirmata/cybersecurity-lab/tree/main/inquisitor)

**Current state:**

| Feature | State |
| --- | --- |
| Argument parsing & IPv4 / MAC validation | done |
| Local interface / MAC / ifindex discovery | done |
| Full-duplex ARP poisoning | done |
| ARP-table restore on exit (`Ctrl-C`) | done |
| Docker lab (`make up`) | done |
| FTP sniffing — live filename display | in progress |
| `-v` verbose mode (bonus) | to do |

The ARP-poisoning layer is complete and tested — the tool places itself
transparently in the middle of two hosts' traffic on the same LAN and restores both
ARP tables cleanly on exit. FTP control-channel sniffing (surfacing filenames as
they're transferred) is the module currently being built on top of it.

## Other modules

- **arachnida** — a recursive image crawler (`spider`) and an EXIF metadata
  reader (`scorpion`), in Python.
- **ft_onion** — a Tor v3 hidden service behind nginx with SSH administration and
  zero exposed ports, containerised.
- **ft_otp** — a TOTP one-time-password generator in C: an AES-256-CBC-encrypted
  master key produces a rotating HMAC-SHA1 6-digit code, the same mechanism behind
  apps like Google Authenticator.

Each module is independent and reflects a different corner of offensive security —
reconnaissance, network attacks, applied cryptography, and anonymity infrastructure.

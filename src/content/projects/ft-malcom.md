---
title: "ft_malcom"
description: "An ARP-spoofing tool — poisoning two hosts' ARP caches to sit in the middle of their traffic on a LAN."
status: "planned"
year: 2026
category: "network"
featured: false
order: 13
technologies:
  - C
  - Networking
  - ARP
  - MITM
---

A man-in-the-middle tool that crafts raw ARP frames to poison the caches of two
hosts on the same local network, so their traffic flows through the attacker
instead of directly between them.

## What it covers

- **Raw packet crafting** — building ARP replies by hand at the link layer.
- **Cache poisoning** — convincing each target that the attacker's MAC owns the
  other's IP, in both directions, to intercept a full conversation.
- **Interface and address discovery** — resolving local MAC, IP and interface details
  before the attack begins.

Part of the same offensive-networking line as the scanning tools, and the classic
demonstration of why unauthenticated layer-2 protocols cannot be trusted on a shared
network.

---
title: "KFS — kernel from scratch"
description: "A small x86 kernel built up in stages: booting, memory segmentation, and paging-based memory management."
status: "active"
year: 2025
category: "kernel"
featured: false
order: 14
technologies:
  - C
  - x86
---

Three stages, each building on the last:

- **Stage 1** — booted by GRUB, writes to the screen via the VGA text buffer,
  first pieces of a Global Descriptor Table.
- **Stage 2** — a proper Global Descriptor Table at the correct address, a
  basic kernel shell, safe stack handling.
- **Stage 3** — memory management: paging, separating virtual from physical
  memory, and an allocator so the kernel can lend and reclaim its own memory.

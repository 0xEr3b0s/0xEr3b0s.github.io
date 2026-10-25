---
title: "snow-crash"
description: "A security wargame in the classic level-by-level ladder style — each level hides the next one's password inside a vulnerable program or script."
status: "active"
year: 2026
category: "offensive"
featured: false
order: 2
technologies:
  - Linux
  - C
---

Each level is a virtual-machine account whose flaw — weak permissions, an
injection point, a race condition, a careless setuid — has to be found by
reading the source and turned into access to the next account. The entry point
into wargame-style offensive security.

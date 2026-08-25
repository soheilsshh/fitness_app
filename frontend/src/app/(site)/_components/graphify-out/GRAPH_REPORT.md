# Graph Report - _components  (2026-08-25)

## Corpus Check
- 17 files · ~9,453 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 63 nodes · 65 edges · 11 communities (8 shown, 3 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `2363a2a3`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- HomeClient.jsx
- ContactSection.js
- Footer.js
- CartButton.js
- Navbar.js
- AboutSection.js
- landingEffects.js
- RecordsSection.js
- NotFoundView.jsx

## God Nodes (most connected - your core abstractions)
1. `CartButton()` - 3 edges
2. `CartDrawer()` - 3 edges
3. `MobileDrawer()` - 3 edges
4. `formatToman()` - 2 edges
5. `formatToman()` - 2 edges
6. `ContactAiRegisterPopup()` - 2 edges
7. `Footer()` - 2 edges
8. `Hero()` - 2 edges
9. `InlineSocialIcons()` - 2 edges
10. `itemKey()` - 2 edges

## Surprising Connections (you probably didn't know these)
- None detected - all connections are within the same source files.

## Import Cycles
- None detected.

## Communities (11 total, 3 thin omitted)

### Community 0 - "HomeClient.jsx"
Cohesion: 0.18
Nodes (9): Hero(), HERO_FEATURES, AboutSection, ContactSection, Footer, MotionConfig, ProgramsSection, RecordsSection (+1 more)

### Community 1 - "ContactSection.js"
Cohesion: 0.32
Nodes (3): ContactAiRegisterPopup(), DEFAULT_CONTACT, InlineSocialIcons()

### Community 2 - "Footer.js"
Cohesion: 0.32
Nodes (6): Footer(), LEGAL_LINKS, QUICK_LINKS, SOCIALS, formatToman(), PaymentClient()

### Community 3 - "CartButton.js"
Cohesion: 0.43
Nodes (5): CartButton(), formatToman(), CartDrawer(), easeOut, formatToman()

### Community 4 - "Navbar.js"
Cohesion: 0.38
Nodes (4): easeOut, itemKey(), MobileDrawer(), NAV_ITEMS

### Community 5 - "AboutSection.js"
Cohesion: 0.40
Nodes (3): PILLAR_ICONS, PILLARS, STEPS

## Knowledge Gaps
- **21 isolated node(s):** `PILLAR_ICONS`, `PILLARS`, `STEPS`, `easeOut`, `DEFAULT_CONTACT` (+16 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **3 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `CartButton()` connect `CartButton.js` to `Navbar.js`?**
  _High betweenness centrality (0.002) - this node is a cross-community bridge._
- **What connects `PILLAR_ICONS`, `PILLARS`, `STEPS` to the rest of the system?**
  _21 weakly-connected nodes found - possible documentation gaps or missing edges._
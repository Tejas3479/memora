<!-- Source: hackforge-design | Confidence: [STRONG] | Version: v1 | Checkpoint: design-system-complete | Dependencies: .hackforge/blueprint.md, docs/design.md -->
# Design System: Obsidian Memory

## 1. Design Philosophy
An immersive, distraction-free external memory space optimized for cognitive recall, visual depth, and spatial organization. Every design choice minimizes visual friction to enhance reading comfort and data synthesis.

## 2. Visual References
- **Linear:** Sleek dark panels, keyboard shortcuts, high-contrast focus rings.
- **Reflect Notes:** Floating glassmorphic cards, clean typography, glowing active states.
- **Heptabase:** Infinite 2D/3D workspace canvas, connecting nodes, smooth physics.

## 3. Color Palette
Minimum 10 semantic tokens defined for both dark (default) and light themes:

| Token | Dark Value | Light Value | Usage |
|---|---|---|---|
| `--color-bg-primary` | `#050508` (OLED Black) | `#F8F9FC` (Soft Gray) | Main canvas background |
| `--color-bg-secondary` | `#0f0f16` (Deep surface) | `#FFFFFF` (Pure White) | Card and sidebar panels |
| `--color-bg-elevated` | `#181824` (Modal level) | `#F1F3F9` (Raised gray) | Active states, hover targets, dialogs |
| `--color-text-primary` | `#E4E4ED` (Ice white) | `#0F172A` (Slate-900) | Headings and primary text |
| `--color-text-secondary` | `#8E8EA8` (Slate gray) | `#475569` (Slate-600) | Secondary body text, descriptions |
| `--color-text-muted` | `#5A5A75` (Dimmed) | `#94A3B8` (Slate-400) | Captions, disabled labels |
| `--color-accent-primary` | `oklch(58% 0.19 291)` | `#7C3AED` (Purple-600) | CTAs, active graph nodes, highlights |
| `--color-accent-secondary` | `oklch(71% 0.13 220)` | `#06B6D4` (Cyan-500) | secondary buttons, tool badges, glows |
| `--color-success` | `#10b981` | `#059669` | Success status, saved indicators |
| `--color-warning` | `#f59e0b` | `#D97706` | Pending, warnings, near-limits |
| `--color-error` | `#ef4444` | `#DC2626` | Error states, delete actions |
| `--color-info` | `#3b82f6` | `#2563EB` | Neutral updates, system logs |

## 4. Theme System
- **Default Theme:** Dark (Obsidian Black)
- **Toggle Mechanism:** System preference (`prefers-color-scheme`) with manual overrides stored in local storage and synced across tabs.
- **CSS Properties:** Evaluated using tailwind `@theme` structure mapped to CSS root variables.

## 5. Typography
- **Headings Font Stack:** `'Outfit', 'Inter', system-ui, sans-serif`
- **Body Font Stack:** `'Inter', system-ui, sans-serif`
- **Code Font Stack:** `'JetBrains Mono', monospace`
- **Scale:**
  - Display: `clamp(3rem, 8vw, 6rem)` (bold 700)
  - H1: `clamp(2rem, 5vw, 3rem)` (bold 700)
  - H2: `clamp(1.5rem, 4vw, 2.25rem)` (semibold 600)
  - H3: `1.375rem` / 22px (semibold 600)
  - H4: `1.125rem` / 18px (semibold 600)
  - Body: `1rem` / 16px (regular 400, line-height 1.6)
  - Small: `0.875rem` / 14px (regular 400)
  - Caption: `0.75rem` / 12px (regular 400)
  - Code: `0.875rem` / 14px (monospace)

## 6. Spacing Scale
A 4px base scale ensures consistency across layout blocks:
- `1` = 4px
- `2` = 8px (Grid gap, borders)
- `3` = 12px (Inner card padding)
- `4` = 16px (Content padding, gaps)
- `6` = 24px (Large button/input spacing)
- `8` = 32px (Bento grid margins)
- `12` = 48px (Hero sections)
- `16` = 64px (Header heights)
- `24` = 96px (Whitespace bounds)

## 7. Responsive Breakpoints
- **Mobile (<640px):** Single column layout, bottom floating navigation action bar, collapsed filters.
- **Tablet (640px - 1024px):** 2-column layout, collapsible sidebar, layout grid switches.
- **Desktop (>1024px):** Full dashboard split layout, visible proactive panels, custom WebGL nodes.

## 8. Component Patterns
- **Buttons:**
  - *Primary CTA:* Filled background with accent primary, squircle round corners (`rounded-lg`), scale-down animation on click.
  - *Secondary Action:* Outlined with secondary accent or raised surface base background.
  - *Ghost Button:* Transparent background, outline hover only. Used strictly for auxiliary routes (never for primary actions).
- **Cards:** Glassmorphic layout (`backdrop-filter: blur(12px)`), thin white border opacity (`border-white/5`), top inner glow border (`border-t-white/8`), squircle corners (`clip-path` inset).
- **Inputs:** Dark field `#0f0f16` with focus ring `focus-ring-accent-primary`.
- **Mobile/Native target touch:** All tap targets conform to iOS HIG (44pt) and Material Design (48dp) standard parameters.

## 9. Animation Rules
- **Micro-interactions:** 150ms ease-out transitions for buttons, link states, and list selections.
- **Page transitions:** 300ms ease-in-out crossfade or slide-in transitions.
- **Spring parameters:** 500ms spring animations (`stiffness: 120`, `damping: 18`) for dashboard entrances.
- **Reduced motion support:** Auto-disabled spring motions and offsets if `@media (prefers-reduced-motion: reduce)` is true.

## 10. Accessibility Rules
- **Contrast Ratios:** Complies with WCAG AAA recommendations (4.5:1 body text, 3:1 graphical icons and borders).
- **Focus Indicators:** High contrast focus rings (2px solid primary accent) for keyboard users.
- **ARIA Standards:** Native screen reader declarations on all dynamic alerts (`aria-live="polite"`), search containers, and status feeds.
- **Color Independence:** Color is never used as the sole indicator of state (always paired with tags, text, or icons).

## 11. Content State Rules
- **Loading State:** Shimmering glass card layouts and skeleton containers (`.shimmer`).
- **Empty State:** High-contrast illustration, helpful text block, and single filled CTA.
- **Error State:** Warning status indicator icon, clear descriptive error text, and inline "Retry" button.
- **Success State:** Celebratory success tick icon, confirmation summary, and primary "Done" or forward CTA.

## 12. Psychology Compliance

| Principle | Status | Notes |
|---|---|---|
| 5-Second Credibility Test | PASS | Prominent search bar and clear "Personal Memory Layer" landing. |
| Domain-Matching Visual Style | PASS | Dark, data-dense, obsidian theme matches productivity/recall tools. |
| Audit Defaults | PASS | Opt-out auto-capture protects privacy by default. |
| Clear Main Path | PASS | Top search bar acts as the main hub. |
| Progressive Disclosure | PASS | Advanced queries and loops are hidden behind settings. |
| Visible Signifiers | PASS | Hover scales and cursor indicators applied to all elements. |
| No Ghost Buttons for Primary CTAs | PASS | Filled buttons used for ingestions/actions. |
| Max 1 Primary Action Per Screen | PASS | Single clear CTA per card/dashboard screen. |
| 7±2 Rule for Navigation | PASS | Navigation contains 6 items: Timeline, Graph, Folders, Automations, Teams, Settings. |
| Label Clarity | PASS | Explicit labels on icons and buttons. |
| Same Action = Same Label | PASS | "Save Memory" and "Delete" are identical everywhere. |
| Pattern Library Compliance | PASS | Standardized glassmorphism cards and border roundings. |
| 3-Week Amnesia Test | PASS | Familiar layouts and standard sidebar controls prevent relearning. |
| Recognition Over Recall | PASS | Recent items list and interactive citation chip hovers. |
| Designed Final Screen | PASS | Value-reinforced summary after exporting ZIP data. |
| Map Emotional Peaks | PASS | Clean visual feedback on successful memory capture. |
| Pre-Fill Progress | PASS | Timeline progress pre-filled based on total parsed links. |
| Acknowledge Completed Work | PASS | Comprehensive dashboard digests highlighting key entities. |
| Gestalt Proximity | PASS | Related memories grouped inside folders or clusters. |
| Gestalt Continuity | PASS | Chronological timeline items aligned on a central axis. |
| Gestalt Closure | PASS | Partly visible folder tree edges indicate scrolling capability. |
| Value Before Signup | PASS | Offline mode enables direct extension captures immediately. |
| Move Value Forward | PASS | Minimizes capturing to a single click. |
| Audit Feeling Before Logic | PASS | Obsidian colors promote calm focus; ADHD mode reduces clutter. |
| Interruption Worth-It Test | PASS | No persistent popups; alerts are soft notifications. |

### Explicit Prohibitions (10 Anti-Patterns)
1. **Ghost Buttons for Primary Actions** — Outline-only main CTAs are banned.
2. **Recall-Dependent Navigation** — Users must not be forced to recall paths or codes.
3. **Zero-Start Progress** — Empty starts are prevented by pre-populating with parsed page counts.
4. **Flat Endings** — Succinct or unhelpful success prompts are replaced with actionable insights.
5. **Choice Dumps** — Feeds are paginated; parameters are organized inside collapsible panels.
6. **Near-Miss Alignment** — Strict Tailwind spacing scale grid alignment.
7. **Noise Escalation** — Urgency levels are color-coded (Red for severe errors only).
8. **Setup Walls** — Users can capture content before configuring vector integrations.
9. **Dark Defaults** — Defaults protect user privacy and local-first data.
10. **Cultural Blindness** — Status labels use clear text alongside icons to avoid color dependency.

## 13. Data Visualization
- **WebGL Knowledge Graph:** Standardized 3D visualization using Cosine similarity bounds.
- **2D Canvas Fallback:** Physics-based 2D force-directed layout engine calculating Hooke's law forces (charge repulsion, edge springs, and gravity centering) in a fast HTML5 `<canvas>`.

## 14. Layout Pattern
- **Dashboard Grid:** Sidebar Navigation (240px wide) + Sticky Header (64px high) + Main Bento Grid layout.

## 15. AI Interaction Patterns
- **Server-Sent Events (SSE):** Streaming synthesized text yielding character-by-character tokens to reduce time-to-first-token perception.
- **AI Thinking Indicators:** Staggered opacity dots loader inside a glass container, marked with `aria-busy="true"`.
- **Transparency:** Action badges showing exactly what integrations/services the AI queried.

## 16. Real-Time Data Patterns
- **WebSocket Indicators:** Small pulsing status indicator showing active connections (green), reconnecting state (yellow), or offline (gray).
- **Proactive suggestions:** Cards slide in with gentle springs and highlights when a related browser page is active.

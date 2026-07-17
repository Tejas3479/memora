# Memora Design System — "Obsidian Memory" Specification

**Version:** 3.0.0  
**Scope:** Client Dashboard (`client/`), Extension Panels (`extension/`), and Shared Component Libraries.  
**Theme:** Dark-First OLED, Structured Bento, Bounded Materials, and Functional Motion.

---

## 1. Depth & Elevation: OLED Hierarchy

To prevent screen glare and astigmatism fatigue, we enforce a strict **Dark-First elevation scale**. We use deep grays and inner highlights instead of traditional drop shadows.

```
[Level 3: Modal/Dialog] - #222230  (Floating commands/Settings)
   |
[Level 2: Active/Hover] - #181824  (Active memory node focus)
   |
[Level 1: Layout Card]  - #0F0F16  (Default bento item/Note container)
   |
[Level 0: Viewport Base] - #050508  (Deep black background)
```

### Neumorphic Inner Highlight
All Level 1 & 2 cards use a `1px` top-border inner highlight mimicking physical light reflection on obsidian edges:
```css
.card-elevation-1 {
  background-color: #0F0F16;
  border: 1px solid rgba(44, 44, 61, 0.5);
  border-top: 1px solid rgba(255, 255, 255, 0.06);
}
```

---

## 2. Layout & Bento Responsive Flow

Bento grid layouts must be designed deliberately for mobile viewports rather than relying on automatic CSS grid reflows.

```
Desktop:
+-------------------+-------------------+
|     Search (K)    |   Active Tasks    |  <- (Z-Axis Layer 2 Dropdown)
+---------+---------+---------+---------+
| Bento 1 | Bento 2 | Bento 3 | Bento 4 |
+---------+---------+---------+---------+
|       Feed Stream / Timeline          |
+---------------------------------------+

Mobile Reflow (Explicit Order):
1. Search omnibar (Fixed focus)
2. Bento 1 & Bento 2 (side-by-side)
3. Feed Stream / Timeline (Single Column)
4. Bento 3 & Bento 4 (appended to foot)
```

### Responsive CSS Implementation
```css
.bento-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
}

@media (max-width: 768px) {
  .bento-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  .bento-feed-stream {
    grid-order: 3; /* Placed immediately after basic search metrics */
  }
}
```

---

## 3. Typography: Variable Scroll & Monospace Accents

Typography in Memora is treated as a **primary interface architecture** to reduce heavy imagery and page weight.

### Variable Font Axes Configuration
For headers (e.g. search query title tags), we modulate variable font weights dynamically in response to scroll positions to guide visual hierarchy.

```javascript
// Variable scroll font axis controller hook
import { useEffect } from 'react';

export function useScrollFontWeight(elementId: string) {
  useEffect(() => {
    const handleScroll = () => {
      const scrollPct = window.scrollY / (document.documentElement.scrollHeight - window.innerHeight);
      const targetWeight = 400 + Math.floor(scrollPct * 300); // Scale from 400 (Regular) to 700 (Bold)
      const el = document.getElementById(elementId);
      if (el) {
        el.style.fontVariationSettings = `'wght' ${targetWeight}`;
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [elementId]);
}
```

### Font Pairing Guidelines
- **Main Headings:** `Outfit` (sans-serif) or variable weight `Geist Sans` for a technical, crisp vibe.
- **Body / AI Answer Text:** `Inter` set to `16px` (`text-base`) with `leading-relaxed` (`1.625`) to ensure readability.
- **Identifiers / Code blocks:** `Geist Mono` for timestamps, tags, and citation hashes (e.g. `[note:qdrant-3f]`).

---

## 4. Depth & Materiality (Liquid Glass Support)

Glassmorphism is limited strictly to **floating layers** to minimize paint times and battery depletion on mobile screens.

- **Modals / Search suggestion overlays:** `backdrop-filter: blur(12px)` + `rgba(15, 15, 22, 0.75)`.
- **Primary reading streams:** Solid background colors (`#0f0f16`) only.

### Accessibility Safety Guardrail
```css
@media (prefers-reduced-transparency: reduce) {
  .glass {
    background: #0f0f16 !important;
    backdrop-filter: none !important;
  }
}
```

---

## 5. Motion Engineering (Lenis + GSAP ScrollTrigger)

Memora uses smooth inertia scrolling to align scroll reveals cleanly with spatial layouts.

### 5.1 Lenis initialization
```javascript
import Lenis from 'lenis';

export const initSmoothScroll = () => {
  const lenis = new Lenis({
    duration: 1.2,
    easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    gestureOrientation: 'vertical',
  });

  function raf(time: number) {
    lenis.raf(time);
    requestAnimationFrame(raf);
  }

  requestAnimationFrame(raf);
  return lenis;
};
```

### 5.2 Functional Staggered Line Reveal (Framer Motion)
```typescript
export const staggerContainerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
    },
  },
};

export const staggerLineVariants = {
  hidden: { y: 4, opacity: 0 },
  show: { y: 0, opacity: 1, transition: { duration: 0.25, ease: 'easeOut' } },
};
```

---

## 6. Spatial Exploration (Knowledge Graph Engine Rules)

The 3D interactive knowledge graph uses HTML Canvas with rendering restrictions to prevent drop-off in frames.

1. **Mobile Rendering Throttling:** If rendering on a touch device, limit nodes to the 50 most recent memories; fall back to a flat 2D layout.
2. **Progress indicator:** Always display a skeletal layout loading screen while graph relationships compile.
3. **GPU release:** Clean up all Canvas drawing buffers and dispose of contexts when navigating away from `GraphPage`.

---

## 7. Cognitive Inclusivity: ADHD Focus Mode

ADHD Focus Mode can be toggled by the user to reduce background noise.

```css
/* Toggled layout class configuration */
.adhd-focus-active .bento-metric-card,
.adhd-focus-active .layout-sidebar,
.adhd-focus-active .proactive-panel {
  opacity: 0.15;
  filter: blur(1.5px);
  pointer-events: none;
  transition: all 0.3s ease;
}

.adhd-focus-active .search-focus-container {
  grid-column: span 12;
  transform: scale(1.02);
  z-index: 10;
}
```

# Memora Design System: "Obsidian Memory" Aesthetic

This document outlines the architectural and aesthetic standards for the Memora platform. All future components, views, and style updates must strictly adhere to these guidelines to maintain a premium, immersive, state-of-the-art user experience.

---

## 🌌 1. The Canvas Backdrop (Depth & Texture)

Rather than flat, dull background layers, the Memora workspace utilizes a highly textured, dimensional universe style:

*   **Primary Background Color**: Strict, deep obsidian space black `bg-[#050508]`.
*   **Ambient Cosmic Glows**: Embedded 3-layered slow-pulsing radial mesh gradients floating in the background:
    *   Top-Right: `#7c3aed` (purple-600) with a `blur-[140px]` at `30%` opacity (evoking active memory clusters).
    *   Center-Left: `#06b6d4` (cyan-500) with a `blur-[160px]` at `25%` opacity (evoking search path pathways).
    *   Bottom-Right: `#050508` base depth.
*   **Tactile Dot Grid Mask**: A fine, repeating `4rem_4rem` grid layer masked with a radial gradient:
    ```css
    background-image: linear-gradient(to right, rgba(255,255,255,0.01) 1px, transparent 1px),
                      linear-gradient(to bottom, rgba(255,255,255,0.01) 1px, transparent 1px);
    mask-image: radial-gradient(ellipse 60% 50% at 50% 40%, #000 60%, transparent 100%);
    ```

---

## 🧊 2. Translucent Glassmorphic Cards (The Materials)

Workspace panels and overlays are designed as translucent glass plates floating over the cosmic backdrop:

*   **Panel Transparency**:
    *   Left Panel (Dashboard & Timeline): `rgba(15, 15, 22, 0.75)`
    *   Right Panel (Proactive Sidebar & Chat): `rgba(10, 10, 15, 0.45)`
    *   Header bar: `rgba(10, 10, 15, 0.45)`
*   **Backdrop Blur**: Strict `backdrop-blur-[12px]` or `backdrop-blur-[16px]` applied to all primary panels, allowing the pulsing gradient glows to filter through beautifully.
*   **Card Outlines**: Ultra-thin `border border-white/5`. Contrasts structural panels without heavy shadows.
*   **Corner Radii**:
    *   Primary split panels: `rounded-none` to anchor onto screen bounds cleanly.
    *   Bento cards, memory-feed items, modals: `rounded-2xl` (12px) for a premium soft organic feel.
    *   Action buttons, tags, input components: `rounded-lg` (8px).

---

## 🎨 3. Rich Color Palettes & HSL Glow Tokens

Avoid generic solid hues. Use curated, vibrant gradient overlays and shadow blooms:

*   **Primary Purple**: `oklch(58% 0.19 291)` (`#7c3aed`).
*   **Cyan Accent**: `oklch(71% 0.13 220)` (`#06b6d4`).
*   **Emerald Success**: `oklch(62% 0.17 145)`.
*   **Amber Warning**: `oklch(78% 0.14 80)`.
*   **Muted Slate**: `#8E8EA8` (text-muted) and `#2C2C3D` (border-slate).
*   **Vibrant Gradient Text**: `linear-gradient(135deg, #a78bfa 0%, #22d3ee 100%)`.
*   **HSL Shadow Blooms**:
    *   Purple Bloom: `box-shadow: 0 0 25px rgba(124, 58, 237, 0.20)`.
    *   Cyan Bloom: `box-shadow: 0 0 25px rgba(6, 182, 212, 0.15)`.

---

## 💬 4. Dialogue Flow & Bubble Aesthetics

The chat and synthesis interfaces represent the master brain of the workspace, requiring stellar styling:

*   **User Search Prompts**: Styled with a highly vibrant HSL glass gradient:
    *   Class: `bg-gradient-to-tr from-[#7c3aed]/12 to-[#06b6d4]/8 text-white border border-[#7c3aed]/25 shadow-[0_0_15px_rgba(124,58,237,0.06)]`
*   **AI Agent Response Bubbles**: Framed in crisp dark translucent plates:
    *   Class: `bg-[#0f0f16]/90 backdrop-blur-md text-slate-200 border border-white/5 shadow-[0_0_20px_rgba(0,0,0,0.25)]`
*   **Typing/Thinking State**: Displays a clean glass container matching the agent bubble style, populated with three slow-pulsing dots using staggering animation delays (`animation-delay: 0.2s/0.4s`).

---

## ⚡ 5. Micro-Animations & Springs

Every interactive element must feel alive:

*   **Spring Parameters**: Springy entrances using Framer Motion:
    *   Entrance style: `stiffness: 120`, `damping: 18` to give a premium, organic drift.
*   **Hover Scaling**: Subtle visual expansions on hover:
    *   MemoryCard, Bento blocks: `scale-[1.01]` or `scale-[1.02]`.
    *   Interactive buttons: `active:scale-[0.98]` for responsive physical feedback.
*   **Transition Speeds**: Standard hover transitions must utilize a clean `transition-all duration-250 ease-out` timing curve.

---

## 🌌 6. WebGL 3D Physical Space & Layout Presets

To fully immerse the user in their data, the interface bridges 3D graphics pipelines with standard 2D layout managers:

*   **Three.js Glass Node Material**: Nodes are rendered inside an interactive WebGL point cloud using:
    ```typescript
    new THREE.MeshPhysicalMaterial({
      color: new THREE.Color(baseColor),
      transparent: true,
      opacity: active ? 0.85 : 0.12,
      roughness: 0.1,
      metalness: 0.15,
      transmission: active ? 0.90 : 0.25, // Refractive glass transparency
      thickness: active ? 2.0 : 0.3,     // Refracted light thickness
      clearcoat: active ? 1.0 : 0.0,
      clearcoatRoughness: 0.1,
    })
    ```
*   **Active Camera Drifts**: Continuously rotates the spatial point cloud using smooth trigonometric drifts (`x: distance * Math.sin(angle), z: distance * Math.cos(angle)`) to keep the interface visually dynamic and alive.
*   **Layout Preset Panel Resizes**: Resizes split panes using the smooth transitions of `react-resizable-panels`:
    *   **ADHD Focus Mode**: Collapses sidebars and dashboard grids completely, focusing 100% space on the search container and active AI search synthesis box.
    *   **Explorer Mode**: Standard split panel providing a 58%/42% workspace split (Left graph/Right content).
    *   **Timeline Mode**: Focuses on the ingested web clips feed.

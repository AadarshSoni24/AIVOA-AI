# Workspace Rules: Frontend & UI Craft Standards

Whenever writing, designing, refactoring, or reviewing any frontend code, user interfaces, components, or styling in this project, ALWAYS enforce the guidelines from the installed skills in `.agent/skills/`:

## 1. Visual Design & Anti-Slop Standards
* **Reference Skill**: `.agent/skills/taste-skill/SKILL.md` and `.agent/skills/ui-craft/SKILL.md`
* **Rule**: Strictly avoid generic "AI-slop" aesthetics (e.g., cliché purple/blue gradient blobs, identical floating cards, uninspired 3-column grids, and flat placeholder imagery).
* Choose intentional, distinct typographic pairings, deliberate visual hierarchy, purposeful white space, and cohesive color palettes.

## 2. Frontend Engineering & Architecture
* **Reference Skill**: `.agent/skills/frontend-ui-engineering/SKILL.md`
* **Rule**: Build production-quality, modular, and maintainable components.
* Ensure responsive layouts across mobile, tablet, and desktop viewports.
* Keep logic separated from presentation, use proper state management, and avoid unnecessary re-renders.

## 3. UI Polish, Hierarchy & Depth
* **Reference Skills**: `.agent/skills/better-ui/SKILL.md`, `.agent/skills/better-typography/SKILL.md`, and `.agent/skills/refactoring-ui/SKILL.md`
* **Rule**: Establish hierarchy through font weight and color contrast rather than excessive sizing.
* Emulate natural light for depth (subtle, layered shadows and fine 1px borders rather than harsh drop-shadows).
* Provide complete interactive states for all elements: default, hover, focus-visible, active, disabled, and loading.

## 4. Accessibility (WCAG 2.2 Compliance)
* **Reference Skill**: `.agent/skills/better-accessibility/SKILL.md`
* **Rule**: All interactive components must be fully operable via keyboard.
* Ensure color contrast meets or exceeds WCAG AA standards (4.5:1 for normal text, 3:1 for large text and UI components).
* Use semantic HTML elements (`<button>`, `<nav>`, `<main>`, `<dialog>`) over generic `<div>` click handlers, and ensure accurate ARIA attributes and labels.

## 5. Motion, Transitions & Micro-Interactions
* **Reference Skills**: `.agent/skills/transitions-dev/SKILL.md` and `.agent/skills/oil-motion/SKILL.md`
* **Rule**: Add fluid, purposeful CSS transitions to state changes (modals, dropdowns, buttons, toggles).
* Keep durations snappy (150ms–300ms) with easing curves that feel natural (`cubic-bezier(0.16, 1, 0.3, 1)`).
* Always respect `prefers-reduced-motion`.


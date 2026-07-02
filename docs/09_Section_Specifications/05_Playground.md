# **Playground Section**

## **Purpose**

The Playground section showcases creative coding, interaction design, and visual experiments. It acts as an interactive canvas where visitors experience coding craftsmanship firsthand.

---

## **Product Philosophy**

Playground is a place for exploration. It proves that technical execution can also produce visual delight. It shows a passion for digital craftsmanship outside standard business requirements.

---

## **User Goals**

* **Hiring a Developer**: Evaluate creative problem solving, Math/physics integration, WebGL/Three.js optimization, and animation mechanics.
* **Need a Website**: Experience interaction design, modern animations, and professional visual polish.

---

## **Behavior**

* Renders interactive visual experiments (such as selective particle networks, physics engines, or canvas shaders).
* Supports user-directed play (mouse tracking, scroll interaction, or click updates).

---

## **Adaptive Behavior**

* **Azure Theme (Vibrant Interaction)**:
  * Uses active 3D particle fields, colorful canvas models, and fluid animations.
  * Colors shift dynamically matching coordinate mouse coordinates.
* **Noir Theme (Monochrome Comic Retro)**:
  * Displays high-contrast halftone effects, vector drawing pads, or CRT monitor filters.
  * Animations are stylized to mimic traditional comic line drawings.
* **Accessibility Fallback**: If the visitor has "Reduced Motion" enabled, animations pause, rendering a clean static layout instead.

---

## **Performance Guidelines**

Creative code must remain performant to prevent browser heating:
1. **Intersection Observer**: The WebGL render loop must execute **only** when the Playground is visible on the screen. Loops pause when scrolled out of view.
2. **Lazy Initialization**: Three.js/Canvas elements are dynamically imported (`next/dynamic` with `ssr: false`) and load only when the section is about to scroll into the viewport.
3. **Low-Polygon Models**: Visual models use minimal polygons and compressed shaders to reduce CPU overhead.

---

## **Content Requirements**

* Static titles and summary descriptions.
* Interactive tags explaining the math or shaders utilized.

---

## **Analytics**

* Interaction duration.
* Clicks on "Reset Simulation" or experiment switch keys.

---

## **Acceptance Criteria**
- Playground runs smoothly without blocking the browser main thread.
- Canvas render loops halt when the section is offscreen.
- Visual theme shifts align with Azure/Noir aesthetics.
- Respects `prefers-reduced-motion` settings.

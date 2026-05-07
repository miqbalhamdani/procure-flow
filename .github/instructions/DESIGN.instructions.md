# Design System Strategy: ProcureFlow Editorial

## 1. Overview & Creative North Star: "The Digital Atrium"
This design system moves beyond the "generic SaaS dashboard" by adopting a philosophy we call **The Digital Atrium**. In a high-end procurement environment, clarity is luxury. We reject the cluttered "control room" aesthetic in favor of a bright, open, and architectural space.

Our Creative North Star focuses on **Architectural Lucidity**. Instead of defining the UI through rigid boxes and heavy lines, we use light, depth, and intentional asymmetry. We utilize the large typography of high-end editorial magazines (like *Monocle* or *Kinfolk*) to create an authoritative yet breathable experience. By overlapping elements and using varied surface tiers, we create a "layered paper" effect that feels tactile and premium.

---

### 2. Colors & Surface Architecture
The color palette is rooted in a sophisticated "Cool Slate" neutral base with a "Regal Violet" signature. We avoid the "default" look by prioritizing background shifts over borders.

#### The "No-Line" Rule
**Explicit Instruction:** Do not use `1px solid` borders for sectioning or containers. Structural boundaries must be defined solely through background color shifts. 
- A `surface-container-low` (#f2f3ff) sidebar sitting on a `surface` (#faf8ff) background creates a cleaner, more modern separation than a stroke ever could.

#### Surface Hierarchy & Nesting
Treat the UI as a physical stack of fine paper. Use the following tiers to define depth:
*   **Base:** `surface` (#faf8ff) - The canvas.
*   **Sub-Section:** `surface-container-low` (#f2f3ff) - Used for sidebars or secondary navigation.
*   **Primary Content Area:** `surface-container` (#eaedff) - The main workspace background.
*   **Raised Elements:** `surface-container-lowest` (#ffffff) - Use this for cards and interactive modules to make them "pop" against the darker containers.

#### The Glass & Gradient Rule
For floating elements (modals, dropdowns, or "sticky" headers), use **Glassmorphism**. Apply `surface` (#faf8ff) at 80% opacity with a `20px` backdrop-blur. 
- **Signature Texture:** Primary CTAs should not be flat. Use a subtle linear gradient from `primary` (#712ae2) to `primary_container` (#8a4cfc) at a 135-degree angle to give buttons a "jewel-like" depth.

---

### 3. Typography: Editorial Authority
We pair **Manrope** (Display/Headlines) for an architectural, modern feel with **Inter** (Body/Labels) for maximum legibility.

*   **Display (Manrope):** Use `display-lg` (3.5rem) for high-level data summaries (e.g., Total Spend). The large scale conveys confidence.
*   **Headline (Manrope):** `headline-sm` (1.5rem) should be used for page titles. Bold weights here ground the page.
*   **Body (Inter):** `body-md` (0.875rem) is our workhorse. Use a slightly tighter letter-spacing (-0.01em) to achieve that "Linear" look.
*   **Labels (Inter):** `label-md` (0.75rem) in `secondary` (#515f74) for metadata. 

**Intentional Asymmetry:** Align display typography to the far left while pushing secondary actions to the far right, creating a wide "editorial" scanning path that feels custom-built rather than templated.

---

### 4. Elevation & Depth: Tonal Layering
Traditional shadows are often "dirty." We use **Ambient Softness** to create lift.

*   **The Layering Principle:** Place a `surface-container-lowest` (#ffffff) card on top of a `surface-container-low` (#f2f3ff) background. This creates a natural 3D lift without any CSS box-shadow.
*   **Ambient Shadows:** When a shadow is required (e.g., a floating Command Palette), use: `box-shadow: 0 20px 50px -12px rgba(19, 27, 46, 0.08)`. The shadow color is derived from our `on-surface` (#131b2e) to ensure it looks like natural ambient light.
*   **The "Ghost Border" Fallback:** If accessibility requires a container definition, use the `outline-variant` (#c7c4d7) at **15% opacity**. It should be felt, not seen.

---

### 5. Components: Refined Primitives

*   **Buttons:**
    *   *Primary:* Gradient-filled (`primary` to `primary_container`), `rounded-md` (0.75rem), white text.
    *   *Secondary:* `surface-container-highest` (#dae2fd) background with `primary` (#712ae2) text. No border.
*   **Cards & Lists:** 
    *   **Strict Rule:** No divider lines between list items. Use `spacing-4` (1rem) of vertical white space or alternating subtle background shifts (`surface` to `surface-container-low`).
    *   Cards must use `rounded-lg` (1rem) or `rounded-xl` (1.5rem) for a friendly, modern SaaS feel.
*   **Input Fields:** 
    *   Use `surface-container-lowest` (#ffffff) for the input fill. 
    *   On focus, do not use a heavy glow. Instead, shift the background to `surface-bright` and use a 1px `primary` ghost border.
*   **Status Chips:** 
    *   Use highly desaturated backgrounds (e.g., `error_container` at 40% opacity) with high-contrast text (`on_error_container`). This ensures the "Success" or "Danger" labels don't overwhelm the clean layout.
*   **The "Procurement Feed" (Custom Component):** A vertical timeline that uses `primary_fixed` (#eaddff) vertical stalks instead of grey lines, creating a branded thread throughout the dashboard.

---

### 6. Do's and Don'ts

#### Do
*   **Do** use white space as a structural element. If an interface feels cramped, increase the padding to `spacing-8` (2rem) before considering a divider line.
*   **Do** use `on_surface_variant` (#464554) for secondary text to maintain a soft, sophisticated contrast ratio.
*   **Do** leverage `tertiary` (#904900) for "Attention Required" items—it’s a sophisticated ochre/gold that feels more "premium" than a standard bright yellow warning.

#### Don't
*   **Don't** use pure black (#000000) for text. Always use `on_background` (#131b2e).
*   **Don't** use `rounded-none`. Everything in this system has a minimum radius of `0.25rem` to maintain the "Soft Minimalism" aesthetic.
*   **Don't** use high-contrast borders. If you can see the border from 2 feet away from the monitor, it’s too dark. Aim for "barely there."
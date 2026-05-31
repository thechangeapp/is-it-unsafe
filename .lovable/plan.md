## Overview

Strip all glowing effects, gradients, and the current spread-out layout. Replace with a pure black screen and a single, refined centered modal using an ultra-minimalist, premium aesthetic.

## Changes

### 1. Update `src/routes/__root.tsx`
- Replace the Google Fonts link to load **Playfair Display** (serif for the title) alongside **Inter** (sans-serif for UI text).
- Remove the Cormorant Garamond font link.

### 2. Update `src/styles.css`
- Strip all brand-specific gradient variables (`--gradient-bg`, `--gradient-text`, `--gradient-primary`), glow shadows (`--shadow-glow`), and glass tokens (`--glass-bg`, `--glass-border`).
- Remove the corresponding utility classes (`.bg-app-gradient`, `.text-gradient-rose`, `.glass`, `.shadow-glow`, `.bg-gradient-primary`).
- Update `--font-display` to `"Playfair Display", ui-serif, Georgia, serif`.
- Keep the rest of the Tailwind / shadcn theme infrastructure intact.

### 3. Rewrite `src/routes/index.tsx`
- **Background**: `bg-black` (`#000000`). No gradients, no ambient glow orbs, no radial backgrounds.
- **Layout**: `min-h-screen` flex container, perfectly centered both axes. Modal uses `w-full max-w-sm` (85-90% width on mobile).
- **Modal container**: `bg-zinc-950` (`#0a0a0a`), `border border-white/10`, `rounded-2xl` or `rounded-3xl`, generous internal padding.
- **Modal content** (stacked, center-aligned):
  1. Title: "Is it Unsafe?" in Playfair Display, crisp white, with *Unsafe* italicized.
  2. Subtitle: "BY MIDNIGHT INTELLIGENCE & THECHANGE INITIATIVE" — very small, uppercase, wide tracking, `text-zinc-500`.
  3. Subtle divider / spacer.
  4. Prompt: "To help map safety, we need to know your general area to find nearby neighborhoods." — Inter, soft white/light grey.
  5. Button: "Grant Location Access" with a small MapPin icon. Solid crisp white button with black text, OR black button with `border border-white` and white text. No shadows, no colored glows. Simulated loading spinner inside on click (no real geolocation yet).
  6. Footer: "This rating is anonymous. We do not store your location or user data." — `text-zinc-600`, very small.
- Remove all `animate-fade-in` delays and ambient orb `<div>` elements.

### Out of Scope
- No real Geolocation API implementation.
- No new routes or backend logic.
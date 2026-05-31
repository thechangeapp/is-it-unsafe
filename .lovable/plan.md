
## Goal
Build the initial Location Access screen for "Is it Unsafe?" — a premium, mobile-first, super-dark feminine UI. No real geolocation yet; the button just simulates a loading state.

## Design System (src/styles.css)
Replace the default neutral tokens with a dark feminine palette (oklch):
- `--background`: near-obsidian black with a faint plum tint
- `--foreground`: warm off-white (soft rose-cream)
- `--card`: translucent dark plum for glassmorphism
- `--primary`: rose gold / muted blush accent
- `--primary-foreground`: deep near-black
- `--muted-foreground`: soft rose-gray
- `--border`: low-opacity warm white
- Add custom tokens: `--gradient-bg` (obsidian → deep burgundy → midnight plum radial/linear blend), `--gradient-primary` (rose gold → blush), `--shadow-glow` (soft rose-gold glow), `--glass-bg`, `--glass-border`
- Fonts via Google Fonts `<link>` in `__root.tsx` head: display = "Cormorant Garamond" (italic, refined) for the title; body = "Inter" for UI and muted text

## Screen Composition (src/routes/index.tsx)
Replace the placeholder with a single full-viewport section:
- `min-h-screen` flex column, centered, padded for mobile, rich gradient background with subtle radial glow accents (two soft blurred orbs in burgundy / rose gold for depth)
- Stacked content, max-width ~420px:
  1. **Title** — "Is it Unsafe?" in display font, large (text-5xl → text-6xl on sm), tight tracking, subtle gradient text fill (cream → rose gold)
  2. **Subtitle** — "by Midnight Intelligence & TheChange Initiative" in muted rose-gray, tracking-wide, text-xs uppercase
  3. **Glass card** — rounded-2xl, backdrop-blur, translucent plum bg, hairline rose border, soft inner glow; contains the explanation copy in relaxed leading
  4. **CTA button** — full-width, rounded-full, gradient border (rose gold → blush) with dark inner fill, soft outer glow shadow; `MapPin` icon from lucide + "Grant Location Access"; on click → swap icon for spinning `Loader2`, disable, keep simulated state (resets after ~2.5s for re-demo)
  5. **Disclaimer** — small muted text: "This rating is anonymous. We do not store your location or user data."
- Entrance: staggered fade-in + slight upward translate using existing `animate-fade-in` utility (delays via inline style)
- Button hover/active: gentle scale + intensified glow; respect reduced-motion

## Metadata
Update `head()` in `src/routes/index.tsx`:
- title: "Is it Unsafe? — Map Safety for Women"
- description: one sentence about anonymous neighborhood safety ratings
- og:title / og:description matching

## Files Touched
- `src/styles.css` — palette + gradient/glow/glass tokens, font-family vars
- `src/routes/__root.tsx` — add Google Fonts `<link>` entries in `head().links`
- `src/routes/index.tsx` — full rewrite of `Index` with the landing UI and local `useState` for the simulated loading

## Out of Scope
- Real Geolocation API
- Routing to a next screen
- Persistence / backend

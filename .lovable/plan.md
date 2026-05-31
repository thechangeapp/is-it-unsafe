## Overview

Wire the "Grant Location Access" button to browser geolocation and a secure backend that calls xAI (Grok) for nearby neighborhoods. Backend is a TanStack `createServerFn` (idiomatic for this stack); `XAI_API_KEY` lives in Lovable Cloud secrets.

## Changes

### 1. Enable Lovable Cloud
Provisions backend + secret storage.

### 2. Add `XAI_API_KEY` secret
Triggers the secure form for the rotated key.

### 3. `src/lib/areas.functions.ts` (new)
- `getNearbyAreas` = `createServerFn({ method: "POST" })`.
- Zod input: `{ lat: number(-90..90), lon: number(-180..180) }`.
- Handler reads `process.env.XAI_API_KEY` inside `.handler()`. POSTs to `https://api.x.ai/v1/chat/completions` with `model: "grok-2-latest"` and the exact system/user prompts from the spec.
- Parses `choices[0].message.content` as JSON (regex fallback for first `[...]` block). Validates non-empty string array. Returns `{ areas: string[] }`.
- Throws concise messages for missing key, HTTP failure, parse failure.

### 4. `src/routes/index.tsx` (update)
- State: `status: "idle" | "locating" | "fetching" | "success" | "error"`, `areas: string[]`, `errorMsg: string`.
- Click handler:
  1. `status = "locating"`; `navigator.geolocation.getCurrentPosition(success, error, { timeout: 15000 })`.
  2. On coords → `status = "fetching"` → call `useServerFn(getNearbyAreas)`.
  3. On success → set `areas`, `status = "success"`.
  4. On permission denied → `errorMsg = "Location access is required to find nearby areas."`, `status = "error"`.
  5. On network/API/parse error → friendly message, `status = "error"`.
- Button disabled + `Loader2` spinner + "Locating…" during `locating`/`fetching`.
- Error text directly below button: small, `text-red-400/80`, shown only when `status === "error"`. Clicking the button again resets and retries.
- Success view: modal `<section>` transitions to `opacity-0 scale-95` (~300ms), then conditional render swaps to centered white text on pure black: `Successfully found {areas.length} areas.`

### Out of scope
Rating cards UI, persistence (next step).
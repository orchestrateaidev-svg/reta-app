# Retatrutide Companion

**Build Specification v1.0 — Locked · 11 July 2026 · Owner: Cameron**

A personal, private companion app for a 6-month prescribed GLP-1 program (transition from tirzepatide to retatrutide). Its job: maximise fat loss, minimise lean-mass loss, and rehearse the habits that keep weight off after discontinuation — the three things the trial literature says determine long-term outcomes.

> **Non-negotiable design principle:** the prescribing doctor is the source of truth for all dosing. The app tracks prescribed schedules, correlates data, and surfaces published evidence with "discuss with your prescriber" framing. It never generates or suggests doses for retatrutide or any ancillary compound.

## Locked decisions

| Decision | Choice |
|---|---|
| **Platform** | PWA — installable on phone and PC, offline-first |
| **Data** | Local-only. IndexedDB on device, JSON/CSV export for backup. No accounts, no cloud |
| **AI coaching** | Built in via Claude API — your own key, stored locally on device |
| **Data entry** | Quick manual logging — tap-first UX, favourites, one-tap portions |
| **Peptide scope** | Evidence library with strength ratings + tracking of anything the doctor prescribes |

## Tech stack

- **Frontend:** React 18 + TypeScript + Vite, Tailwind CSS
- **PWA:** vite-plugin-pwa — service worker, install prompt, offline shell
- **Storage:** Dexie.js over IndexedDB; full JSON export/import, per-table CSV export
- **Charts:** Recharts — weight trend, protein adherence, dose timeline
- **AI:** Anthropic Messages API called directly from the client; key held in local settings, only ever sent to api.anthropic.com. Default model: `claude-sonnet-5`
- **No backend.** Static hosting or run locally — fothing server-side to maintain

## The 6-month map

**Weeks 1–4 · Transition & Stabilise**
Baselines, settle onto retatrutide titration, build the logging habit. Success = logging streak + side-effect stability.

**Weeks 5–18 · Maximum Fat Loss**
Deficit + protein + training. Success = 0.5–1%/wk loss, protein at target 5+ days/wk, 2+ resistance sessions/wk.

**Weeks 19–26 · Maintenance Rehearsal**
Practise maintenance-calorie eating while still on the drug. Success = weight stable ±1 kg over 4 weeks with habits intact.

## Modules

### 1 · Dose & Titration Tracker
- Doctor-prescribed schedule entered as steps (dose, start date, duration) — handles the tirzepatide→retatrutide transition exactly as prescribed
- Seeded plan (your prescriber's guide): retatrutide 4 mg → 8 mg → 12 mg. Step durations stay unset until you confirm each step-up with your doctor; a "readiness for step-up" card summarises your last 2 weeks of side-effect data as material for that conversation
- One-tap injection logging with rotating site suggestions; weekly injection reminders via local notifications
- Side-effect diary: quick-pick symptoms + severity slider
- Correlation view: side effects overlaid on the dose timeline — clustering after a step-up triggers a "worth raising with your prescriber" banner

### 2 · Lean Mass Defense
- Daily protein ring — default target 1.6–2.2 g/kg of goal weight, exact number set with your doctor or dietitian
- Bundled minimal-effective-dose resistance template (2–3 full-body sessions/wk); any workout loggable
- Exercise recommendation engine (phase-aware): a weekly "this week's training" card — Phase 1 builds the habit (2 easy resistance sessions + daily step target), Phase 2 adds progressive-overload prompts and zone-2 cardio with deload suggestions after high-fatigue weeks, Phase 3 locks in the frequency that survives discontinuation. Adapts down on rough weeks — a 15-minute fallback session instead of guilt
- One-tap logging from the recommended session (pre-filled), or free-form for anything else; steps entered as a daily number
- Weight, waist, optional body-fat % — fat-vs-lean trend, not just scale weight
- Lean-mass alert: losing faster than ~1%/wk for 2+ weeks, or protein adherence under 60% during rapid loss, surfaces a countermeasure card

### 3 · Nutrition & Deficit Console
- Favourites grid, recents, one-tap protein portions; custom entries need only kcal + protein — the two levers that matter
- Food-type quality signal: one-tap type tags on each meal roll up into a daily traffic-light bar — green (lean protein, fibre-rich veg, whole grains: maximum satiety per calorie), amber (refined carbs, moderate fat), red (greasy/fried, sugary, carbonated, alcohol — the classic GLP-1 nausea and reflux triggers)
- Food ↔ side-effect correlation: if nausea or reflux repeatedly follows a food type, the app names it ("nausea followed high-fat meals 4 of the last 5 times")
- Hydration as a first-class tracker: daily water target (default 2.5–3 L) with one-tap logging and its own dashboard ring — thirst cues are blunted alongside appetite, and dehydration drives the fatigue, headaches and constipation people blame on the drug
- Protein-first eating-order prompts, fibre reminders, and a minimum-food-floor warning if intake runs very low 3+ days — an underfuelling flag to discuss with your doctor

### 4 · Evidence Library
- Offline, plain-English trial summaries with strength badges (Strong / Moderate / Emerging / Insufficient) and citations: retatrutide phase 2 & TRIUMPH, SURMOUNT-1/-4 (incl. withdrawal regain data), STEP 1 extension, lean-mass countermeasures
- Supplement evidence in a deficit context: creating, vitamin D, omega-3, magnesium
- Ancillary peptides summarised neutrally with evidence ratings and regulatory status — framed as discussion prompts for your prescriber, no dosing information
- Every entry ends with suggested questions to ask your doctor

### 5 · Phase Planner
- The 6-month map above, with dates aligned to your doctor's plan
- Titration steps (4 → 8 → 12 mg) render as markers on the phase timeline, visible against the fat-loss phases they land in
- Dashboard shows current phase, days remaining, and that phase's success criteria as the week's focus

### 6 · Dashboard
One screen: 7-day smoothed weight trend with phase bands · protein ring · hydration ring · today's food-quality bar · training streak with this week-s recommended session · current dose and next injection · days to next phase · latest coach headline · quick actions for logging weight, meals, water, injections, workouts.

### 7 · AI Coach (weekly review)
- On demand or Sunday prompt — sends a structured 4-week stats snapshot to Claude
- Report covers: what went well, plateau analysis (true plateau vs water/glycogen noise), adherence feedback, next week's phase-appropriate focus, and suggested questions for your doctor
- Hard rules: never suggests dose changes, never recommends starting a compound, always routes medical decisions to the prescriber; red-flag symptoms surface as "contact your doctor promptly"

## Data model

```
settings      { key, value }
doses         { id, date, compound, doseMg, site, notes }
sideEffects   { id, date, symptom, severity(1-5), notes }
weights       { id, date, kg, waistCm?, bodyFatPct? }
meals         { id, date, name, kcal, proteinG, typeTag?, isFavourite }
water         { id, date, ml }
workouts      { id, date, type, exercises?, durationMin, notes }
compounds     { id, name, prescribed, scheduleText, startDate, endDate? }
coachReports  { id, weekStart, inputSnapshot, reportMd }
```

## Privacy & non-functional

- All data stays on-device; the only outbound traffic is your user-initiated Claude API call. No analytics, no telemetry
- One-tap full backup export; banner if no export in 14 days
- Fully offline except the AI coach; metric default with imperial toggle; dashboard interactive in under a second on a mid-range phone

## Build execution — locked, single shot

- One continuous build of the full v1 in dependency order: schema → logging loops → derived stats and alerts → phase planner → evidence library → AI coach → PWA polish
- Hosting: GitHub Pages via GitHub Actions deploy on push; Cameron connects the remote. App data stays on-device regardless
- Evidence library: drafted in-build with load-bearing numbers web-verified; anything unverifiable is badged for follow-up
- Style: clean clinical-calm — soft neutral ground, one calm teal accent, large tabular numerics, dark mode, generous touch targets
- Done means verified: all logging loops exercised in the browser, production build passing, PWA installability confirmed, export/import round-tripped

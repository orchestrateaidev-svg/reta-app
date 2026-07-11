# Retatrutide Companion — Build Specification v1.0

**Locked:** 2026-07-11 · **Owner:** Cameron · **Status:** Ready to build

## 1. Purpose

A personal, private companion app for a 6-month prescribed GLP-1 program (transition from tirzepatide to retatrutide). The app's job is to maximise fat loss, minimise lean-mass loss, and rehearse the habits that keep weight off after discontinuation — the three things the trial literature says actually determine long-term outcomes.

**Design principle (non-negotiable):** the prescribing doctor is the source of truth for all dosing. The app tracks prescribed schedules, correlates data, and surfaces published evidence with "discuss with your prescriber" framing. It never generates or suggests doses for retatrutide or any ancillary compound.

## 2. Locked decisions

| Decision | Choice |
|---|---|
| Platform | PWA (installable on phone + PC), offline-first |
| Data | Local-only — IndexedDB on device, JSON/CSV export for backup. No accounts, no cloud DB |
| AI coaching | Built in via Claude API — user supplies their own Anthropic API key, stored locally |
| Data entry | Quick manual logging (tap-first UX, favourites, one-tap portions) |
| Peptide scope | Evidence library with strength ratings + tracking of anything the doctor prescribes |

## 3. Tech stack

- **Frontend:** React 18 + TypeScript + Vite, Tailwind CSS
- **PWA:** vite-plugin-pwa (service worker, installable, offline shell)
- **Storage:** Dexie.js over IndexedDB; export/import as JSON; CSV export per table
- **Charts:** Recharts (weight trend, protein adherence, dose timeline)
- **AI:** Anthropic Messages API called directly from the client (`anthropic-dangerous-direct-browser-access` header) with user's key held in IndexedDB, never transmitted anywhere except api.anthropic.com. Model: `claude-sonnet-5` for weekly reviews (cost-efficient), configurable
- **No backend.** Nothing to deploy server-side; host static build on any static host or run locally

## 4. Data model (Dexie tables)

```
settings        { key, value }                      // API key, units, targets, phase dates
doses           { id, date, compound, doseMg, site, notes }   // compound = retatrutide | tirzepatide | other-prescribed
sideEffects     { id, date, symptom, severity(1-5), notes }
weights         { id, date, kg, waistCm?, bodyFatPct? }
meals           { id, date, name, kcal, proteinG, typeTag?, isFavourite }   // typeTag = leanProtein|vegFibre|wholeCarb|dairy|highFat|sugary|carbonated|alcohol
water           { id, date, ml }
workouts        { id, date, type(resistance|cardio|steps), exercises?[], durationMin, notes }
compounds       { id, name, prescribed(bool), scheduleText, startDate, endDate? }
coachReports    { id, weekStart, inputSnapshot, reportMd }
```

Derived (computed, not stored): 7-day smoothed weight, weekly rate of loss (%/wk), protein streak, training streak, estimated lean-mass trend proxy (weight vs waist divergence).

## 5. Modules

### 5.1 Dose & Titration Tracker
- Enter the doctor-prescribed schedule as a series of steps (dose, start date, duration). Handles the tirzepatide→retatrutide transition (washout/overlap exactly as prescribed).
- **Seeded plan (Cameron's prescriber guide):** retatrutide 4 mg → 8 mg → 12 mg. Step durations deliberately unset — each step-up is confirmed in-app only after the user marks it as agreed with the doctor (default suggestion shown as "typical trial protocol held each step ~4 weeks — confirm timing with your prescriber"). A "readiness for step-up" card summarises the last 2 weeks of side-effect data before each planned escalation, as material for that conversation.
- Injection logging: one tap from the dashboard — date auto-filled, rotating site suggestion (abdomen L/R, thigh L/R), notes.
- Reminders via PWA local notifications (weekly injection day, configurable).
- Side-effect diary: quick-pick common symptoms (nausea, constipation, fatigue, injection-site reaction, reflux, dizziness) + severity slider.
- **Correlation view:** side-effect frequency/severity overlaid on the dose timeline. If severity ≥4 or symptoms cluster within 72h of a step-up → banner: "Worth raising with your prescriber."

### 5.2 Lean Mass Defense
- Protein target: default 1.6–2.2 g/kg of goal body weight, user sets exact number with doctor/dietitian. Big daily ring on dashboard.
- Resistance program: bundled minimal-effective-dose template (2–3 full-body sessions/wk, 6 movement patterns, progressive overload prompts). User can log any workout; template is optional.
- **Exercise recommendation engine (phase-aware):** a weekly "this week's training" card, driven by phase and recent logs — never generic:
  - Phase 1: establish the habit — 2 resistance sessions/wk at easy loads + daily step target (default 7,000, user-set).
  - Phase 2: 2–3 resistance sessions/wk with progressive overload prompts ("add 2.5kg or 1 rep vs last session") + 2 zone-2 cardio blocks or step target; deload suggestion after any week flagged high-fatigue in the side-effect diary.
  - Phase 3: maintain resistance frequency (the strongest predictor of keeping fat off post-drug) + build the cardio habit that survives discontinuation.
  - Recommendations adapt down, not just up: missed sessions or high-severity side-effect days produce a shorter fallback session ("15-minute minimum session") rather than guilt.
- Logging: one-tap from the recommended session (pre-filled), or free-form for anything else (type, duration, exercises/loads optional). Steps entered manually as a daily number.
- Body composition: weight (daily or ad hoc), waist weekly, body-fat % optional (manual entry from any smart scale).
- **Lean-mass alert:** if rate of loss exceeds ~1%/wk for 2+ weeks OR protein adherence <60% during rapid loss → nudge card explaining the lean-mass risk and what to do.

### 5.3 Nutrition & Deficit Console
- Quick logging: favourites grid, recent meals, one-tap protein portions (e.g. "shake 30g", "chicken breast 40g"), custom entry with kcal + protein only (deliberately simple — protein and energy are the two levers that matter here).
- **Food-type quality signal:** every logged meal gets an optional one-tap type tag — lean protein / veg & fibre / whole carb / dairy / high-fat or fried / sugary / carbonated / alcohol. The app renders a traffic-light quality bar for the day:
  - **Green (prioritise):** lean protein, fibre-rich vegetables, whole grains, low-fat dairy — these maximise satiety per calorie and protect lean mass.
  - **Amber (moderate):** refined carbs, moderate-fat meals.
  - **Red (known GLP-1 aggravators):** greasy/fried and very high-fat foods, large sugary hits, carbonated drinks, alcohol — the most common nausea/reflux triggers on GLP-1s and the fastest way to waste a suppressed appetite on low-satiety calories.
- **Food-type ↔ side-effect correlation:** red-tagged meals are correlated against the side-effect diary; if nausea/reflux repeatedly follows a food type, the app names it ("nausea followed high-fat meals 4 of the last 5 times").
- **Hydration tracker (first-class, not a nudge):** daily water target (default 2.5–3 L, user-set), one-tap glass/bottle logging, its own dashboard ring alongside protein. Escalating reminders if behind pace by mid-afternoon — dehydration is a leading cause of GLP-1 fatigue, headaches, dizziness and constipation, and thirst cues are blunted when appetite is suppressed.
- Fibre reminder (constipation is the most common failure mode) and protein-first eating-order prompt at logged mealtimes.
- "Minimum food floor" warning if logged intake is very low for 3+ days (underfuelling flag → discuss with doctor).

### 5.4 Evidence Library
- Bundled, offline, plain-English summaries with evidence-strength badges (Strong / Moderate / Emerging / Insufficient) and citations:
  - Retatrutide phase 2 (Jastreboff 2023) and TRIUMPH program status
  - Tirzepatide SURMOUNT-1/-4 (incl. SURMOUNT-4 withdrawal/regain data)
  - Semaglutide STEP 1 extension (regain after discontinuation — the "why maintenance rehearsal exists" evidence)
  - Lean mass loss on GLP-1s; protein + resistance training countermeasures
  - Creatine, vitamin D, omega-3, magnesium (supplement evidence in a deficit context)
  - Commonly discussed ancillary peptides — summarised neutrally with evidence ratings (mostly Emerging/Insufficient) and regulatory status, framed as discussion prompts for the prescriber
- Every entry ends with suggested questions to ask the doctor. No dosing information for non-prescribed compounds.

### 5.5 Phase Planner (the 6-month map)
- **Phase 1 — Transition & Stabilise (weeks 1–4):** establish baselines, settle onto retatrutide titration, build logging habit. Success = logging streak + side-effect stability.
- **Phase 2 — Maximum Fat Loss (weeks 5–18):** deficit + protein + training. Success = 0.5–1%/wk loss with protein ≥ target 5+ days/wk and 2+ resistance sessions/wk.
- **Phase 3 — Maintenance Rehearsal (weeks 19–26):** deliberately practise maintenance-calorie eating while still on the drug; lock habits before discontinuation. Success = weight stable ±1kg across 4 weeks with habits intact.
- Phase dates are user-set (aligned to doctor's plan); dashboard shows current phase, days remaining, and the phase-specific success criteria as the week's focus.
- Titration steps render as markers on the phase timeline, so the 4→8→12 mg escalations are visible against the fat-loss phases they land in.

### 5.6 Dashboard (single screen)
Weight trend (7-day smoothed, phase bands shaded) · protein ring · **hydration ring** · **food-quality bar (today's green/amber/red mix)** · training streak + this week's recommended session · current dose + next injection · days into phase / to next phase · latest coach headline · quick actions (log weight / meal / water / injection / workout).

### 5.7 AI Coach (weekly review)
- Runs on demand or Sunday prompt. Sends a structured snapshot (last 4 weeks of derived stats — gever free-text medical identity data beyond what the user logged) to Claude with a fixed system prompt.
- Output: markdown report — what went well, plateau analysis (true plateau vs water/glycogen noise), protein/training adherence feedback, phase-appropriate focus for next week, and **suggested questions for the doctor** where relevant.
- Hard rules in the system prompt: never suggest dose changes, never recommend starting any compound, never contradict the prescriber, always route medical decisions to the doctor; flag red-flag symptoms (severe abdominal pain, persistent vomiting, signs of dehydration) as "contact your doctor promptly."
- Reports stored locally in `coachReports`; API key settable/clearable in Settings with a plain-language privacy note.

## 6. Non-functional requirements

- **Privacy:** all data on-device; only outbound traffic is the user-initiated Claude API call. No analytics, no telemetry.
- **Backup:** one-tap full JSON export (and import/restore); warning banner if no export in 14 days.
- **Offline:** everything except the AI coach works fully offline.
- **Units:** metric default (kg/cm), imperial toggle.
- **Performance:** dashboard interactive <1s on mid-range phone; all writes optimistic.

## 7. Build execution (locked 2026-07-11 — single-shot build)

The milestone plan is superseded: **full v1 is built in one continuous pass**, all modules, in dependency order (schema → logging loops → derived stats/alerts → phase planner → evidence library → AI coach → PWA polish).

Locked build decisions:
- **Hosting:** GitHub Pages. Git repo initialised in this folder; deploy via GitHub Actions on push (`vite build` with correct `base` path). Cameron connects the GitHub remote. App data remains on-device regardless of hosting.
- **Scope:** everything in this spec, one shot. No deferred modules.
- **Evidence library:** summaries drafted during the build with the load-bearing numbers and citations web-verified at build time (trial results, regain data, protein/training evidence). Anything not verifiable gets an explicit "verify with your prescriber/source" badge.
- **Visual style:** clean clinical-calm — soft neutral ground, single calm teal/green accent, large readable numerics (tabular), generous touch targets, full dark-mode support. Data-forward, no gamification chrome.
- **Verification before done:** app runs locally, all logging loops exercised end-to-end in the browser, production build passes, PWA installability checked (manifest + service worker), export/import round-trips.

## 8. Out of scope (v1)

Cloud sync, wearable/HealthKit integration, photo meal estimation, multi-user, medication interaction checking, and any feature that generates dosing advice.

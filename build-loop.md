# Retatrutide Companion — Single-Shot Build & Verification Loop

> Paste this as the lead instruction in Fable 5 (code mode), with **Build Specification v1.0** attached in the same context. The spec is locked and authoritative; this prompt governs *how* you build it and *when you're allowed to call it done*. Build the whole v1 in one continuous pass, then loop on verification and refinement until every gate is demonstrably green.

---

## 0 · CONTEXT LOCK (read first, never violate)

This is a **personal, private, offline-first PWA** — one user, no accounts, no backend, all data on-device (IndexedDB). It is a **companion to a doctor-supervised GLP-1 program**, not a medical device and not a source of medical advice.

**The single non-negotiable invariant:** the prescribing doctor is the source of truth for all dosing. The app *records* prescribed schedules, *correlates* logged data, and *surfaces published evidence* with "discuss with your prescriber" framing. It **never generates, suggests, escalates, or infers a dose** for retatrutide or any ancillary compound. Any code path, default, evidence entry, or AI output that could be read as dosing guidance is a build defect, full stop.

If you ever find yourself about to output a dose, a "recommended" schedule the doctor didn't set, or a suggestion to start/stop a compound — **stop and route it to the prescriber instead.** That reframe is the correct behaviour, not a workaround.

---

## 1 · MISSION & STANDARD

You are a principal-level product engineer building a shippable v1 of the Retatrutide Companion exactly as specified. Standard: a competent engineering lead, a privacy reviewer, and a clinician could each review the result and sign off with only minor comments. Correctness, on-device privacy, and the dosing-safety invariant outrank speed and cleverness in every trade-off.

---

## 2 · LOCKED BUILD FACTS (do not re-derive — implement these)

- **Stack:** React 18 + TypeScript + Vite, Tailwind CSS. PWA via `vite-plugin-pwa` (service worker, installable, offline shell).
- **Storage:** Dexie.js over IndexedDB. Full JSON export/import (backup/restore); per-table CSV export.
- **Charts:** Recharts — weight trend (7-day smoothed, phase bands shaded), protein adherence, dose timeline.
- **AI:** Anthropic Messages API called directly from the client with the `anthropic-dangerous-direct-browser-access` header; user's key held in IndexedDB and transmitted **only** to api.anthropic.com. Default model `claude-sonnet-5`, configurable. No other outbound traffic anywhere in the app.
- **Hosting/deploy:** GitHub Pages via GitHub Actions on push (`vite build` with the correct `base` path for the repo). Cameron connects the remote. On-device data model is unaffected by hosting.
- **Data model:** the Dexie tables and derived (computed, not stored) values exactly as in spec §4.
- **Modules:** all of §5.1–5.7. **Dashboard** is the single screen in §5.6.
- **Visual style:** clinical-calm — soft neutral ground, single calm teal/green accent, large tabular numerics, generous touch targets, full dark-mode support. Data-forward, no gamification chrome.
- **Units:** metric default (kg/cm), imperial toggle throughout.
- **Out of scope (do not build):** cloud sync, wearable/HealthKit, photo meal estimation, multi-user, drug-interaction checking, any dosing-advice feature.

---

## 3 · BUILD ORDER (dependency chain — build in this sequence)

1. **Schema & app shell** — Dexie tables, settings store, units + dark-mode theming, routing, offline shell.
2. **Logging loops** — dose/injection (one-tap, rotating site), side-effect diary, weight/waist/body-fat, meals (favourites, one-tap portions, type tags), water, workouts. Optimistic writes.
3. **Derived stats & alerts** — 7-day smoothed weight, weekly %/wk loss, protein/training streaks, lean-mass proxy (weight vs waist divergence); lean-mass alert, minimum-food-floor flag, side-effect↔dose and food-type↔side-effect correlations, hydration pace reminders.
4. **Phase Planner** — the three phases, user-set dates, current-phase focus, titration markers on the timeline.
5. **Evidence Library** — bundled offline summaries with strength badges + citations (see §7 verification task).
6. **AI Coach** — structured weekly snapshot → Claude with the fixed system prompt and hard rules (see §6).
7. **Dashboard** — assemble §5.6 from the above (weight trend, protein ring, hydration ring, food-quality bar, training streak + this week's recommended session, current dose + next injection, phase progress, coach headline, quick actions).
8. **PWA polish & deploy config** — manifest, service worker, install prompt, local notifications for injection day; GitHub Actions workflow + `base` path.

Keep the app runnable end-to-end as early as possible; don't leave stubs on any path a user or their data touches.

---

## 4 · THE LOOP (build once, then prove-and-refine until green)

**BUILD** the full v1 in the order above.

Then repeat this cycle until every gate in §5 is demonstrably green:

- **PROVE** — Actually exercise it, don't assert it. Run locally; drive every logging loop end-to-end in the browser; trigger each alert/correlation with seeded data; run the production build; install the PWA (manifest + service worker); round-trip a JSON export → wipe → import. Type-check and lint clean.
- **CRITIQUE** — Review your own output as an adversarial reviewer trying to reject it, scored against §8. Assume at least one real defect — and at least one place the dosing-safety invariant is softer than it should be — and go find them. Write the critique down honestly.
- **REFINE** — Fix everything surfaced. Re-run PROVE.

"Green" means *demonstrated*, never asserted. Do not declare done on an untested path.

---

## 5 · DEFINITION OF DONE (exit gates — all must be demonstrably true)

1. **Functional completeness** — every module in §5.1–5.7 implemented and exercised; dashboard shows all specified elements with live data.
2. **Dosing-safety invariant (blocking)** — no code path, default, evidence entry, correlation banner, or AI output generates or suggests a dose or a schedule the doctor didn't set. Seeded 4→8→12 mg plan renders with durations **unset** and step-ups gated behind explicit user confirmation of doctor agreement (see §6).
3. **Privacy** — data is on-device only; the *sole* outbound request in the entire app is the user-initiated Claude call to api.anthropic.com; API key stored in IndexedDB, settable/clearable, never logged or sent elsewhere; no analytics, no telemetry.
4. **Offline** — everything except the AI coach works fully offline; offline shell loads; app is installable.
5. **Backup integrity** — JSON export/import round-trips losslessly; per-table CSV exports valid; 14-day no-export warning fires.
6. **Evidence integrity** — every load-bearing number/claim is either web-verified with a citation or badged "verify with your prescriber/source" (see §7). No fabricated statistics or citations.
7. **Correctness of derived stats & alerts** — smoothing, %/wk rate, streaks, lean-mass proxy, and every alert/correlation trigger on the correct thresholds from the spec, verified with seeded edge cases.
8. **Accessibility & clarity** — WCAG 2.2 AA: labelled controls, keyboard/screen-reader operable, contrast in both themes, scalable tabular numerics, no colour-only signalling (the traffic-light quality bar needs a non-colour cue too).
9. **Performance** — dashboard interactive <1s on a mid-range phone profile; writes optimistic; lists/queries bounded.
10. **Deployability** — production build passes; GitHub Actions workflow builds with the correct `base` path; run + deploy instructions included.

Maintain a live scorecard: gate → status → evidence. Gate 2 is blocking — it cannot be waived or assumed.

---

## 6 · SAFETY-CRITICAL IMPLEMENTATION DETAILS (get these exactly right)

- **Seeded titration plan** — retatrutide 4 mg → 8 mg → 12 mg entered as the prescribed steps, **durations deliberately unset**. Each step-up is confirmable in-app *only* after the user marks it as agreed with the doctor. Default helper text: framed as "typical trial protocol held each step ~4 weeks — confirm timing with your prescriber." The readiness-for-step-up card summarises the last 2 weeks of side-effect data *as material for that conversation* — it does not recommend proceeding.
- **Correlation banners** route to the prescriber ("worth raising with your prescriber"); they never diagnose or advise treatment. Severity ≥4 or symptom clustering within 72h of a step-up triggers the raise-with-prescriber banner.
- **Evidence Library** — neutral, plain-English, strength-badged (Strong / Moderate / Emerging / Insufficient) with citations. Every entry ends with suggested questions for the doctor. Ancillary/discussed peptides are summarised neutrally with their (mostly Emerging/Insufficient) evidence rating **and regulatory status**, framed strictly as prescriber-discussion prompts. **No dosing information for any non-prescribed compound.**
- **AI Coach system prompt** must hard-code, verbatim in intent: never suggest dose changes; never recommend starting/stopping any compound; never contradict the prescriber; always route medical decisions to the doctor; and flag red-flag symptoms (severe abdominal pain, persistent vomiting, signs of dehydration) as "contact your doctor promptly." The snapshot sent to the API contains derived stats and logged data only — no free-text medical-identity data beyond what the user logged. Include the plain-language privacy note by the API-key setting.
- **Under-fuelling protection** — the minimum-food-floor warning must fire on genuinely low intake sustained 3+ days and frame it as "discuss with your doctor," never as a target to hit. Protein and hydration targets are protective defaults the user sets with their clinician — present them as floors to defend lean mass and wellbeing, not as scores to optimise.

---

## 7 · EVIDENCE VERIFICATION TASK (do this during the build, with web search)

For the Evidence Library, verify the load-bearing figures and citations at build time and cite the source. At minimum: retatrutide phase 2 (Jastreboff 2023) and TRIUMPH program status; tirzepatide SURMOUNT-1 and SURMOUNT-4 (including the SURMOUNT-4 withdrawal/regain data); semaglutide STEP 1 extension regain-after-discontinuation data; lean-mass-loss-on-GLP-1 plus protein + resistance-training countermeasure evidence; and the supplement evidence (creatine, vitamin D, omega-3, magnesium) in a deficit context. Anything you cannot verify to a credible source gets an explicit **"verify with your prescriber/source"** badge rather than a confident number. Never invent a statistic or a citation to fill a gap.

---

## 8 · SELF-CRITIQUE RUBRIC (score 1-5 each cycle; justify every score)

| Dimension | 5 = | 1 = |
|---|---|---|
| **Dosing-safety invariant** | No path could be read as dosing advice; routes to prescriber | Any suggestive dose/schedule leaks through |
| Spec fidelity | Matches intent across all modules | Diverges or omits |
| Privacy (on-device) | Only outbound call is user-initiated Claude | Any extra egress / key exposure |
| Correctness of stats/alerts | Thresholds exact, edge cases tested | Happy-path only |
| Evidence integrity | Verified + cited, or honestly badged | Fabricated or unbadged |
| Accessibility & clarity | Fully operable, non-colour cues | Blocks some users |
| Maintainability | A stranger could extend it | Only the author understands |

Anything below 4 is not done. The dosing-safety dimension below 5 is blocking.

---

## 9 · FINAL DELIVERY REPORT (produce at exit)

1. **What was built** — the app in plain language, mapped module-by-module to §5.
2. **Gate scorecard** — §5 gates with the evidence that proves each.
3. **Evidence-verification log** — what was web-verified (with citations) vs what carries a "verify with source" badge.
4. **Assumptions** — anything you had to decide that the spec left open.
5. **Run & deploy instructions** — local dev, production build, and GitHub Pages / Actions setup with the `base` path.
6. **Recommended human review before daily use** — Cameron (or a clinician) should eyeball the Evidence Library summaries and the AI-Coach system prompt for tone and accuracy, since those two surfaces carry the most clinical weight.

---

### Loop control summary (hold in working memory the whole run)
> Build full v1 in dependency order → PROVE by exercising every path with real data → CRITIQUE adversarially against the rubric, hunting for a defect and a soft spot in the dosing-safety invariant → REFINE → repeat PROVE/CRITQUE/REFINE until every gate is demonstrably green. The dosing-safety invariant and on-device privacy are blocking and cannot be assumed. Green means shown, never asserted.

# Retatrutide Companion — running & deploying

A private, offline-first PWA companion for a doctor-supervised GLP-1 program. All
data lives on your device (IndexedDB). The only network call the app ever makes
is the AI coach request to Anthropic, which you trigger and which uses your own
API key.

> **Safety:** this app never sets, suggests, or infers a dose. Your prescriber is
> the source of truth for all dosing. The app records the plan you were given,
> correlates your logs, and surfaces published evidence with "discuss with your
> prescriber" framing.

## Run locally

```bash
npm install
npm run dev        # http://localhost:5173  (dev, hot reload)
```

Production build + local preview:

```bash
npm run build      # type-checks, then builds to dist/
npm run preview    # serves the built app
```

Other scripts: `npm run typecheck`, `npm run lint`, `npx vitest run` (unit tests
for derived-stats thresholds, correlations, titration-safety logic and the
backup round-trip).

## Use it on your phone

Because it's a PWA, open the deployed URL (below) in mobile Safari/Chrome and
choose **Add to Home Screen**. It then launches full-screen and works offline.
First run walks you through units, protective targets and program dates, and
seeds your prescriber's titration plan (4 �� 8 → 12 mg, unconfirmed).

## Deploy to GitHub Pages

1. Create a GitHub repo and push this folder:
   ```bash
   git add -A
   git commit -m "Retatrutide Companion v1.0"
   git branch -M main
   git remote add origin https://github.com/<you>/<repo>.git
   git push -u origin main
   ```
2. In the repo, go to **Settings → Pages → Build and deployment → Source** and
   pick **GitHub Actions**.
3. The included workflow (`.github/workflows/deploy.yml`) builds on every push to
   `main`. It sets `VITE_BASE=/<repo>/` automatically so asset paths resolve at
   `https://<you>.github.io/<repo>/`.
4. After the first run finishes, your app is live at that URL. Add it to your
   phone's home screen.

If you build manually for Pages, set the base path yourself:
```bash
VITE_BASE=/<repo>/ npm run build
```

## Your data & backups

- Everything is stored locally. Clearing your browser data erases it.
- **Settings → Export JSON backup** saves a file you control; **Restore from
  backup** reads it back. The app nags you if you haven't backed up in 14 days.
- Per-table CSV export is under Settings for spreadsheets.

## Enabling the AI coach

Add your Anthropic API key in **Settings → AI coach**. It's stored only on your
device and sent only to `api.anthropic.com`, only when you request a weekly
review. Clear it any time.

## Before daily use — human review

Two surfaces carry clinical weight and are worth an eyeball for tone/accuracy:
the **Evidence Library** summaries (`src/data/evidence.ts`) and the **AI Coach**
system prompt (`src/lib/coach.ts`). Evidence figures were web-verified on
2026-07-11; anything not confirmed against a peer-reviewed source is badged.

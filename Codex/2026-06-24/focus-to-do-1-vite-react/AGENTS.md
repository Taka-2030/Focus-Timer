# AGENTS.md - Focus Timer AI Team Guide

This file defines the working rules for developing Focus Timer with Codex.
When the user gives a short request, Codex should use this guide to plan,
implement, debug, review UI/UX, verify behavior, and report the result.

## 1. Product Direction

- Focus Timer is a Pomodoro, task, statistics, cookies, shop, timer design,
  background growth, boost, i18n, and PWA app.
- The product goal is to support study and work focus.
- The UI should feel calm, simple, focused, and mobile friendly.
- Game systems should encourage focused work, not idle farming.
- New features should be added incrementally without breaking existing flows.
- After implementation, `npm run build` should pass unless explicitly blocked.

## 2. Team Model

### User: Owner and Final Decision Maker

- Defines goals, priorities, and final approval.
- Decides between product directions when tradeoffs matter.

### Codex: AI Director and Implementation Lead

- Reads the request and breaks it into implementation tasks.
- Checks existing architecture before changing code.
- Handles implementation, debugging, UI review, UX review, and verification.
- Makes reasonable decisions when risk is low.
- Asks concise questions only when a product or data decision is truly blocked.

### Execution Sub-Roles

Codex should switch between these perspectives during work:

- Debug Lead: reproduce issues, inspect state, isolate root causes, check errors.
- UI Lead: layout, spacing, visual hierarchy, responsiveness, touch targets.
- UX Lead: focus flow, information density, user confusion, friction.
- Engineering Lead: React, JavaScript, CSS, Vite, PWA, services, data shape.
- QA Lead: build, smoke tests, regression checks, mobile behavior.

## 3. Core Engineering Rules

### Storage

- Do not call `localStorage` directly from components.
- Use `src/services/storageService.js` for app data access.
- Keep the structure easy to migrate to Firebase or Supabase later.

### i18n

- User-facing text should use `react-i18next` keys such as `t("timer.start")`.
- Update both `src/i18n/locales/ja.json` and `src/i18n/locales/en.json`
  when adding user-facing labels.
- Developer-only labels may be English-only when they are not user-facing.

### Timer Design System

- Keep timer logic shared.
- Keep `TimerRenderer` as the design switch layer.
- `RingTimer`, `FlipClockTimer`, and `WaterTimer` should be display-only.
- Do not duplicate start, pause, reset, or completion logic in timer designs.
- Visual animation changes must not break timer accuracy.

### Cookies and Game System

- Cookies are earned only when a work timer completes.
- Pause, reset, break completion, or idle time must not grant cookies.
- Shop items and upgrades should support focus motivation.
- Avoid runaway reward growth or idle-game behavior.

### Background Growth System

- Background is determined mainly by `Growth Level x Theme`.
- Background should support focus and stay visually quiet.
- `BackgroundLayer` must not block input; keep `pointer-events: none`.
- Preview/debug tools must not accidentally mutate real progress data.

### Developer Panel and Production Debug

- Developer Panel is for development only.
- Production Debug Mode is enabled only by explicit URL state such as
  `?debug=true`.
- Production Debug must be read-only.
- Do not expose cookie grants, unlock-all, or reset actions in production debug.
- Mutating debug actions belong only in Developer Panel.

### PWA

- Keep Vercel compatibility.
- Do not break `vite-plugin-pwa`, manifest, service worker, or offline startup.
- Run `npm run build` after meaningful code changes.

## 4. UI and UX Rules

- The timer screen is the main focus surface.
- Keep the timer screen compact and avoid unnecessary details.
- Full Screen mode should show only the timer, current task, timer controls,
  and exit control unless the user asks otherwise.
- Mobile layouts should be checked first.
- Tap targets should be comfortable on iPhone-sized screens.
- Avoid nested cards and excessive decoration.
- Prefer calm, polished motion similar to native Apple apps or Notion.
- Visual effects should be smooth but not distracting.

## 5. Files to Check Before Larger Changes

When relevant, inspect:

- `docs/ARCHITECTURE.md`
- `docs/ROADMAP.md`
- `docs/GAME_SYSTEM.md`
- `src/main.jsx`
- `src/services/storageService.js`
- `src/services/backgroundService.js`
- `src/components/timerDesigns/TimerRenderer.jsx`
- `src/i18n/locales/ja.json`
- `src/i18n/locales/en.json`
- `src/styles.css`

## 6. Implementation Workflow

1. Read the relevant code and docs.
2. Identify the smallest safe implementation path.
3. Preserve existing data shape unless migration is necessary.
4. Implement with scoped changes.
5. Keep mobile layout and touch behavior in mind.
6. Add debug visibility only behind safe development or explicit debug gates.
7. Run build and any relevant smoke checks.
8. Report changed files, what changed, verification, and caveats.

## 7. Regression Checklist

For most changes, check the relevant subset:

- `npm run build` succeeds.
- `npm run dev` starts.
- Task add still works.
- Timer start, pause, reset still work.
- Timer Design switching still works.
- Cookies and Shop still work.
- Settings and i18n still work.
- Developer Panel remains development-only.
- Production Debug remains read-only.
- PWA configuration is not broken.
- Mobile layout does not overflow or block touch input.

## 8. Reporting Format

Use the user's requested report format when provided.
Otherwise, report in this compact shape:

```text
Changed Files
- ...

What Changed
- ...

Verification
- npm run build:
- npm run dev:
- Mobile:
- Existing features:

Notes
- ...
```

## 9. Short Requests Are Valid

The user may give short requests such as:

```text
Follow AGENTS.md and improve the Timer UI.
```

```text
Make Background Growth easier to inspect.
```

```text
The iPhone Task add flow is still suspicious. Find the cause.
```

For these requests, Codex should infer the needed investigation, implementation,
UI/UX review, debugging, verification, and final report from this file.

# UX Audit — Focus.One (Nov 16, 2025)

## Test Setup
- Local dev build via `npm run dev` at commit on Nov 16 2025.
- Seed data: default demo goals (2 active).
- Devices simulated: desktop 1440 px, laptop 1280 px, tablet 834 px, mobile 390 px (Safari/Chrome equivalents via responsive mode).
- Pages covered: `/classic` shell (timeline + goal library), filters sidebar, integrations modal, milestone drawer.

## Executive Summary
- **Navigation legibility & spacing**: Uppercase pills with extreme letter-spacing clip characters (“Da hboard”), increasing cognitive load and failing WCAG for readability (`app/globals.css`).
- **Timeline ergonomics**: Wheel/trackpad events are hijacked, preventing normal vertical scrolling and making today/milestone controls hard to use on touchpads (`components/Timeline.tsx`).
- **Goal list whitespace**: Layout reserves a second 260 px column that’s never rendered, leaving a blank rail instead of helpful context (`app/globals.css` + `GoalsList`).
- **Filter chips**: Count badges sit outside the chip hit area, so tapping “Open 2” on mobile is fiddly and the number inherits muted contrast.
- **Milestones & reminders**: Milestone editing still lives inside the goal editor (duplicate UX with the panel) and the integrations modal can’t actually verify Google creds without better API errors.
- **Responsive behaviour**: At ≤960 px the sidebar stacks but timelines/goal cards remain desktop-sized, forcing horizontal panning and overlapping controls.

## Detailed Findings

### 1. Navigation & Account Shell
- **Unreadable nav labels (Med)** — The masthead buttons use `letter-spacing:.18em` and `text-transform:uppercase`, so words visually drop letters (“Work pace”, “Da hboard”). This fails 3:1 contrast once characters thin out and looks broken in screenshots. Source:

```201:214:app/globals.css
.workspace__nav-btn{
  ...
  letter-spacing:.18em;
  text-transform:uppercase;
}
```

  - *Impact*: Navigation looks corrupted on every breakpoint, first impression suffers.
  - *Fix idea*: Switch to mixed-case labels, reduce spacing, and reuse pill tokens for other shell links (Workspace/Dashboard/Quarterly review, control-centre links).

- **Account cluster misaligned (Low)** — `workspace__account` mixes avatar, text and icon buttons without a shared baseline; icons float because no consistent padding/rings. Needs shared pill buttons + hover/focus styles.

### 2. Timeline
- **Wheel hijacking locks the page (High)** — Two overlapping `wheel` handlers convert any horizontal delta into forced scroll and `preventDefault`, so common vertical trackpad gestures stop propagating; the page cannot scroll while hovering the timeline grid (`components/Timeline.tsx` lines 527‑599).

```527:599:components/Timeline.tsx
rowsEl.addEventListener("wheel", forwardWheel, { passive: false });
...
viewportEl.addEventListener("wheel", handleWheel, { passive: false });
event.preventDefault();
viewportEl.scrollLeft += horizontalDelta;
```

  - *Impact*: UX feels “stuck”; keyboard/PageDown ends up the only way to reach the goal list.
  - *Fix*: Allow normal vertical scroll, only translate deliberate Shift+wheel or trackpad horizontal gestures, and avoid calling `preventDefault` unless necessary.

- **Overloaded bars (Med)** — Goal bars still render status, priority, category AND outside labels. With <220 px width, labels overlap bars and tooltips hide key info; yet hover already shows the data. Simplify to label + outline color derived from `getStatusColor`.

- **Today marker not keyboard-friendly (Low)** — The “Today” element is rendered as a `div` with `role="button"` but no `onKeyDown`, so keyboard users cannot activate it to jump/focus despite `tabIndex={0}`.

- **Redundant density control (Low)** — Timeline exposes Comfort/Balanced/Compact chips even though the goal list has its own density toggle; they fight for vocabulary and confuse new users.

### 3. Goal List & Right Rail
- **Dead 260 px column (Med)** — `.goal-layout` always allocates `grid-template-columns: minmax(0,1fr) 260px` while `GoalsList` never renders `.goal-layout__milestones`; users see a blank gutter on the right instead of helpful summaries.

```2463:2477:app/globals.css
.goal-layout{
  display:grid;
  grid-template-columns:minmax(0,1fr) 260px;
}
...
.goal-layout__milestones{ min-width:0; }
```

  - *Impact*: Wasted space on desktop, yet no contextual tools (progress stats, quick actions) for goals.
  - *Fix*: Either collapse to single column or actually populate the rail with status tallies / quick shortcuts as requested.

- **Mixed ordering (Low)** — “Chronological” mode isn’t actually guaranteed: `sortedItems` only reverses when `desc`, but defaults to insertion order from context. Need explicit sort by start date.

- **Inline density toggle remnants (Low)** — Comments reference “comfort” density yet there’s no UI; timeline still shows Comfort/Balanced/Compact causing mismatch.

### 4. Filters & Search
- **Badge touch targets (Med)** — Status/category chips render counts outside of the pill hit area (`chip__count` is separate), so tapping the number doesn’t toggle filters and on mobile the number clips. Need inline badges.

```121:118:components/GoalFilters.tsx
{typeof count === "number" && <span className="chip__count">{count}</span>}
```

- **Reset button truncation (Low)** — “Reset” label shows as “Re et” with the current letter-spacing, same readability issue as nav.

### 5. Milestones
- **Editor + drawer duplication (Med)** — Goal editors still show milestone fields, yet we also introduced a separate `MilestonesPanel`. Users must hunt between two places; edits via panel don’t reflect inline until closing/reopening.
- **No drag affordance (Low)** — Drawer lists milestones but cannot adjust timeline overlays directly (dragging only works on main bars), so “window” vs “point” editing isn’t intuitive.

### 6. Integrations & Notifications
- **API happy-path only (Med)** — `/api/notifications/send-test` bombs with 500 whenever `GMAIL_USER` isn’t in envs, even if the user provides credentials in the request. The modal instructions suggest that providing fields is enough, so the server message (“Missing Gmail credentials…”) feels like a crash. Need clearer validation (400 for missing email, 422 for missing creds) and structured error details.
- **No toast/loader sharing (Low)** — The “Send test reminder” button disables but there’s no inline loader/toast pattern elsewhere; consider shared notification component so success/error is consistent.

### 7. Responsive / Accessibility
- **Two-column lock until 960 px (Med)** — `.workspace__layout` only collapses at 960 px, but timeline toolbar keeps a fixed 24 px padding and 3-column button rows, causing chips to wrap unevenly and forcing horizontal scrolling on iPad Mini (834 px test).
- **Keyboard gaps (Low)** — Many clickable divs (grid menu trigger, milestone overlay) rely on mouse events only; `button` semantics should cover them.

## Next Steps
- Prioritize timeline scroll fix and navigation readability (highest visual regressions).
- Fold right-rail content into the existing blank column with summaries + quick actions, responsive down to 1024 px.
- Align chip tokens (inline badges) and remove redundant density toggles.
- Split milestone editing fully into the dedicated panel + timeline overlay controls.
- Harden the Gmail reminder endpoint (structured errors, env fallback) and surface status via shared toast/banner.

Document prepared Nov 16 2025 — ready for implementation phase.


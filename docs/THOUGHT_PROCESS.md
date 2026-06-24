# Thought Process Sheet — Queue Cure

## The problem, restated

A clinic's queue today is a stack of paper slips and a receptionist
shouting names. Two things are actually missing: **a shared source of
truth** (so the waiting room doesn't have to ask "is it my turn yet?") and
**an honest estimate of how long that takes** (so "2–3 hours, we don't
know" becomes a number). Everything below was built around those two gaps
specifically, not around "build a queue app" in the abstract.

## Architecture, in one paragraph

`QueueManager` (`backend/src/queueManager.js`) is a single class holding
all state in memory — patients, the token counter, and a rolling history of
real consultation durations — with zero knowledge of HTTP or sockets. The
Express routes in `routes/api.js` are thin: validate input, call a
`QueueManager` method, hand the result to a `broadcast()` helper. That
helper emits one specific event (`patient:added`, `token:called`, …) and
then *always* follows it with `queue:update`, the full computed snapshot.
Both screens render entirely from `queue:update`; the specific events exist
only so a screen could add a toast or a sound later without diffing two
snapshots. This split — one method that owns the truth, a thin transport
layer on top — is what made the logic unit-testable without a server, a
browser, or a network connection (see `backend/src/queueManager.js`'s
header comment and the 10-case test suite we ran against it during build).

## Wait time: computed from real data, not hardcoded

This was the criterion we designed around most deliberately. The naive
version — `tokensAhead × (a number someone typed in once)` — is exactly the
"zero visibility" problem the brief opens with, just moved into the app.
Instead:

- Every time **Call Next** closes out a consultation, the server measures
  the actual wall-clock time that patient spent in `in-consultation`
  (`calledAt` → now) and pushes it into a rolling window of the **last 12
  real consultations** (`historySize` in `QueueManager`).
- The effective average is the mean of that window. The receptionist's
  manual "average consultation time" setting is used **only** before the
  first real consultation of the day has completed — a cold-start fallback,
  not the steady-state source of truth. The UI is explicit about which one
  is currently driving the numbers (`averageSource: 'live-data' |
  'manual-default'`, surfaced on the Settings card).
- Each waiting patient's estimate is `tokensAhead × effectiveAverageMinutes`,
  recomputed fresh into every snapshot — never stored, so it can't go
  stale.
- Implausible durations (a demo click closing a consultation in under a
  second, or a duration over 3 hours from a forgotten browser tab) are
  excluded from the rolling window so one bad data point can't skew the
  estimate for the next ten patients.

A rolling window rather than an all-day average is the one judgment call
here worth flagging: it means the estimate adapts if a clinic gets slower
after lunch, at the cost of being noisier with very few samples early in
the day. For a single-clinic queue, "adapts to right now" felt like the
better trade than "perfectly smooth but stale."

## Concurrency

Two places this actually matters:

**Two receptionists, or one fast double-click, hitting Call Next near-
simultaneously.** `QueueManager.callNext()` runs synchronously start to
finish — no `await` anywhere in its body. Node's event loop guarantees a
synchronous function can't be interrupted mid-way by another request, so
two `POST /api/call-next` calls that arrive a millisecond apart are still
executed one after the other, never interleaved; there's no window where
both could read "current patient = Aman" and both try to advance off of
that same state. The `_callLock` flag in the class is a second, more
explicit guard — it can't actually trigger today given the synchronous
guarantee above, but it's there on purpose: the moment this in-memory store
is swapped for a real database (see Roadmap), `callNext()` will need an
`await` for the write, and at that point the lock becomes load-bearing
instead of decorative. We'd rather ship the guard now than remember to add
it under deadline later. On the frontend, the Call Next button additionally
disables itself for the duration of its own request — cheap, and it stops
an impatient double-click from ever generating a second HTTP request in
the first place.

**Multiple waiting-room screens.** Nothing here assumes exactly one Screen
2. `io.emit(...)` broadcasts to every connected socket, so a TV in the
lobby and a patient's phone and a second monitor at the front desk all stay
in sync off the same events, with no special-casing.

## Edge cases we specifically built for

| Case | Behavior |
|---|---|
| Call Next with an empty queue | Button disables itself (`hasNothingToDo`); the API returns a clean state with `currentToken: null` rather than erroring |
| Blank or whitespace-only patient name | Rejected client-side (button stays disabled) and server-side (`400` with a clear message) — never silently swallowed into a token slip with no name on it |
| Rapid double-click on Call Next / Add Patient | Frontend disables the button for the in-flight request; backend's synchronous critical section (above) makes it safe even if a request slips through |
| A patient who never shows up | "Skip" marks them `skipped` and removes them from the live queue and its wait-time math, without deleting their record |
| A screen reconnecting after a dropped connection | Re-hydrates over `GET /api/queue` on every `connect` event rather than trusting the socket to have replayed what it missed — sockets fundamentally can't replay history, so this has to be a REST fallback, not a retry policy |
| Server restart | All state is in memory by design for this prototype (see Roadmap) — this is a known, documented limitation, not an oversight |
| Cold start, zero consultations completed yet | Estimates fall back to the receptionist's manual average rather than dividing by zero or showing a blank |
| Patient adds, but consultation time guess is wildly off (e.g. instant double-click during a demo) | Implausible durations are filtered out of the rolling average (see above) |

## Making the receptionist screen fast and mistake-proof

- The name field re-focuses itself the instant a patient is successfully
  added, so a receptionist can add five people back-to-back without
  touching the mouse.
- The Add button is disabled until there's a non-whitespace name — there's
  no way to submit an empty token.
- Every mutating action (add, call next, skip, set average) shows its own
  inline loading and error state rather than a global spinner, so one slow
  request never blocks the rest of the screen.
- Errors are rendered in the interface's voice, in place, next to the
  control that caused them — not a toast that's already gone by the time
  you look up.

## Design notes

The brief's own language — "paper token slips" — became the visual
anchor: the "Now Serving" card and the small token badges throughout both
screens are styled as a digital stand-in for that paper stub (circular
notches cut into the card edges, a dashed seam), rather than a generic
dashboard card. Numerals use a monospace face (Space Mono) so token numbers
line up like a departure board; everything else uses Inter for density and
legibility on the receptionist's working screen. The palette is a clinical
teal/mint rather than a generic SaaS blue or a clichéd dark-mode-with-neon
look, with one warm amber accent reserved for the single action that
matters most — Call Next — so it's never ambiguous what to press next.

## What we'd build next (production roadmap)

This is a working prototype, not a production deployment, on purpose —
the brief asks for a working prototype plus a thought process, not a
hardened system. Honest next steps, roughly in order:

1. **Persistence.** Swap the in-memory `Map` in `QueueManager` for
   SQLite/Postgres so a server restart doesn't lose the day's queue. The
   class boundary was drawn specifically so this doesn't touch routes or
   sockets.
2. **Multi-clinic / multi-counter support.** Today's model is one queue;
   real clinics often have multiple doctors. The natural extension is a
   `counterId` on each patient and a `QueueManager` per counter.
3. **Auth on the receptionist screen.** Screen 2 is meant to be public (a
   lobby TV); Screen 1 currently isn't gated at all, which is fine for a
   demo and wrong for production.
4. **A daily reset job** instead of the manual `/api/reset` utility route.
5. **Sound/visual alert on the waiting-room screen** when a patient's own
   token is called, using the specific `token:called` event that's already
   being broadcast and currently unused by the UI.
6. **SMS-when-near-your-turn**, using the phone field that's already
   collected but not yet acted on.

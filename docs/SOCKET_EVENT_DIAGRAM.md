# Socket Event Diagram

This is the exact sequence of HTTP and Socket.io traffic behind the one
feature the brief weights highest: **both screens updating the instant
"Call Next" is clicked, with no refresh.**

A rendered copy is at [`socket-event-diagram.png`](./socket-event-diagram.png).
The source below renders natively if you're reading this on GitHub.

```mermaid
sequenceDiagram
    autonumber
    participant R as Receptionist screen<br/>(Screen 1)
    participant S as Express API +<br/>Socket.io server
    participant Q as QueueManager<br/>(in-memory state)
    participant W as Waiting room screen(s)<br/>(Screen 2, any number)

    Note over R,W: On page load — both screens hydrate over plain REST first
    R->>S: GET /api/queue
    S-->>R: snapshot JSON
    W->>S: GET /api/queue
    S-->>W: snapshot JSON
    R-)S: socket connects
    W-)S: socket connects
    S--)R: queue:update (immediate re-sync)
    S--)W: queue:update (immediate re-sync)

    rect rgb(232, 245, 240)
    Note over R,W: Flow A — Receptionist adds a patient
    R->>S: POST /api/patients { name, phone }
    S->>Q: addPatient()
    Q-->>S: new patient created
    S-->>R: 201 Created { patient }
    S--)R: emit patient:added
    S--)W: emit patient:added
    S--)R: emit queue:update (full snapshot)
    S--)W: emit queue:update (full snapshot)
    Note right of W: Queue length + estimated waits<br/>update with no page refresh
    end

    rect rgb(251, 234, 209)
    Note over R,W: Flow B — Receptionist clicks "Call Next"
    R->>S: POST /api/call-next
    S->>Q: callNext()
    Q->>Q: complete current patient,<br/>record real consultation duration,<br/>promote next waiting patient
    Q-->>S: { calledPatient, previousPatient }
    S-->>R: 200 OK { calledPatient, previousPatient }
    S--)R: emit token:called
    S--)W: emit token:called
    S--)R: emit queue:update (full snapshot)
    S--)W: emit queue:update (full snapshot)
    Note right of W: "Now Serving" flips live on every<br/>connected screen at the same instant
    end

    rect rgb(255, 255, 255)
    Note over R,W: Reconnect safety net
    W--xS: connection drops (wifi blip, tab backgrounded)
    Note right of W: any events fired while<br/>disconnected are missed —<br/>sockets do not replay history
    W-)S: socket reconnects
    W->>S: GET /api/queue (re-hydrate over REST)
    S-->>W: current snapshot
    Note right of W: screen is correct again,<br/>independent of what it missed
    end
```

## Why REST *and* sockets, not sockets alone

REST is the source of truth for **state on load and on reconnect**.
Socket.io is the channel for **live deltas while connected**. A socket-only
design looks identical in a demo but silently breaks the first time a
screen's wifi blips — it has no way to ask "what did I miss?" Sockets don't
replay history, so the fix is structural, not a retry loop: always hydrate
over REST first, then trust the socket only for as long as it's actually
connected (see the `connect`/`reconnect` handling in
[`useQueueSocket.js`](../frontend/src/hooks/useQueueSocket.js)).

## Event reference

| Event | Direction | Fired when | Payload | Who listens |
|---|---|---|---|---|
| `patient:added` | server → all clients | A new patient is added to the queue | `{ patient }` | Either screen, for toast/sound hooks |
| `token:called` | server → all clients | "Call Next" is clicked | `{ calledPatient, previousPatient }` | Either screen, for toast/sound hooks |
| `patient:skipped` | server → all clients | A waiting patient is marked no-show | `{ patient }` | Either screen |
| `settings:updated` | server → all clients | Receptionist sets the average consultation time | `{ manualAverageMinutes }` | Receptionist screen |
| `queue:reset` | server → all clients | Queue is reset (demo/admin utility) | `{}` | Either screen |
| `queue:update` | server → all clients | **After every event above, always** | full snapshot (see below) | Both screens render entirely from this — the specific events above are optional enrichment, never required for correctness |
| `connect` / `disconnect` | built-in (Socket.io) | Transport-level | — | Drives the "Live" / "Reconnecting…" badge on both screens |

`queue:update` payload shape (from `QueueManager.getSnapshot()`):

```jsonc
{
  "currentToken": { "id": "...", "tokenNumber": 4, "name": "Ananya", "status": "in-consultation", "calledAt": "..." } | null,
  "waiting": [
    { "id": "...", "tokenNumber": 5, "name": "Priya", "tokensAhead": 0, "estimatedWaitMinutes": 4, "status": "waiting" }
  ],
  "queueLength": 3,
  "averageConsultationMinutes": 4.2,
  "averageSource": "live-data" | "manual-default",
  "manualAverageMinutes": 5,
  "sampleSize": 7,
  "totalServedToday": 12,
  "updatedAt": "2026-06-21T09:41:03.000Z"
}
```

Sending the **full snapshot** on every change — rather than having each
screen patch its own local state from small deltas — is a deliberate
simplification: there is exactly one place (`getSnapshot()`) that computes
"what should be on screen right now," so the receptionist desk and every
waiting-room display are mathematically guaranteed to agree. The cost is a
slightly larger payload (still under 2KB for a realistic queue); for a
single-clinic queue that trade is an easy one.

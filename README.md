# Queue Cure

A live token queue for clinics, built for **Queue Cure '26**: a
receptionist desk view and a patient waiting-room display that stay in
sync the instant a token is called — no refresh, on either screen.

> **Before you submit:** replace the bracketed placeholders below
> (`[ ... ]`) with your own repo URL, demo link, and team name. Nothing in
> this codebase contains anyone's name.

- 🎥 Demo video / live link: `[add yours here]`
- 📄 Thought process: [`docs/THOUGHT_PROCESS.md`](docs/THOUGHT_PROCESS.md)
- 🔌 Socket event diagram: [`docs/SOCKET_EVENT_DIAGRAM.md`](docs/SOCKET_EVENT_DIAGRAM.md)

---

## What this is

| | Screen 1 — Receptionist | Screen 2 — Waiting room |
|---|---|---|
| Route | `/receptionist` | `/waiting-room` |
| Does | Add patient, call next token, set average consultation time, skip no-shows | Shows current token being seen, tokens ahead, estimated wait, "find my token" lookup |
| Updates | Live, via Socket.io | Live, via Socket.io |

Both screens are tabs in the same app **and** standalone routes — open
`/receptionist` on the front-desk computer and `/waiting-room` full-screen
on a lobby TV, and they'll independently stay live against the same
backend.

## Tech stack

- **Backend:** Node.js, Express, Socket.io, in-memory data store
- **Frontend:** React (Vite), React Router, Tailwind CSS, Socket.io-client, Axios, lucide-react
- **No database** in this prototype, by design — see
  [`docs/THOUGHT_PROCESS.md`](docs/THOUGHT_PROCESS.md#what-wed-build-next-production-roadmap)
  for the persistence plan

## Project structure

```
queue-cure/
├── backend/
│   ├── server.js                  # Express + Socket.io entry point
│   └── src/
│       ├── queueManager.js        # All queue logic — framework-agnostic, unit-tested
│       ├── routes/api.js          # REST endpoints
│       └── socket/socketHandlers.js
├── frontend/
│   └── src/
│       ├── pages/                 # ReceptionistPage.jsx, WaitingRoomPage.jsx
│       ├── components/            # AddPatientForm, NowServingCard, QueueTable, etc.
│       ├── hooks/useQueueSocket.js  # Shared live-state hook (REST hydrate + socket deltas)
│       └── api/                   # REST client + socket client
└── docs/
    ├── THOUGHT_PROCESS.md
    └── SOCKET_EVENT_DIAGRAM.md (+ rendered .png)
```

## Quick start

Requires Node.js 18+.

**Fastest path** (runs both servers together):

```bash
npm install
npm run install:all
npm run dev
```

This starts the API on `http://localhost:4000` and the app on
`http://localhost:5173`. Open the latter — Vite proxies API and socket
traffic to the backend automatically, so there's nothing else to
configure for local development.

**Manual path** (two terminals, if you'd rather not use the root scripts):

```bash
# Terminal 1
cd backend
npm install
cp .env.example .env
npm run dev

# Terminal 2
cd frontend
npm install
npm run dev
```

Then visit `http://localhost:5173/receptionist` and, in a second tab or
device, `http://localhost:5173/waiting-room`. Add a patient on the first
screen and click **Call Next** — the second screen updates immediately.

## Environment variables

| File | Variable | Default | Purpose |
|---|---|---|---|
| `backend/.env` | `PORT` | `4000` | API/socket port |
| `backend/.env` | `CLIENT_ORIGIN` | `http://localhost:5173` | CORS allow-list, comma-separated |
| `backend/.env` | `DEFAULT_CONSULTATION_MINUTES` | `5` | Cold-start fallback only — overridden by real data after the first consultation, see the thought process doc |
| `frontend/.env` | `VITE_API_URL` | _(empty → relative, dev-proxied)_ | Set this when frontend and backend are deployed on different domains |

## REST API

| Method | Path | Body | Does |
|---|---|---|---|
| GET | `/api/queue` | — | Full current snapshot (used for initial load + reconnect resync) |
| POST | `/api/patients` | `{ name, phone? }` | Add a patient, returns their token |
| POST | `/api/call-next` | — | Completes the current token (if any), promotes the next waiting patient |
| POST | `/api/patients/:id/skip` | — | Marks a waiting patient as a no-show |
| PUT | `/api/settings/average-time` | `{ minutes }` | Sets the manual fallback average consultation time |
| GET | `/api/tokens/:tokenNumber` | — | Public lookup for "find my token" |
| POST | `/api/reset` | — | Clears the queue (demo/admin utility) |

Full Socket.io event reference: [`docs/SOCKET_EVENT_DIAGRAM.md`](docs/SOCKET_EVENT_DIAGRAM.md).

## Deploying

Backend and frontend deploy independently:

1. **Backend** → any Node host (Render, Railway, Fly.io). Set `CLIENT_ORIGIN`
   to your deployed frontend's URL.
2. **Frontend** → `npm run build --prefix frontend` produces a static
   `frontend/dist`, deployable to Vercel/Netlify/any static host. Set
   `VITE_API_URL` to your deployed backend's URL at build time.

## Testing

`QueueManager` (the module the live-sync and wait-time scoring criteria
depend on most) is framework-agnostic on purpose, so it can be exercised
with plain Node + `assert`, no test runner required:

```bash
cd backend
node test/queueManager.test.js
```

Covers: token sequencing, call-next state transitions, the real-data
rolling average (and its fallback to the manual default before any
consultation has completed), skip/no-show, an emptied queue, input
validation, and the rolling-window cap.

## License

MIT.

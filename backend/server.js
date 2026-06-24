require('dotenv').config();

const express = require('express');
const http = require('http');
const cors = require('cors');
const { Server } = require('socket.io');

const { QueueManager } = require('./src/queueManager');
const { registerSocketHandlers } = require('./src/socket/socketHandlers');
const { createApiRouter } = require('./src/routes/api');

const PORT = process.env.PORT || 4000;
const CLIENT_ORIGIN = (process.env.CLIENT_ORIGIN || 'http://localhost:5173').split(',');
const DEFAULT_CONSULTATION_MINUTES = Number(process.env.DEFAULT_CONSULTATION_MINUTES) || 5;

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: CLIENT_ORIGIN, methods: ['GET', 'POST', 'PUT'] },
});

app.use(cors({ origin: CLIENT_ORIGIN }));
app.use(express.json());

// Single in-memory source of truth for the whole process.
// Swap this for a database-backed implementation later without touching
// routes or sockets — see README "Going to production".
const queueManager = new QueueManager({ defaultConsultationMinutes: DEFAULT_CONSULTATION_MINUTES });

const { EVENTS, broadcast } = registerSocketHandlers(io, queueManager);
app.use('/api', createApiRouter(queueManager, broadcast, EVENTS));

app.get('/', (req, res) => {
  res.json({ name: 'Queue Cure API', status: 'running' });
});

// Centralized error handler — every route's thrown errors land here so the
// client always gets a consistent { error: string } JSON shape.
app.use((err, req, res, next) => { // eslint-disable-line no-unused-vars
  const status = err.status || 500;
  if (status >= 500) console.error(err);
  res.status(status).json({ error: err.message || 'Something went wrong' });
});

server.listen(PORT, () => {
  console.log(`Queue Cure API listening on http://localhost:${PORT}`);
  console.log(`Accepting Socket.io connections from: ${CLIENT_ORIGIN.join(', ')}`);
});

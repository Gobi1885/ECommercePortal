/**
 * All socket event names live in one place so the server code and the
 * Socket Event Diagram (docs/SOCKET_EVENT_DIAGRAM.md) never drift apart.
 */
const EVENTS = {
  PATIENT_ADDED: 'patient:added',
  TOKEN_CALLED: 'token:called',
  PATIENT_SKIPPED: 'patient:skipped',
  SETTINGS_UPDATED: 'settings:updated',
  QUEUE_RESET: 'queue:reset',
  QUEUE_UPDATE: 'queue:update', // canonical full snapshot, sent after every change above
};

function registerSocketHandlers(io, queueManager) {
  io.on('connection', (socket) => {
    console.log(`[socket] client connected: ${socket.id} (${io.engine.clientsCount} online)`);

    // Immediate hydration for this socket only — belt-and-suspenders on top
    // of the frontend's REST fetch-on-mount, see THOUGHT_PROCESS.md.
    socket.emit(EVENTS.QUEUE_UPDATE, queueManager.getSnapshot());

    socket.on('disconnect', (reason) => {
      console.log(`[socket] client disconnected: ${socket.id} (${reason})`);
    });
  });

  // Broadcast helper: emits a specific event with its own payload, then the
  // canonical full snapshot every screen renders from. Specific events let a
  // client play a sound / show a toast without re-deriving "what changed"
  // from a diff of two snapshots.
  function broadcast(eventName, payload) {
    io.emit(eventName, payload);
    io.emit(EVENTS.QUEUE_UPDATE, queueManager.getSnapshot());
  }

  return { EVENTS, broadcast };
}

module.exports = { registerSocketHandlers, EVENTS };

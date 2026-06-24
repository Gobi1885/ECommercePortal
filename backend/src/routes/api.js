const express = require('express');

function createApiRouter(queueManager, broadcast, EVENTS) {
  const router = express.Router();

  router.get('/health', (req, res) => {
    res.json({ ok: true, time: new Date().toISOString() });
  });

  // ---- Screen 2 / Screen 1 shared read: full current state ----
  router.get('/queue', (req, res) => {
    res.json(queueManager.getSnapshot());
  });

  // ---- Screen 1: Add patient ----
  router.post('/patients', (req, res, next) => {
    try {
      const { name, phone } = req.body || {};
      const patient = queueManager.addPatient({ name, phone });
      broadcast(EVENTS.PATIENT_ADDED, { patient });
      res.status(201).json({ patient, snapshot: queueManager.getSnapshot() });
    } catch (err) {
      next(err);
    }
  });

  // ---- Screen 1: Completed + skipped patients today (history tab) ----
  // Note: this route MUST be declared before /patients/:id/skip to prevent
  // the router from trying to match "history" as a patient id.
  router.get('/patients/history', (req, res) => {
    res.json({ patients: queueManager.getAllPatients() });
  });

  // ---- Screen 1: Skip / no-show a waiting patient ----
  router.post('/patients/:id/skip', (req, res, next) => {
    try {
      const patient = queueManager.skipPatient(req.params.id);
      broadcast(EVENTS.PATIENT_SKIPPED, { patient });
      res.json({ patient, snapshot: queueManager.getSnapshot() });
    } catch (err) {
      next(err);
    }
  });

  // ---- Screen 1: Call next token (the live-sync trigger) ----
  router.post('/call-next', (req, res, next) => {
    try {
      const result = queueManager.callNext();
      broadcast(EVENTS.TOKEN_CALLED, result);
      res.json({ ...result, snapshot: queueManager.getSnapshot() });
    } catch (err) {
      next(err);
    }
  });

  // ---- Screen 1: Set average consultation time ----
  router.put('/settings/average-time', (req, res, next) => {
    try {
      const minutes = queueManager.setManualAverageMinutes(req.body && req.body.minutes);
      broadcast(EVENTS.SETTINGS_UPDATED, { manualAverageMinutes: minutes });
      res.json({ manualAverageMinutes: minutes, snapshot: queueManager.getSnapshot() });
    } catch (err) {
      next(err);
    }
  });

  // ---- Screen 2: "Find my token" lookup, by public token number ----
  router.get('/tokens/:tokenNumber', (req, res) => {
    const patient = queueManager.findByToken(req.params.tokenNumber);
    if (!patient) {
      return res.status(404).json({ error: 'No patient found with that token number today' });
    }
    const snapshot = queueManager.getSnapshot();
    const waitingEntry = snapshot.waiting.find((p) => p.id === patient.id);
    res.json({
      tokenNumber: patient.tokenNumber,
      name: patient.name,
      status: patient.status,
      tokensAhead: waitingEntry ? waitingEntry.tokensAhead : null,
      estimatedWaitMinutes: waitingEntry ? waitingEntry.estimatedWaitMinutes : null,
    });
  });

  // ---- Demo / admin utility: start a fresh queue ----
  router.post('/reset', (req, res) => {
    queueManager.reset();
    broadcast(EVENTS.QUEUE_RESET, {});
    res.json({ snapshot: queueManager.getSnapshot() });
  });

  return router;
}

module.exports = { createApiRouter };

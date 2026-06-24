const { nanoid } = require('nanoid');

const STATUS = {
  WAITING: 'waiting',
  IN_CONSULTATION: 'in-consultation',
  COMPLETED: 'completed',
  SKIPPED: 'skipped',
};

/**
 * QueueManager owns all queue state and is the single source of truth.
 * It is deliberately framework-agnostic (no req/res, no sockets) so it can
 * be unit tested in isolation and reused if persistence is swapped in later.
 *
 * Concurrency note (see /docs/THOUGHT_PROCESS.md for the full write-up):
 * every mutating method below runs synchronously start-to-finish with no
 * `await` in the middle. Node's single-threaded event loop guarantees a
 * synchronous function body can never be interleaved with another request,
 * so two "Call Next" clicks arriving milliseconds apart are still handled
 * one at a time, in order, automatically. The `_callLock` flag is kept as
 * a defensive, self-documenting guard in case this method is ever made
 * async (e.g. once a real database replaces the in-memory Map).
 */
class QueueManager {
  constructor({ defaultConsultationMinutes = 5, historySize = 12 } = {}) {
    this.patients = new Map();
    this.tokenCounter = 0;
    this.currentTokenId = null;
    this.manualAvgMinutes = defaultConsultationMinutes;
    this.consultationDurationsMs = [];
    this.historySize = historySize;
    this._callLock = false;
  }

  // ---------- derived / read helpers ----------

  /** Real, data-driven average consultation time (minutes).
   *  Uses a rolling window of the last N *actual* consultation durations.
   *  Only falls back to the receptionist's manual setting before any
   *  consultation has ever completed (cold start with zero data). */
  getEffectiveAverageMinutes() {
    if (this.consultationDurationsMs.length === 0) {
      return this.manualAvgMinutes;
    }
    const avgMs =
      this.consultationDurationsMs.reduce((sum, ms) => sum + ms, 0) /
      this.consultationDurationsMs.length;
    return Math.max(avgMs / 60000, 0.5);
  }

  getWaitingPatientsSorted() {
    return [...this.patients.values()]
      .filter((p) => p.status === STATUS.WAITING)
      .sort((a, b) => a.tokenNumber - b.tokenNumber);
  }

  getCurrentPatient() {
    return this.currentTokenId ? this.patients.get(this.currentTokenId) : null;
  }

  findByToken(tokenNumber) {
    const n = Number(tokenNumber);
    return [...this.patients.values()].find((p) => p.tokenNumber === n) || null;
  }

  /** Returns all patients today in token order — used by the history tab.
   *  The caller can filter by status; we return everything so the UI can
   *  choose what to display without a second round-trip. */
  getAllPatients() {
    return [...this.patients.values()]
      .sort((a, b) => a.tokenNumber - b.tokenNumber)
      .map((p) => this._toPublic(p));
  }

  _toPublic(p) {
    return {
      id: p.id,
      tokenNumber: p.tokenNumber,
      name: p.name,
      status: p.status,
      addedAt: p.addedAt,
      calledAt: p.calledAt,
      completedAt: p.completedAt,
    };
  }

  /** Full state snapshot broadcast to both screens after every change. */
  getSnapshot() {
    const waiting = this.getWaitingPatientsSorted();
    const avgMinutes = this.getEffectiveAverageMinutes();
    const current = this.getCurrentPatient();

    const waitingWithEstimates = waiting.map((p, index) => ({
      ...this._toPublic(p),
      tokensAhead: index,
      estimatedWaitMinutes: Math.round(index * avgMinutes),
    }));

    return {
      currentToken: current ? this._toPublic(current) : null,
      waiting: waitingWithEstimates,
      queueLength: waiting.length,
      averageConsultationMinutes: Math.round(avgMinutes * 10) / 10,
      averageSource: this.consultationDurationsMs.length > 0 ? 'live-data' : 'manual-default',
      manualAverageMinutes: this.manualAvgMinutes,
      sampleSize: this.consultationDurationsMs.length,
      totalServedToday: [...this.patients.values()].filter((p) => p.status === STATUS.COMPLETED)
        .length,
      updatedAt: new Date().toISOString(),
    };
  }

  // ---------- mutations ----------

  addPatient({ name, phone }) {
    const trimmedName = (name || '').trim();
    if (!trimmedName) {
      throw httpError(400, 'Patient name is required');
    }
    if (trimmedName.length > 80) {
      throw httpError(400, 'Patient name is too long');
    }
    this.tokenCounter += 1;
    const patient = {
      id: nanoid(8),
      tokenNumber: this.tokenCounter,
      name: trimmedName,
      phone: (phone || '').trim() || null,
      status: STATUS.WAITING,
      addedAt: new Date().toISOString(),
      calledAt: null,
      completedAt: null,
    };
    this.patients.set(patient.id, patient);
    return this._toPublic(patient);
  }

  callNext() {
    if (this._callLock) {
      throw httpError(409, 'Another call-next request is already being processed');
    }
    this._callLock = true;
    try {
      const now = Date.now();
      const previous = this.getCurrentPatient();

      if (previous) {
        previous.status = STATUS.COMPLETED;
        previous.completedAt = new Date(now).toISOString();
        if (previous.calledAt) {
          const durationMs = now - new Date(previous.calledAt).getTime();
          // Guard against clock skew / instant demo-clicks polluting the average
          if (durationMs > 1000 && durationMs < 1000 * 60 * 180) {
            this.consultationDurationsMs.push(durationMs);
            if (this.consultationDurationsMs.length > this.historySize) {
              this.consultationDurationsMs.shift();
            }
          }
        }
      }

      const next = this.getWaitingPatientsSorted()[0] || null;
      if (next) {
        next.status = STATUS.IN_CONSULTATION;
        next.calledAt = new Date(now).toISOString();
        this.currentTokenId = next.id;
      } else {
        this.currentTokenId = null;
      }

      return {
        calledPatient: next ? this._toPublic(next) : null,
        previousPatient: previous ? this._toPublic(previous) : null,
      };
    } finally {
      this._callLock = false;
    }
  }

  skipPatient(id) {
    const patient = this.patients.get(id);
    if (!patient) throw httpError(404, 'Patient not found');
    if (patient.status !== STATUS.WAITING) {
      throw httpError(400, 'Only patients still waiting can be skipped');
    }
    patient.status = STATUS.SKIPPED;
    return this._toPublic(patient);
  }

  setManualAverageMinutes(minutes) {
    const n = Number(minutes);
    if (!Number.isFinite(n) || n <= 0 || n > 180) {
      throw httpError(400, 'Average consultation time must be a number between 0 and 180 minutes');
    }
    this.manualAvgMinutes = n;
    return this.manualAvgMinutes;
  }

  /** Clears all patients and resets counters. Used for demos / a fresh day. */
  reset() {
    this.patients.clear();
    this.tokenCounter = 0;
    this.currentTokenId = null;
    this.consultationDurationsMs = [];
  }
}

function httpError(status, message) {
  const err = new Error(message);
  err.status = status;
  return err;
}

module.exports = { QueueManager, STATUS };

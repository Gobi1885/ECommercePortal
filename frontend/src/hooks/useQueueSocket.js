import { useCallback, useEffect, useRef, useState } from 'react';
import { socket } from '../api/socket';
import { fetchQueue } from '../api/client';

/**
 * Both screens hydrate their initial state over plain REST (GET /api/queue)
 * rather than waiting on a socket event. This matters for one concrete edge
 * case: a socket event fired while a client was disconnected (phone screen
 * locked, wifi blip, the waiting-room TV rebooted) is gone forever — sockets
 * don't replay history. By treating REST as the source of truth on mount
 * AND on every `connect`/reconnect, a screen that was offline for a minute
 * still ends up showing the correct state the instant it's back, instead of
 * silently drifting. See docs/THOUGHT_PROCESS.md for the full discussion.
 */
export function useQueueSocket() {
  const [snapshot, setSnapshot] = useState(null);
  const [connected, setConnected] = useState(socket.connected);
  const [error, setError] = useState(null);
  const [lastEvent, setLastEvent] = useState(null);
  const mounted = useRef(true);

  const hydrate = useCallback(async () => {
    try {
      const data = await fetchQueue();
      if (mounted.current) {
        setSnapshot(data);
        setError(null);
      }
    } catch (err) {
      if (mounted.current) setError(err.message);
    }
  }, []);

  useEffect(() => {
    mounted.current = true;
    hydrate();

    const onConnect = () => {
      setConnected(true);
      hydrate(); // re-sync in case anything happened while we were offline
    };
    const onDisconnect = () => setConnected(false);
    const onQueueUpdate = (data) => setSnapshot(data);
    const flagEvent = (type) => (payload) =>
      setLastEvent({ type, payload, at: Date.now() });

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('queue:update', onQueueUpdate);
    socket.on('patient:added', flagEvent('patient:added'));
    socket.on('token:called', flagEvent('token:called'));
    socket.on('patient:skipped', flagEvent('patient:skipped'));
    socket.on('queue:reset', flagEvent('queue:reset'));

    return () => {
      mounted.current = false;
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('queue:update', onQueueUpdate);
      socket.off('patient:added');
      socket.off('token:called');
      socket.off('patient:skipped');
      socket.off('queue:reset');
    };
  }, [hydrate]);

  return { snapshot, connected, error, lastEvent, refetch: hydrate };
}

import { io } from 'socket.io-client';

// Passing `undefined` connects to the page's own origin, which is exactly
// what we want: the Vite dev proxy forwards /socket.io to the backend in
// development, and in a same-origin production deploy it just works. Set
// VITE_API_URL when the frontend and backend are deployed on different
// domains.
const url = import.meta.env.VITE_API_URL || undefined;

export const socket = io(url, {
  autoConnect: true,
  reconnection: true,
  reconnectionDelay: 800,
  reconnectionDelayMax: 5000,
  transports: ['websocket', 'polling'],
});

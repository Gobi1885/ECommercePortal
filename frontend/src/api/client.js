import axios from 'axios';

// Empty string -> relative URLs, handled by Vite's dev proxy locally and by
// same-origin hosting in production. Set VITE_API_URL to call a separately
// deployed backend instead (see .env.example).
const baseURL = `${import.meta.env.VITE_API_URL || ''}/api`;

export const api = axios.create({ baseURL, timeout: 8000 });

function unwrap(promise) {
  return promise.then((res) => res.data).catch((err) => {
    const message = err.response?.data?.error || err.message || 'Request failed';
    throw new Error(message);
  });
}

export const fetchQueue = () => unwrap(api.get('/queue'));

export const addPatient = (name, phone) => unwrap(api.post('/patients', { name, phone }));

export const callNext = () => unwrap(api.post('/call-next'));

export const skipPatient = (id) => unwrap(api.post(`/patients/${id}/skip`));

export const setAverageMinutes = (minutes) =>
  unwrap(api.put('/settings/average-time', { minutes }));

export const lookupToken = (tokenNumber) => unwrap(api.get(`/tokens/${tokenNumber}`));

export const resetQueue = () => unwrap(api.post('/reset'));

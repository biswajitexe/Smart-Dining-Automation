import { io } from 'socket.io-client';

const rawEnvSocket = import.meta.env.VITE_SOCKET_URL || import.meta.env.VITE_API_URL;
const SOCKET_URL = (rawEnvSocket && typeof rawEnvSocket === 'string' && rawEnvSocket.trim() !== '' && rawEnvSocket !== 'undefined')
  ? rawEnvSocket
  : 'https://smart-dining-automation-production.up.railway.app';

export const socket = io(SOCKET_URL.replace(/\/$/, ''), {
  autoConnect: true,
  transports: ['polling', 'websocket'],
  reconnection: true,
  reconnectionAttempts: Infinity,
  reconnectionDelay: 1000
});

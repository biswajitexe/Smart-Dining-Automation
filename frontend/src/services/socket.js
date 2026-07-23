import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || import.meta.env.VITE_API_URL || 'https://smart-dining-automation-production.up.railway.app';


export const socket = io(SOCKET_URL.replace(/\/$/, ''), {
  autoConnect: true,
  transports: ['websocket', 'polling']
});


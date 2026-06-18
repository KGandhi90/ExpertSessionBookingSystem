import { io } from 'socket.io-client'

const socketBaseUrl = (
  import.meta.env.VITE_SOCKET_URL ||
  import.meta.env.VITE_API_URL ||
  'http://localhost:5000'
).replace(/\/api\/?$/, '')

export const socket = io(socketBaseUrl, {
  transports: ['websocket', 'polling'],
  reconnectionAttempts: 10,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,
  autoConnect: true
})
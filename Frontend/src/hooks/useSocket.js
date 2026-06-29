import { useEffect, useRef } from 'react';
import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || (import.meta.env.VITE_API_BASE_URL ? import.meta.env.VITE_API_BASE_URL.replace('/api','') : 'http://localhost:3000');

export default function useSocket(user) {
  const socketRef = useRef(null);

  useEffect(() => {
    if (!user) return;
    const token = localStorage.getItem('token');
    const socket = io(SOCKET_URL, { auth: { token } });
    socketRef.current = socket;
    socket.on('connect', () => {
      socket.emit('join', user._id);
    });
    return () => {
      socket.disconnect();
    };
  }, [user]);

  return socketRef;
}

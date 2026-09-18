import { useState, useEffect } from 'react';
import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

export function useMarketSocket() {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [marketData, setMarketData] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const authOptions = (token && token !== 'null' && token !== 'undefined') ? { token } : {};

    const s = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      auth: authOptions
    });

    s.on('connect', () => {
      console.log('[SocketHook] Connected to real-time market feed');
      setIsConnected(true);
    });

    s.on('disconnect', () => {
      console.warn('[SocketHook] Disconnected from market feed');
      setIsConnected(false);
    });

    s.on('market:update', (data) => {
      setMarketData(data);
      setLastUpdated(new Date());
    });

    setSocket(s);

    return () => {
      s.disconnect();
    };
  }, []);

  return {
    socket,
    isConnected,
    marketData,
    lastUpdated
  };
}

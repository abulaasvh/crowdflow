import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';

interface WebSocketState {
  isConnected: boolean;
  crowdData: any[];
  stats: any | null;
  alerts: any[];
}

const WebSocketContext = createContext<WebSocketState | null>(null);

export function WebSocketProvider({ children }: { children: React.ReactNode }) {
  const [isConnected, setIsConnected] = useState(false);
  const [crowdData, setCrowdData] = useState<any[]>([]);
  const [stats, setStats] = useState<any | null>(null);
  const [alerts, setAlerts] = useState<any[]>([]);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    const socket = io('ws://localhost:4002', {
      transports: ['websocket'],
    });
    socketRef.current = socket;

    socket.on('connect', () => setIsConnected(true));
    socket.on('disconnect', () => setIsConnected(false));

    socket.on('crowd:update', (payload) => {
      setCrowdData(payload.zones);
      setStats(payload.stats);
    });

    socket.on('zone:alert', (data) => {
      setAlerts((prev) => [data, ...prev].slice(0, 30));
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  return (
    <WebSocketContext.Provider value={{ isConnected, crowdData, stats, alerts }}>
      {children}
    </WebSocketContext.Provider>
  );
}

export function useWebSocket() {
  const context = useContext(WebSocketContext);
  if (!context) throw new Error('useWebSocket must be used within WebSocketProvider');
  return context;
}

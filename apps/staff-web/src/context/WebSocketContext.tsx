/**
 * WebSocket Context
 *
 * Manages Socket.io connection to the crowd service.
 * Provides real-time crowd data to all dashboard components.
 */

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useRef,
  useCallback,
  type ReactNode,
} from 'react';
import { io, type Socket } from 'socket.io-client';
import type {
  CrowdDensity,
  CrowdStats,
  HeatmapFrame,
  QueueInfo,
  CrowdUpdatePayload,
  ZoneAlertPayload,
} from '@crowdflow/shared-types';
import { WS_CONFIG } from '@crowdflow/shared-types';

interface WebSocketState {
  isConnected: boolean;
  crowdData: CrowdDensity[];
  stats: CrowdStats | null;
  heatmap: HeatmapFrame | null;
  alerts: ZoneAlertPayload[];
  queueData: QueueInfo[];
  lastUpdate: string | null;
  acknowledgeAlert: (alertId: string) => void;
}

const defaultStats: CrowdStats = {
  totalAttendees: 0,
  totalCapacity: 50000,
  overallOccupancy: 0,
  zonesAtCapacity: 0,
  averageWaitTime: 0,
  activeAlerts: 0,
};

const WebSocketContext = createContext<WebSocketState | null>(null);

export function WebSocketProvider({ children }: { children: ReactNode }) {
  const [isConnected, setIsConnected] = useState(false);
  const [crowdData, setCrowdData] = useState<CrowdDensity[]>([]);
  const [stats, setStats] = useState<CrowdStats>(defaultStats);
  const [heatmap, setHeatmap] = useState<HeatmapFrame | null>(null);
  const [alerts, setAlerts] = useState<ZoneAlertPayload[]>([]);
  const [queueData, setQueueData] = useState<QueueInfo[]>([]);
  const [lastUpdate, setLastUpdate] = useState<string | null>(null);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    // In dev, Vite proxies /socket.io → crowd-service:4002
    // In production, set VITE_WS_URL to the actual crowd-service URL
    const wsUrl = import.meta.env.VITE_WS_URL || '';
    const token = localStorage.getItem('crowdflow_access_token');

    const socket = io(wsUrl, {
      auth: { token, role: 'STAFF' },
      transports: ['polling', 'websocket'],
      reconnection: true,
      reconnectionAttempts: WS_CONFIG.MAX_RECONNECT_ATTEMPTS,
      reconnectionDelay: WS_CONFIG.RECONNECT_BASE_DELAY_MS,
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      setIsConnected(true);
      console.log('🔌 WebSocket connected');
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
      console.log('🔌 WebSocket disconnected');
    });

    // Handle crowd updates (zones, stats, heatmap)
    socket.on('crowd:update', (data: CrowdUpdatePayload) => {
      setCrowdData(data.zones);
      setStats(data.stats);
      setHeatmap(data.heatmap);
      setLastUpdate(new Date().toISOString());
    });

    // Handle alerts
    socket.on('zone:alert', (data: ZoneAlertPayload) => {
      setAlerts((prev) => [data, ...prev].slice(0, 50)); // Keep last 50
    });

    // Handle queue updates — this is the key missing sync!
    socket.on('queue:update', (data: { queues: QueueInfo[] }) => {
      if (data && data.queues) {
        setQueueData(data.queues);
      }
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const acknowledgeAlert = useCallback((alertId: string) => {
    socketRef.current?.emit('alert:acknowledge', {
      alertId,
      staffId: 'current-staff-id',
    });
  }, []);

  return (
    <WebSocketContext.Provider
      value={{
        isConnected,
        crowdData,
        stats,
        heatmap,
        alerts,
        queueData,
        lastUpdate,
        acknowledgeAlert,
      }}
    >
      {children}
    </WebSocketContext.Provider>
  );
}

export function useWebSocket(): WebSocketState {
  const context = useContext(WebSocketContext);
  if (!context) throw new Error('useWebSocket must be used within WebSocketProvider');
  return context;
}


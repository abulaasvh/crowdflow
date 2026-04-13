import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  Dimensions,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import axios from 'axios';
import { useWebSocket } from '../context/WebSocketContext';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const ZONE_DEFS = [
  { id: 'gate-north', name: 'N. Gate', x: 33, y: 5, w: 17, h: 7 },
  { id: 'gate-south', name: 'S. Gate', x: 33, y: 88, w: 17, h: 7 },
  { id: 'gate-east', name: 'E. Gate', x: 88, y: 40, w: 7, h: 20 },
  { id: 'gate-west', name: 'W. Gate', x: 5, y: 40, w: 7, h: 20 },
  { id: 'section-a', name: 'Sec A', x: 18, y: 14, w: 48, h: 18 },
  { id: 'section-b', name: 'Sec B', x: 70, y: 28, w: 16, h: 44 },
  { id: 'section-c', name: 'Sec C', x: 14, y: 28, w: 16, h: 44 },
  { id: 'section-d', name: 'Sec D', x: 18, y: 68, w: 48, h: 18 },
];

export function MapScreen() {
  const { crowdData } = useWebSocket();
  const [selectedZone, setSelectedZone] = useState<string | null>(null);
  const [route, setRoute] = useState<string[]>([]);
  const [isNavigating, setIsNavigating] = useState(false);

  const mapSize = SCREEN_WIDTH - 40;

  const fetchRoute = async (targetId: string) => {
    setIsNavigating(true);
    try {
      const response = await axios.get(`http://localhost:4004/route`, {
        params: { start: 'gate-north', end: targetId }
      });
      setRoute(response.data.path);
    } catch (err) {
      console.warn('Failed to fetch route:', err);
    } finally {
      setIsNavigating(false);
    }
  };

  return (
    <View style={s.screen}>
      <Text style={s.title}>Stadium Map</Text>

      <View style={[s.mapContainer, { width: mapSize, height: mapSize }]}>
        <View style={s.field}>
          <Text style={s.fieldText}>Field</Text>
        </View>

        {ZONE_DEFS.map((zone) => {
          const density = crowdData.find((z) => z.zoneId === zone.id);
          const pct = Math.round((density?.occupancyRate || 0) * 100);
          const isInRoute = route.includes(zone.id);

          return (
            <TouchableOpacity
              key={zone.id}
              onPress={() => {
                setSelectedZone(zone.id);
                fetchRoute(zone.id);
              }}
              style={[
                s.zone,
                {
                  left: `${zone.x}%`,
                  top: `${zone.y}%`,
                  width: `${zone.w}%`,
                  height: `${zone.h}%`,
                  backgroundColor: isInRoute ? 'rgba(34, 197, 94, 0.6)' : pct > 80 ? 'rgba(239, 68, 68, 0.4)' : 'rgba(99, 102, 241, 0.2)',
                  borderColor: selectedZone === zone.id ? '#6366f1' : '#cbd5e1',
                  borderWidth: selectedZone === zone.id ? 2 : 1,
                },
              ]}
            >
              <Text style={s.zoneText}>{zone.name}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {selectedZone && (
        <View style={s.detailCard}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <Text style={s.detailName}>{selectedZone}</Text>
            {isNavigating && <ActivityIndicator size="small" />}
          </View>
          <Text style={s.detailStat}>
            Occupancy: {Math.round((crowdData.find(z => z.zoneId === selectedZone)?.occupancyRate || 0) * 100)}%
          </Text>
          {route.length > 0 && (
            <Text style={s.routeText}>📍 Path: {route.join(' → ')}</Text>
          )}
        </View>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#f8fafc', padding: 20 },
  title: { fontSize: 24, fontWeight: '800', color: '#1e293b', marginBottom: 20 },
  mapContainer: { alignSelf: 'center', backgroundColor: '#fff', borderRadius: 20, borderWidth: 1, borderColor: '#e2e8f0', overflow: 'hidden' },
  field: { position: 'absolute', left: '30%', top: '30%', width: '40%', height: '40%', backgroundColor: '#22c55e', borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  fieldText: { color: '#fff', fontWeight: '800' },
  zone: { position: 'absolute', justifyContent: 'center', alignItems: 'center', borderRadius: 4 },
  zoneText: { fontSize: 8, fontWeight: '600', color: '#475569' },
  detailCard: { marginTop: 20, padding: 16, backgroundColor: '#fff', borderRadius: 16, borderLeftWidth: 4, borderLeftColor: '#6366f1' },
  detailName: { fontSize: 16, fontWeight: '700', color: '#1e293b' },
  detailStat: { fontSize: 14, color: '#64748b', marginTop: 4 },
  routeText: { fontSize: 12, color: '#22c55e', marginTop: 8, fontWeight: '600' },
});

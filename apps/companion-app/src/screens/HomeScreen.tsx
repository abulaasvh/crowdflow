import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useWebSocket } from '../context/WebSocketContext';
import { useAuth } from '../context/AuthContext';

export function HomeScreen() {
  const { isConnected, crowdData, stats } = useWebSocket();
  const { user, logout } = useAuth();

  const hotZones = crowdData.filter(z => z.status === 'CRITICAL' || z.status === 'HIGH');

  return (
    <ScrollView style={s.screen} contentContainerStyle={{ paddingBottom: 20 }}>
      {/* Header */}
      <View style={s.header}>
        <View>
          <Text style={s.greeting}>Welcome back, {user?.displayName} 👋</Text>
          <Text style={s.title}>Dashboard</Text>
        </View>
        <TouchableOpacity onPress={logout} style={s.logoutBtn}>
          <Text>🚪</Text>
        </TouchableOpacity>
      </View>

      {!isConnected && <ActivityIndicator color="#6366f1" style={{ margin: 20 }} />}

      {/* Basic Stats */}
      <View style={s.statsGrid}>
        <View style={s.statCard}>
          <Text style={s.statLabel}>Attendance</Text>
          <Text style={s.statValue}>{stats?.totalAttendees?.toLocaleString() || '—'}</Text>
        </View>
        <View style={s.statCard}>
          <Text style={s.statLabel}>Occupancy</Text>
          <Text style={s.statValue}>{stats ? `${Math.round(stats.overallOccupancy * 100)}%` : '—'}</Text>
        </View>
      </View>

      {/* Quick Alert List */}
      {hotZones.length > 0 && (
        <View style={s.section}>
          <Text style={s.sectionTitle}>⚠️ High Density Areas</Text>
          {hotZones.map(z => (
            <View key={z.zoneId} style={s.alertRow}>
              <Text style={s.zoneName}>{z.zoneId}</Text>
              <Text style={{ color: '#ef4444' }}>{Math.round(z.occupancyRate * 100)}% full</Text>
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#f8fafc', padding: 20 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  greeting: { fontSize: 14, color: '#64748b' },
  title: { fontSize: 24, fontWeight: '800', color: '#1e293b' },
  logoutBtn: { padding: 10, backgroundColor: '#fff', borderRadius: 10, borderWidth: 1, borderColor: '#e2e8f0' },
  statsGrid: { flexDirection: 'row', gap: 12, marginBottom: 20 },
  statCard: { flex: 1, backgroundColor: '#fff', padding: 16, borderRadius: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 1 },
  statLabel: { fontSize: 12, color: '#94a3b8' },
  statValue: { fontSize: 20, fontWeight: '800', color: '#1e293b', marginTop: 4 },
  section: { marginTop: 10 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#1e293b', marginBottom: 10 },
  alertRow: { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: '#fff', padding: 12, borderRadius: 12, marginBottom: 8 },
  zoneName: { fontWeight: '600', color: '#1e293b' },
});

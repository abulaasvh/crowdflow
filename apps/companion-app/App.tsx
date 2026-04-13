import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Text, SafeAreaView } from 'react-native';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import { WebSocketProvider } from './src/context/WebSocketContext';
import { LoginScreen } from './src/screens/LoginScreen';
import { HomeScreen } from './src/screens/HomeScreen';
import { MapScreen } from './src/screens/MapScreen';
import { OrdersScreen } from './src/screens/OrdersScreen';

function MainNavigator() {
  const { isAuthenticated } = useAuth();
  const [tab, setTab] = useState('home');

  if (!isAuthenticated) return <LoginScreen />;

  return (
    <WebSocketProvider>
      <SafeAreaView style={s.container}>
        <View style={{ flex: 1 }}>
          {tab === 'home' && <HomeScreen />}
          {tab === 'map' && <MapScreen />}
          {tab === 'orders' && <OrdersScreen />}
        </View>

        {/* Tab Bar */}
        <View style={s.tabBar}>
          <TouchableOpacity onPress={() => setTab('home')} style={s.tab}>
            <Text style={[s.tabText, tab === 'home' && s.activeTab]}>🏠 Home</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setTab('map')} style={s.tab}>
            <Text style={[s.tabText, tab === 'map' && s.activeTab]}>🗺️ Map</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setTab('orders')} style={s.tab}>
            <Text style={[s.tabText, tab === 'orders' && s.activeTab]}>🍔 Food</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </WebSocketProvider>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainNavigator />
    </AuthProvider>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  tabBar: { flexDirection: 'row', height: 60, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#e2e8f0' },
  tab: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  tabText: { fontSize: 12, color: '#94a3b8' },
  activeTab: { color: '#6366f1', fontWeight: '700' },
});

import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  ActivityIndicator,
  StatusBar,
  Animated,
  Platform,
} from 'react-native';
import { useAuth } from '../context/AuthContext';

export function LoginScreen() {
  const { login, isLoading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);

  const handleLogin = () => {
    if (!email || !password) return;
    login(email, password);
  };

  return (
    <SafeAreaView style={s.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled">
        <View style={s.logoWrap}>
          <View style={s.logoCircle}>
            <Text style={s.logoEmoji}>🏟️</Text>
          </View>
          <Text style={s.brand}>CrowdFlow</Text>
          <Text style={s.tagline}>Smart Stadium Companion</Text>
        </View>

        <View>
          <Text style={s.label}>Email</Text>
          <View style={s.inputWrap}>
            <TextInput
              style={s.input}
              placeholder="you@example.com"
              placeholderTextColor="#94a3b8"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
            />
          </View>

          <Text style={[s.label, { marginTop: 16 }]}>Password</Text>
          <View style={s.inputWrap}>
            <TextInput
              style={s.input}
              placeholder="Enter password"
              placeholderTextColor="#94a3b8"
              secureTextEntry={!showPw}
              value={password}
              onChangeText={setPassword}
            />
            <TouchableOpacity onPress={() => setShowPw(!showPw)}>
              <Text>{showPw ? '🙈' : '👁️'}</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[s.button, (!email || !password) && { opacity: 0.5 }]}
            onPress={handleLogin}
            disabled={isLoading || !email || !password}
          >
            {isLoading ? <ActivityIndicator color="#fff" /> : <Text style={s.buttonText}>Sign In</Text>}
          </TouchableOpacity>

          {/* Demo Shortcuts */}
          <View style={s.demoWrap}>
            <Text style={s.demoLabel}>Demo Accounts:</Text>
            <View style={s.demoBtns}>
              <TouchableOpacity onPress={() => login('fan@stadium.com', 'fan_secret_456')} style={s.demoBtn}>
                <Text style={s.demoBtnText}>Attendee</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => login('staff@crowdflow.io', 'staff_secret_123')} style={s.demoBtn}>
                <Text style={s.demoBtnText}>Staff</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#ffffff' },
  scroll: { flexGrow: 1, justifyContent: 'center', padding: 24 },
  logoWrap: { alignItems: 'center', marginBottom: 40 },
  logoCircle: { width: 80, height: 80, borderRadius: 24, backgroundColor: '#eef2ff', justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  logoEmoji: { fontSize: 36 },
  brand: { fontSize: 32, fontWeight: '800', color: '#1e293b' },
  tagline: { fontSize: 15, color: '#64748b' },
  label: { fontSize: 13, fontWeight: '600', color: '#475569', marginBottom: 6 },
  inputWrap: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f8fafc', borderRadius: 14, borderWidth: 1.5, borderColor: '#e2e8f0', paddingHorizontal: 14 },
  input: { flex: 1, paddingVertical: 14, fontSize: 16, color: '#1e293b' },
  button: { backgroundColor: '#6366f1', borderRadius: 14, paddingVertical: 16, alignItems: 'center', marginTop: 24 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  demoWrap: { marginTop: 32, borderTopWidth: 1, borderTopColor: '#f1f5f9', paddingTop: 24 },
  demoLabel: { fontSize: 12, color: '#94a3b8', textAlign: 'center', marginBottom: 12 },
  demoBtns: { flexDirection: 'row', justifyContent: 'center', gap: 12 },
  demoBtn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8, backgroundColor: '#f1f5f9' },
  demoBtnText: { fontSize: 13, fontWeight: '600', color: '#64748b' },
});

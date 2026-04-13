import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Image,
} from 'react-native';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

export function OrdersScreen() {
  const { user } = useAuth();
  const [menu, setMenu] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [cart, setCart] = useState<Record<string, number>>({});

  useEffect(() => {
    fetchMenu();
  }, []);

  const fetchMenu = async () => {
    try {
      // GraphQL call to order-service
      const response = await axios.post('http://localhost:4003/graphql', {
        query: `query { getMenu { id name description price category imageUrl } }`
      });
      setMenu(response.data.data.getMenu);
    } catch (err) {
      console.warn('Failed to fetch menu:', err);
      // Fallback mock
      setMenu([
        { id: '1', name: 'Stadium Dog', price: 8.50, description: 'Classic beef frank' },
        { id: '2', name: 'Nachos', price: 12.00, description: 'Cheese and peppers' },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const addToCart = (id: string) => {
    setCart(prev => ({ ...prev, [id]: (prev[id] || 0) + 1 }));
  };

  const total = menu.reduce((sum, item) => sum + (cart[item.id] || 0) * item.price, 0);

  if (loading) return <ActivityIndicator style={{ flex: 1 }} />;

  return (
    <View style={s.screen}>
      <Text style={s.title}>Concessions</Text>
      <ScrollView>
        {menu.map(item => (
          <View key={item.id} style={s.itemCard}>
            <View style={{ flex: 1 }}>
              <Text style={s.itemName}>{item.name}</Text>
              <Text style={s.itemDesc}>{item.description}</Text>
              <Text style={s.itemPrice}>${item.price.toFixed(2)}</Text>
            </View>
            <TouchableOpacity onPress={() => addToCart(item.id)} style={s.addBtn}>
              <Text style={s.addBtnText}>+ Add {cart[item.id] ? `(${cart[item.id]})` : ''}</Text>
            </TouchableOpacity>
          </View>
        ))}
      </ScrollView>

      {total > 0 && (
        <View style={s.checkoutBar}>
          <Text style={s.totalText}>Total: ${total.toFixed(2)}</Text>
          <TouchableOpacity style={s.payBtn}>
            <Text style={s.payBtnText}>Checkout</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#f8fafc', padding: 20 },
  title: { fontSize: 24, fontWeight: '800', color: '#1e293b', marginBottom: 20 },
  itemCard: { flexDirection: 'row', backgroundColor: '#fff', padding: 16, borderRadius: 16, marginBottom: 12 },
  itemName: { fontSize: 16, fontWeight: '700', color: '#1e293b' },
  itemDesc: { fontSize: 13, color: '#64748b', marginTop: 4 },
  itemPrice: { fontSize: 15, fontWeight: '600', color: '#6366f1', marginTop: 8 },
  addBtn: { backgroundColor: '#eef2ff', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 10, alignSelf: 'center' },
  addBtnText: { color: '#6366f1', fontWeight: '700' },
  checkoutBar: { backgroundColor: '#fff', padding: 20, borderTopLeftRadius: 24, borderTopRightRadius: 24, shadowColor: '#000', shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 10 },
  totalText: { fontSize: 18, fontWeight: '800', color: '#1e293b' },
  payBtn: { backgroundColor: '#6366f1', marginTop: 12, paddingVertical: 16, borderRadius: 14, alignItems: 'center' },
  payBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
});

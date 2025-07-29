import { View, Text, StyleSheet, FlatList, ActivityIndicator, RefreshControl } from 'react-native';
import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useRouter } from 'expo-router';

export default function Orders() {
  const router = useRouter();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [propertyId, setPropertyId] = useState<string | null>(null);




  // Fetch manager property
  useEffect(() => {
    (async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session?.user) return router.replace('/auth/sign-in');

      const { data: ps, error: pmErr } = await supabase
        .from('property_managers')
        .select('property_id')
        .eq('user_id', session.user.id)
        .single();
      if (pmErr) {
        console.error('[ManagerOrders] property_manager fetch error', pmErr);
        setLoading(false);
        return;
      }
      setPropertyId(ps?.property_id || null);
    })();
  }, [router]);

  // Fetch orders for property
  useEffect(() => {
    if (!propertyId) return;
    fetchOrders();
  }, [propertyId]);

  async function fetchOrders() {
    if (!propertyId) return;
    setLoading(true);
    try {
      // Get orders with bookings whose resource maps to this property
      const { data, error } = await supabase
        .from('orders')
        .select(
          `id,total,status,created_at`
        )
        .eq('property_id', propertyId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      setOrders(data ?? []);
    } catch (err) {
      console.error('[ManagerOrders] fetch error', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  function onRefresh() {
    setRefreshing(true);
    fetchOrders();
  }



  function renderItem({ item }: { item: any }) {
    return (
      <View style={styles.card}>
        <View style={{ flex: 1 }}>
          <Text style={styles.id}>#{item.id.slice(0, 8)}</Text>
          {/* Property name not available directly, could fetch separately if needed */}
          <Text style={styles.date}>
            {new Date(item.created_at).toLocaleDateString()} •{' '}
            {new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </Text>
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          <Text style={styles.total}>KES {Number(item.total).toFixed(0)}</Text>
          <Text style={styles.status}>{item.status}</Text>
        </View>
      </View>
    );
  }

  if (loading) {
    return (
      <View style={[styles.container, { alignItems: 'center', justifyContent: 'center' }]}>
        <ActivityIndicator color="#ffd33d" />
      </View>
    );
  }

  if (orders.length === 0) {
    return (
      <View style={[styles.container, { alignItems: 'center', justifyContent: 'center' }]}>
        <Text style={styles.empty}>No orders for this property.</Text>
      </View>
    );
  }

  return (
    <FlatList
      data={orders}
      keyExtractor={(item) => item.id}
      renderItem={renderItem}
      ListHeaderComponent={() => <Text style={styles.header}>Orders</Text>}
      
      contentContainerStyle={{ padding: 16, backgroundColor: '#25292e' }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#25292e',
  },
  empty: {
    color: '#fff',
  },
  card: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 12,
    marginBottom: 12,
    backgroundColor: '#30343a',
    borderRadius: 8,
  },
  id: {
    color: '#ffd33d',
    fontWeight: 'bold',
    marginBottom: 4,
  },
  prop: {
    color: '#fff',
    fontSize: 14,
  },
  date: {
    color: '#aaa',
    fontSize: 12,
  },
  total: {
    color: '#fff',
    fontWeight: 'bold',
  },
  status: {
    color: '#ffd33d',
    textTransform: 'capitalize',
    fontSize: 12,
  },
  header: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
  },
});

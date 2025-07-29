import { View, Text, StyleSheet, FlatList, ActivityIndicator, RefreshControl } from 'react-native';
import { useEffect, useState } from 'react';
import useRequireAuth from '../hooks/useRequireAuth';
import useSession from '../hooks/useSession';
import { supabase } from '../../lib/supabase';

export default function Orders() {
  useRequireAuth();
  const session = useSession();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  async function fetchOrders() {
    if (!session?.user) return;
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('guest_id', session.user.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      setOrders(data ?? []);
    } catch (err) {
      console.error('[Orders] fetch error', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    fetchOrders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchOrders();
  };

  const renderItem = ({ item }: { item: any }) => (
    <View style={styles.card}>
      <View style={{ flex: 1 }}>
        <Text style={styles.id}>#{item.id.slice(0, 8)}</Text>
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

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator color="#ffd33d" />
      </View>
    );
  }

  if (orders.length === 0) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={styles.empty}>No orders yet.</Text>
      </View>
    );
  }

  return (
    <FlatList
      data={orders}
      keyExtractor={(item) => item.id}
      renderItem={renderItem}
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
});

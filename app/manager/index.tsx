import { View, Text, StyleSheet, ActivityIndicator, ScrollView, RefreshControl } from 'react-native';
import { useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import { supabase } from '../../lib/supabase';

export default function Dashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [propertyId, setPropertyId] = useState<string | null>(null);
  const [stats, setStats] = useState<{ count: number; sales: number }>({ count: 0, sales: 0 });

  // Fetch manager's property
  useEffect(() => {
    (async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session?.user) return router.replace('/auth/sign-in');

      const { data: pm, error: pmErr } = await supabase
        .from('property_managers')
        .select('property_id')
        .eq('user_id', session.user.id)
        .single();
      if (pmErr) {
        console.error('[ManagerDashboard] property fetch error', pmErr);
        setLoading(false);
        return;
      }
      setPropertyId(pm?.property_id || null);
    })();
  }, [router]);

  // Fetch stats when propertyId is ready
  useEffect(() => {
    if (!propertyId) return;
    fetchStats();
  }, [propertyId]);

  async function fetchStats() {
    if (!propertyId) return;
    setLoading(true);
    try {
      const { data: rows, error } = await supabase
        .from('orders')
        .select('total')
        .eq('property_id', propertyId);
      if (error) throw error;
      const count = rows.length;
      const sales = rows.reduce((sum, o: any) => sum + Number(o.total), 0);
      setStats({ count, sales });
    } catch (err) {
      console.error('[ManagerDashboard] stats fetch error', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  function onRefresh() {
    setRefreshing(true);
    fetchStats();
  }

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator color="#ffd33d" />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ padding: 16 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <Text style={styles.header}>Welcome to your dashboard</Text>
      <View style={styles.summaryRow}>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryValue}>{stats.count}</Text>
          <Text style={styles.summaryLabel}>Orders</Text>
        </View>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryValue}>KES {stats.sales.toFixed(0)}</Text>
          <Text style={styles.summaryLabel}>Total Sales</Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#25292e',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  summaryCard: {
    flex: 1,
    backgroundColor: '#35383d',
    padding: 16,
    borderRadius: 8,
    marginRight: 12,
  },
  summaryValue: {
    color: '#ffd33d',
    fontSize: 24,
    fontWeight: 'bold',
  },
  summaryLabel: {
    color: '#aaa',
    fontSize: 12,
  },
  header: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
  },
});

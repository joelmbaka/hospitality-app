import { View, Text, StyleSheet, FlatList, ActivityIndicator, RefreshControl } from 'react-native';
import { useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import { supabase } from '../../lib/supabase';

export default function Resources() {
  const router = useRouter();
  const [propertyId, setPropertyId] = useState<string | null>(null);
  const [resources, setResources] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Fetch manager property
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
        console.error('[ManagerResources] property fetch error', pmErr);
        setLoading(false);
        return;
      }
      setPropertyId(pm?.property_id || null);
    })();
  }, [router]);

  // Fetch resources once propertyId resolved
  useEffect(() => {
    if (!propertyId) return;
    fetchResources();
  }, [propertyId]);

  async function fetchResources() {
    if (!propertyId) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('resources')
        .select('id,name,description')
        .eq('property_id', propertyId)
        .order('name');
      if (error) throw error;
      setResources(data ?? []);
    } catch (err) {
      console.error('[ManagerResources] fetch error', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  function onRefresh() {
    setRefreshing(true);
    fetchResources();
  }

  function renderItem({ item }: { item: any }) {
    return (
      <View style={styles.card}>
        <Text style={styles.name}>{item.name}</Text>
        {item.description && <Text style={styles.desc}>{item.description}</Text>}
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

  if (resources.length === 0) {
    return (
      <View style={[styles.container, { alignItems: 'center', justifyContent: 'center' }]}>
        <Text style={styles.empty}>No resources for this property.</Text>
      </View>
    );
  }

  return (
    <FlatList
      data={resources}
      keyExtractor={(item) => item.id}
      renderItem={renderItem}
      ListHeaderComponent={() => <Text style={styles.header}>Resources</Text>}
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
    padding: 12,
    marginBottom: 12,
    backgroundColor: '#30343a',
    borderRadius: 8,
  },
  name: {
    color: '#ffd33d',
    fontWeight: 'bold',
    fontSize: 16,
    marginBottom: 4,
  },
  desc: {
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

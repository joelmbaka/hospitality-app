import { Text, View, StyleSheet, FlatList, useWindowDimensions, ActivityIndicator } from 'react-native';
import { Link } from 'expo-router';
import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import PropertyCard from '../../components/PropertyCard';

export default function Index() {
  const { width } = useWindowDimensions();
  // Show 2 columns on devices wider than 768px (tablets/desktop)
  const numColumns = width >= 768 ? 2 : 1;
  const [properties, setProperties] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);


  useEffect(() => {
    (async () => {
      setLoading(true);
      const [{ data: propData, error: propErr }, { data: serviceData, error: svcErr }] = await Promise.all([
        supabase.from('properties').select('id,name,location,image_url,services'),
        supabase.from('services').select('id,name'),
      ]);

      if (propErr || svcErr) {
        console.error('Error fetching data:', propErr ?? svcErr);
        return;
      }

      const serviceMap = Object.fromEntries((serviceData ?? []).map((s: any) => [s.id, s.name]));
      const mapped = (propData ?? []).map((p: any) => ({
        ...p,
        services: (p.services ?? []).map((id: string) => serviceMap[id] ?? id),
      }));
      setProperties(mapped);
      setLoading(false);
    })();
  }, []);
  if (loading) {
    return (
      <View style={[styles.container, { alignItems: 'center', justifyContent: 'center' }]}>
        <ActivityIndicator size="large" color="#ffd33d" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Welcome to Our Stays</Text>
      <Link href="/auth/sign-in" style={styles.authButton}>Sign in / Sign up</Link>
      <FlatList
        data={properties}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <PropertyCard property={item} />
        )}
        numColumns={numColumns}
        columnWrapperStyle={numColumns > 1 ? { gap: 16 } : undefined}
        contentContainerStyle={{ paddingBottom: 32, gap: 16 }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#25292e',
    paddingHorizontal: 16,
  },
  heading: { color:'#fff', fontSize:24, marginBottom:12},
  authButton:{ color:'#ffd33d', fontSize:16, marginBottom:20},

  button: {
    fontSize: 20,
    textDecorationLine: 'underline',
    color: '#fff',
  },
});

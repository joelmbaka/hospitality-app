import { View, Text, StyleSheet, Image, ScrollView } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { supabase } from '../../../lib/supabase';

export default function PropertyDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [property, setProperty] = useState<any>(null);

  useEffect(() => {
    if (id) {
      supabase
        .from('properties')
        .select('*')
        .eq('id', id)
        .single()
        .then(({ data }) => setProperty(data));
    }
  }, [id]);

  if (!property) {
    return (
      <View style={styles.container}>
        <Text style={styles.text}>Loading...</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Image source={{ uri: property.image_url }} style={styles.hero} />
      <Text style={styles.title}>{property.name}</Text>
      <Text style={styles.text}>{property.description ?? 'No description yet.'}</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: '#25292e',
  },
  hero: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    color: '#fff',
    marginBottom: 8,
  },
  text: {
    color: '#fff',
    fontSize: 16,
  },
});
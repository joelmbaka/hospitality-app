import React from 'react';
import { Image, Pressable, StyleSheet, Text } from 'react-native';
import { useRouter } from 'expo-router';

interface Property {
  id: string;
  name: string;
  location?: string | null;
  services?: string[] | null; // array of service names
  image_url?: string | null;
}

interface Props {
  property: Property;
}

export default function PropertyCard({ property }: Props) {
  const router = useRouter();

  return (
    <Pressable
      style={styles.card}
      onPress={() =>
        router.push({ pathname: '/guest/property/[id]' as any, params: { id: property.id } })
      }
    >
      <Image source={{ uri: property.image_url || 'https://picsum.photos/400/300' }} style={styles.cardImage} />
      <Text style={styles.cardTitle}>{property.name}</Text>
      {property.location && <Text style={styles.cardLocation}>{property.location}</Text>}
      {property.services && property.services.length > 0 && (
        <Text style={styles.cardServices}>{property.services.join(', ')}</Text>
      )}
    <Pressable style={styles.viewButton} onPress={() => router.push({ pathname: '/guest/property/[id]' as any, params: { id: property.id } })}>
        <Text style={styles.viewButtonText}>Explore</Text>
      </Pressable>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    flexBasis: '48%',
    maxWidth: '48%',
    marginBottom: 16,
    backgroundColor: '#2c2f36',
    borderRadius: 8,
    overflow: 'hidden',
  },
  cardImage: {
    width: '100%',
    height: 120,
    borderRadius: 8,
  },
  cardTitle: {
    color: '#fff',
    marginTop: 8,
    fontSize: 18,
  },
  cardLocation: {
    color: '#bbb',
    fontSize: 14,
    marginTop: 4,
  },
  cardServices: {
    color: '#ffd33d',
    fontSize: 12,
    marginTop: 2,
  },
  viewButton: {
    marginTop: 8,
    backgroundColor: '#ffd33d',
    paddingVertical: 6,
    borderRadius: 4,
    alignItems: 'center',
  },
  viewButtonText: {
    color: '#25292e',
    fontWeight: 'bold',
  },
});

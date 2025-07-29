import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';

export default function PaymentSuccess() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Payment complete – thank you!</Text>
      <Text style={styles.subtitle}>You can view your orders below.</Text>
      <Pressable style={styles.button} onPress={() => router.replace('/orders' as any)}>
        <Text style={styles.buttonText}>View My Orders</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#25292e',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  title: {
    color: '#ffd33d',
    fontSize: 22,
    marginBottom: 8,
  },
  subtitle: {
    color: '#fff',
    marginBottom: 24,
  },
  button: {
    backgroundColor: '#ffd33d',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  buttonText: {
    color: '#25292e',
    fontWeight: 'bold',
  },
});

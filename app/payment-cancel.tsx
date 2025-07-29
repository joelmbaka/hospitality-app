import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';

export default function PaymentCancel() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Payment cancelled</Text>
      <Text style={styles.subtitle}>Your order is still pending. You can try paying again from your orders.</Text>
      <Pressable style={styles.button} onPress={() => router.replace('/orders' as any)}>
        <Text style={styles.buttonText}>Go to Orders</Text>
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
    color: '#fff',
    fontSize: 22,
    marginBottom: 8,
  },
  subtitle: {
    color: '#bbb',
    marginBottom: 24,
    textAlign: 'center',
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

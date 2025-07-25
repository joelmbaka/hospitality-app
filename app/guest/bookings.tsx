import { View, Text, StyleSheet } from 'react-native';
import useRequireAuth from '../hooks/useRequireAuth';

export default function Bookings() {
  useRequireAuth();
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Bookings</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#25292e',
  },
  text: {
    color: '#fff',
    fontSize: 20,
  },
});

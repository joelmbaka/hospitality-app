import { View, Text, StyleSheet } from 'react-native';

export default function Resources() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Resources</Text>
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

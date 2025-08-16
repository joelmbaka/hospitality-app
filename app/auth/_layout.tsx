import { Stack, useRouter } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';

export default function AuthLayout() {
  const router = useRouter();
  return (
    <Stack screenOptions={{
      headerTitleAlign: 'center',
    }}>
      <Stack.Screen 
        name="sign-in" 
        options={{ 
          title: '',
          headerShown: true,
          headerStyle: { backgroundColor: '#25292e' },
          headerTintColor: '#fff',
          headerLeft: () => (
            <Ionicons name="arrow-back" size={24} color="#fff" style={{ marginLeft: 12 }} onPress={() => router.replace('/guest')} />
          ),
        }} 
      />
      <Stack.Screen 
        name="sign-up" 
        options={{ 
          title: '',
          headerShown: true,
          headerStyle: { backgroundColor: '#25292e' },
          headerTintColor: '#fff',
          headerLeft: () => (
            <Ionicons name="arrow-back" size={24} color="#fff" style={{ marginLeft: 12 }} onPress={() => router.replace('/guest')} />
          ),
        }} 
      />
    </Stack>
  );
}

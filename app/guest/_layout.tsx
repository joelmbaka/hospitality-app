import { Stack, Tabs, useRouter } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';

import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';

export default function TabLayout() {
  const [session, setSession] = useState<any>(null);
  const router = useRouter();
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setSession(session));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => setSession(session));
    return () => subscription.unsubscribe();
  }, []);
  if (!session) {
    return <Stack screenOptions={{ headerShown: false }} />;
  }

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#ffd33d',
        headerShown: false,
        headerStyle: {
          backgroundColor: '#25292e',
        },
        headerShadowVisible: false,
        headerTintColor: '#fff',
        tabBarStyle: {
          backgroundColor: '#25292e',
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'home-sharp' : 'home-outline'} color={color} size={24} />
          ),
        }}
      />
      <Tabs.Screen
        name="orders"
        options={{
          title: 'Your Order History',
          headerShown: true,
          headerStyle: { backgroundColor: '#25292e' },
          headerTintColor: '#fff',
          headerLeft: () => (
            <Ionicons name="arrow-back" size={24} color="#fff" style={{ marginLeft: 12 }} onPress={() => router.replace('/guest')} />
          ),
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'calendar' : 'calendar-outline'} color={color} size={24} />
          ),
        }}
      />

      <Tabs.Screen
        name="account"
        options={{
          title: 'Your Account',
          headerShown: true,
          headerStyle: { backgroundColor: '#25292e' },
          headerTintColor: '#fff',
          headerLeft: () => (
            <Ionicons name="arrow-back" size={24} color="#fff" style={{ marginLeft: 12 }} onPress={() => router.replace('/guest')} />
          ),
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'person' : 'person-outline'} color={color} size={24}/>
          ),
        }}
      />
      {/* Hide about, property detail, and modal routes from tab bar */}
      <Tabs.Screen name="about" options={{ href: null }} />
      <Tabs.Screen name="property/[id]" options={{ href: null }} />
      <Tabs.Screen name="SlotPickerModal" options={{ href: null }} />
      {/* Hidden Stripe Checkout */}
      <Tabs.Screen
        name="checkout"
        options={{
          href: null,
          headerShown: true,
          title: 'Checkout',
          headerStyle: { backgroundColor: '#25292e' },
          headerTintColor: '#fff',
          headerLeft: () => (
            <Ionicons name="arrow-back" size={24} color="#fff" style={{ marginLeft: 12 }} onPress={() => router.back()} />
          ),
        }}
      />
    </Tabs>
  );
}

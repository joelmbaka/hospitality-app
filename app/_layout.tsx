import { Stack, useRouter, useSegments } from 'expo-router';
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

const GUEST_EXTRA_PAGES = ['payment-success', 'payment-cancel'];

export default function RootLayout() {
  const [session, setSession] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [role, setRole] = useState<string | null>(null);
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setIsLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  // fetch user role whenever session changes
  useEffect(() => {
    if (session?.user) {
      supabase
        .from('profiles')
        .select('role')
        .eq('id', session.user.id)
        .single()
        .then(({ data, error }) => {
          // Even if error or no profile row, default to guest
          if (error) {
            console.warn('[RootLayout] profiles fetch error, defaulting role to guest', error);
          }
          setRole((data as any)?.role ?? 'guest');
        });
    } else {
      setRole(null);
    }
  }, [session]);

  useEffect(() => {
    if (isLoading || (session && !role)) return;

    const inAuthGroup = segments[0] === 'auth';
    const inGuestGroup = segments[0] === 'guest';
    const inManagerGroup = segments[0] === 'manager';

    if (!session) {
      if (inAuthGroup || inGuestGroup) return;
      if (segments[0] === 'manager') {
        router.replace('/auth/sign-in');
      } else {
        router.replace('/guest' as any);
      }
      return;
    }

    if (role === 'property_manager') {
      if (!inManagerGroup) router.replace('/manager' as any);
    } else {
      if (!inGuestGroup && !GUEST_EXTRA_PAGES.includes(segments[0] as string)) {
        router.replace('/guest' as any);
      }
    }
  }, [session, role, isLoading, segments]);

  return <Stack screenOptions={{ headerShown: false }} />;
}

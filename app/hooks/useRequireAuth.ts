import { useEffect } from 'react';
import { useRouter } from 'expo-router';
import { supabase } from '../../lib/supabase';

/**
 * Enforces authentication on a screen.
 * Redirects unauthenticated users to /auth/sign-in.
 */
export default function useRequireAuth() {
  const router = useRouter();

  useEffect(() => {
    let mounted = true;
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (mounted && !session) router.replace('/auth/sign-in');
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (mounted && !session) router.replace('/auth/sign-in');
    });
    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [router]);
}

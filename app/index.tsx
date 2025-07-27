import { useEffect } from 'react';
import { useRouter } from 'expo-router';
import { supabase } from '../lib/supabase';

/**
 * Root route redirect so "/" never shows Not-Found.
 * We asynchronously read the current session, then push the
 * appropriate stack.  While we wait we render nothing (no 404 flash).
 */
export default function Index() {
  const router = useRouter();

  useEffect(() => {
    (async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const role = (session?.user as any)?.user_metadata?.role ??
                  (session?.user as any)?.app_metadata?.role;
      if (role === 'property_manager') {
        router.replace('/manager');
      } else {
        router.replace('/guest');
      }
    })();
  }, [router]);

  return null; // render nothing while redirecting
}

import 'react-native-url-polyfill/auto'
import 'react-native-get-random-values'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { Platform } from 'react-native'

// Polyfill for structuredClone (missing in some React Native environments like older Hermes)
if (typeof (globalThis as any).structuredClone !== 'function') {
  console.log('[Polyfill] Adding naive structuredClone polyfill');
  (globalThis as any).structuredClone = (value: any) => JSON.parse(JSON.stringify(value));
}

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL as string
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY as string;

// Diagnostic logging – remove or disable in production
console.log('[Supabase] URL:', supabaseUrl);
console.log('[Supabase] Key present:', Boolean(supabaseAnonKey));

function createSupabase(): SupabaseClient {
  if (Platform.OS === 'web') {
    // On web we can rely on the default browser storage (localStorage).
    return createClient(supabaseUrl, supabaseAnonKey)
  }

  // On native we need to pass AsyncStorage explicitly. We `require` it here
  // so that it is **NOT** evaluated during the web/SSR build where `window`
  // does not exist.
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const AsyncStorage = require('@react-native-async-storage/async-storage').default

  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      storage: AsyncStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  })
}

export const supabase = createSupabase()

// Sign out automatically if the stored refresh token is invalid to clear corrupt session data
supabase.auth.onAuthStateChange((event) => {
  if ((event as string) === 'TOKEN_REFRESH_FAILED') {
    console.warn('[Supabase] Detected invalid refresh token – signing out to clear session');
    supabase.auth.signOut();
  }
});
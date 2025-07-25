import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { Platform } from 'react-native'

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL as string
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY as string;

// Diagnostic logging – remove or disable in production
console.log('[Supabase] URL:', supabaseUrl);
console.log('[Supabase] Anon Key present:', Boolean(supabaseAnonKey));

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
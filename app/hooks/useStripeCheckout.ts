import { useState } from 'react';
import { Alert, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '../../lib/supabase';
import useSession from './useSession';

interface CheckoutResult {
  url: string;
}

/**
 * React hook that handles initiating a Stripe Checkout session for a given `order_id`.
 *
 * Usage:
 *   const { initiateCheckout, loading } = useStripeCheckout();
 *   await initiateCheckout(orderId);
 */
export default function useStripeCheckout() {
  const session = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const initiateCheckout = async (orderId: string) => {
    // Ensure user is authenticated
    if (!session) {
      router.push('/auth/sign-in');
      return;
    }

    if (!orderId) {
      console.warn('[useStripeCheckout] missing orderId');
      Alert.alert('Payment error', 'Missing order information. Please try again.');
      return;
    }

    try {
      setLoading(true);
      // Call the Supabase Edge Function to create a Stripe Checkout Session
      const { data, error } = await supabase.functions.invoke<CheckoutResult>(
        'create-checkout',
        {
          body: { order_id: orderId },
        }
      );

      if (error || !data?.url) {
        console.error('[useStripeCheckout] create-checkout error', error);
        Alert.alert('Payment error', error?.message || 'Unable to start payment.');
        return;
      }

      // Open Checkout inside the app (native) or full redirect on web
      const { url } = data;
      if (Platform.OS === 'web') {
        window.location.href = url;
      } else {
        router.push({ pathname: '/guest/checkout' as any, params: { url } });
      }
    } catch (err: any) {
      console.error('[useStripeCheckout] unexpected error', err);
      Alert.alert('Payment error', err?.message || 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  return { initiateCheckout, loading } as const;
}

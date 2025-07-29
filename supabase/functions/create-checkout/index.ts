import { serve } from 'https://deno.land/std@0.192.0/http/server.ts';
import Stripe from 'https://esm.sh/stripe?target=deno&no-check';
import { createClient } from 'https://esm.sh/@supabase/supabase-js';

/*
 Edge function: create-checkout
 POST  { order_id: UUID }
 RESP { url: string }
*/

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, { apiVersion: '2023-08-16' });
const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
);

function toCents(val: number | string | null): number {
  const n = typeof val === 'string' ? parseFloat(val) : (val ?? 0);
  return Math.round(Number(n) * 100);
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

serve(async (req) => {
  // Handle preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }
  try {
    if (req.method !== 'POST')
      return new Response('Method not allowed', { status: 405, headers: corsHeaders });

    const { order_id } = await req.json();
    if (!order_id) return new Response('order_id required', { status: 400 });

    // 1. Fetch order
    const { data: order, error } = await supabase
      .from('orders')
      .select('id,total,status')
      .eq('id', order_id)
      .single();
    if (error) throw error;
    if (!order) return new Response('Order not found', { status: 404 });
    if (!['initiated', 'pending'].includes(order.status)) return new Response('Order not payable', { status: 400 });

    const amount = toCents(order.total);
    if (amount <= 0) return new Response('Invalid amount', { status: 400 });

    // 2. Create Stripe session
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_intent_data: { metadata: { order_id } },
      line_items: [
        {
          price_data: {
            currency: Deno.env.get('CURRENCY') ?? 'usd',
            product_data: { name: 'Hospitality Order' },
            unit_amount: amount,
          },
          quantity: 1,
        },
      ],
      success_url: Deno.env.get('SUCCESS_URL') ?? 'http://localhost:8081/payment-success',
      cancel_url: Deno.env.get('CANCEL_URL') ?? 'http://localhost:8081/payment-cancel',
    });

    // 3. Update order status to pending
    await supabase.from('orders').update({ status: 'pending' }).eq('id', order_id);

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('create-checkout error:', err);
    return new Response('Error', { status: 400, headers: corsHeaders });
  }
});
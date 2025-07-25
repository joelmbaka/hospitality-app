import { serve } from 'https://deno.land/std@0.192.0/http/server.ts'
import Stripe from 'https://esm.sh/stripe?target=deno&no-check'
import { createClient } from 'https://esm.sh/@supabase/supabase-js'

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, { apiVersion: '2023-08-16' })
const endpointSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET')!

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
)

serve(async req => {
  // Log headers for debugging
  console.log('Request headers:', Object.fromEntries(req.headers.entries()))

  // Check for required headers
  const sig = req.headers.get('stripe-signature')
  if (!sig) {
    return new Response('Missing stripe-signature header', { status: 400 })
  }

  try {
    const buf = await req.arrayBuffer()
    const event = await stripe.webhooks.constructEventAsync(new Uint8Array(buf), sig, endpointSecret)
    
    // Process Stripe event
    const { error } = await supabase.rpc('handle_stripe_event', { evt: event })
    if (error) throw error
    
    return new Response('ok', { status: 200 })
  } catch (err) {
    console.error('Stripe webhook error:', err)
    return new Response(`Webhook error: ${(err as Error).message}`, { status: 400 })
  }
})
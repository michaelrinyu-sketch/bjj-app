import type { VercelRequest, VercelResponse } from '@vercel/node'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'
import { buffer } from 'micro'

export const config = { api: { bodyParser: false } }

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)
const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).end()

  const sig = req.headers['stripe-signature']
  const rawBody = await buffer(req)

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(rawBody, sig!, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch (err: any) {
    console.error('Webhook signature verification failed:', err.message)
    return res.status(400).send(`Webhook Error: ${err.message}`)
  }

  const getUidFromCustomer = async (customerId: string): Promise<string | null> => {
    const { data } = await supabase
      .from('profiles')
      .select('id')
      .eq('stripe_customer_id', customerId)
      .single()
    return data?.id ?? null
  }

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session
      if (session.mode !== 'subscription') break

      const uid = session.metadata?.supabase_uid
      if (!uid) break

      const subscription = await stripe.subscriptions.retrieve(session.subscription as string)
      const expiresAt = new Date(subscription.current_period_end * 1000).toISOString()

      await supabase.from('profiles').update({
        is_subscribed: true,
        subscription_expires_at: expiresAt,
      }).eq('id', uid)
      break
    }

    case 'invoice.payment_succeeded': {
      const invoice = event.data.object as Stripe.Invoice
      if (!invoice.customer || invoice.billing_reason !== 'subscription_cycle') break

      const uid = await getUidFromCustomer(invoice.customer as string)
      if (!uid) break

      const subscription = await stripe.subscriptions.retrieve(invoice.subscription as string)
      const expiresAt = new Date(subscription.current_period_end * 1000).toISOString()

      await supabase.from('profiles').update({
        is_subscribed: true,
        subscription_expires_at: expiresAt,
      }).eq('id', uid)
      break
    }

    case 'customer.subscription.deleted':
    case 'invoice.payment_failed': {
      const obj = event.data.object as Stripe.Subscription | Stripe.Invoice
      const customerId = 'customer' in obj ? obj.customer : null
      if (!customerId) break

      const uid = await getUidFromCustomer(customerId as string)
      if (!uid) break

      await supabase.from('profiles').update({
        is_subscribed: false,
      }).eq('id', uid)
      break
    }
  }

  return res.status(200).json({ received: true })
}

import type { VercelRequest, VercelResponse } from '@vercel/node'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { userId, email } = req.body

  if (!userId || !email) {
    return res.status(400).json({ error: 'Missing userId or email' })
  }

  try {
    // Get or create Stripe customer
    const { data: profile } = await supabase
      .from('profiles')
      .select('stripe_customer_id')
      .eq('id', userId)
      .single()

    let customerId = profile?.stripe_customer_id

    if (!customerId) {
      const customer = await stripe.customers.create({ email, metadata: { supabase_uid: userId } })
      customerId = customer.id
      await supabase.from('profiles').update({ stripe_customer_id: customerId }).eq('id', userId)
    }

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: process.env.STRIPE_PRICE_ID!,
          quantity: 1,
        },
      ],
      success_url: `${process.env.VITE_APP_URL}/dashboard?subscription=success`,
      cancel_url: `${process.env.VITE_APP_URL}/dashboard?subscription=cancelled`,
      metadata: { supabase_uid: userId },
    })

    return res.status(200).json({ sessionId: session.id })
  } catch (err: any) {
    console.error('Checkout session error:', err)
    return res.status(500).json({ error: err.message })
  }
}

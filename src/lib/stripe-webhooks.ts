/**
 * Stripe Webhooks Handler
 * UiQ Community Platform - Webhook Event Processing
 */

import Stripe from 'stripe'
import { stripe, grantEntitlements, revokeEntitlements } from './stripe'
import { db, stripeWebhookEvents, stripePayments, stripeSubscriptions, stripeCustomers } from './db'
import { eq } from 'drizzle-orm'

// Webhook event handlers
export async function handleStripeWebhook(
  body: string,
  signature: string,
  endpointSecret: string
): Promise<{ received: boolean; error?: string }> {
  let event: Stripe.Event

  try {
    // Verify webhook signature
    event = stripe.webhooks.constructEvent(body, signature, endpointSecret)
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error'
    console.error('Webhook signature verification failed:', errorMessage)
    return { received: false, error: `Webhook Error: ${errorMessage}` }
  }

  try {
    // Check if we've already processed this event
    const existingEvent = await db
      .select()
      .from(stripeWebhookEvents)
      .where(eq(stripeWebhookEvents.stripeEventId, event.id))
      .limit(1)

    if (existingEvent.length > 0 && existingEvent[0].processed) {
      console.log(`Event ${event.id} already processed`)
      return { received: true }
    }

    // Store webhook event for tracking
    await db.insert(stripeWebhookEvents).values({
      stripeEventId: event.id,
      eventType: event.type,
      processed: false,
      eventData: event.data,
      attempts: 1
    }).onConflictDoUpdate({
      target: stripeWebhookEvents.stripeEventId,
      set: {
        attempts: existingEvent[0]?.attempts ? existingEvent[0].attempts + 1 : 1,
        processingError: null
      }
    })

    // Process the event
    await processStripeEvent(event)

    // Mark as processed
    await db
      .update(stripeWebhookEvents)
      .set({
        processed: true,
        processedAt: new Date()
      })
      .where(eq(stripeWebhookEvents.stripeEventId, event.id))

    console.log(`Successfully processed webhook event: ${event.type}`)
    return { received: true }

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    console.error('Error processing webhook:', error)

    // Update error in webhook events log
    await db
      .update(stripeWebhookEvents)
      .set({
        processingError: errorMessage || 'Unknown error'
      })
      .where(eq(stripeWebhookEvents.stripeEventId, event.id))

    return { received: false, error: errorMessage }
  }
}

async function processStripeEvent(event: Stripe.Event): Promise<void> {
  switch (event.type) {
    // Subscription events
    case 'customer.subscription.created':
    case 'customer.subscription.updated':
      await handleSubscriptionUpdated(event.data.object as Stripe.Subscription)
      break

    case 'customer.subscription.deleted':
      await handleSubscriptionDeleted(event.data.object as Stripe.Subscription)
      break

    // Invoice events
    case 'invoice.paid':
      await handleInvoicePaid(event.data.object as Stripe.Invoice)
      break

    case 'invoice.payment_failed':
      await handleInvoicePaymentFailed(event.data.object as Stripe.Invoice)
      break

    case 'invoice.payment_action_required':
      await handleInvoicePaymentActionRequired(event.data.object as Stripe.Invoice)
      break

    // Checkout events
    case 'checkout.session.completed':
      await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session)
      break

    // Payment events
    case 'payment_intent.succeeded':
      await handlePaymentSucceeded(event.data.object as Stripe.PaymentIntent)
      break

    case 'payment_intent.payment_failed':
      await handlePaymentFailed(event.data.object as Stripe.PaymentIntent)
      break

    // Customer events
    case 'customer.created':
      await handleCustomerCreated(event.data.object as Stripe.Customer)
      break

    case 'customer.updated':
      await handleCustomerUpdated(event.data.object as Stripe.Customer)
      break

    default:
      console.log(`Unhandled event type: ${event.type}`)
  }
}

// Subscription event handlers
async function handleSubscriptionUpdated(subscription: Stripe.Subscription): Promise<void> {
  try {
    // Update subscription record
    await db.insert(stripeSubscriptions).values({
      stripeSubscriptionId: subscription.id,
      stripeCustomerId: subscription.customer as string,
      stripePriceId: subscription.items.data[0]?.price.id || '',
      status: subscription.status,
      currentPeriodStart: new Date((subscription as any).current_period_start * 1000),
      currentPeriodEnd: new Date((subscription as any).current_period_end * 1000),
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
      canceledAt: subscription.canceled_at ? new Date(subscription.canceled_at * 1000) : null,
      trialStart: subscription.trial_start ? new Date(subscription.trial_start * 1000) : null,
      trialEnd: subscription.trial_end ? new Date(subscription.trial_end * 1000) : null,
      metadata: subscription.metadata
    }).onConflictDoUpdate({
      target: stripeSubscriptions.stripeSubscriptionId,
      set: {
        status: subscription.status,
        currentPeriodStart: new Date((subscription as any).current_period_start * 1000),
        currentPeriodEnd: new Date((subscription as any).current_period_end * 1000),
        cancelAtPeriodEnd: subscription.cancel_at_period_end,
        canceledAt: subscription.canceled_at ? new Date(subscription.canceled_at * 1000) : null,
        updatedAt: new Date()
      }
    })

    // Grant or update entitlements if subscription is active
    if (subscription.status === 'active') {
      await grantEntitlements(subscription.id)
    } else if (['canceled', 'unpaid', 'past_due'].includes(subscription.status)) {
      await revokeEntitlements(subscription.id)
    }

    console.log(`Subscription ${subscription.id} updated to status: ${subscription.status}`)
  } catch (error) {
    console.error('Error handling subscription updated:', error)
    throw error
  }
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription): Promise<void> {
  try {
    // Update subscription status
    await db
      .update(stripeSubscriptions)
      .set({
        status: 'canceled',
        canceledAt: new Date(),
        updatedAt: new Date()
      })
      .where(eq(stripeSubscriptions.stripeSubscriptionId, subscription.id))

    // Revoke entitlements
    await revokeEntitlements(subscription.id)

    console.log(`Subscription ${subscription.id} deleted/canceled`)
  } catch (error) {
    console.error('Error handling subscription deleted:', error)
    throw error
  }
}

// Invoice event handlers
async function handleInvoicePaid(invoice: Stripe.Invoice): Promise<void> {
  try {
    const subscriptionId = typeof invoice.subscription === 'string' ? invoice.subscription : null

    if (subscriptionId) {
      // Renew/extend entitlements for subscription payment
      await grantEntitlements(subscriptionId)
      
      // Send receipt email (implement email service integration)
      await sendReceiptEmail(invoice)
    }

    // Record payment
    if (typeof invoice.payment_intent === 'string') {
      const paymentIntent = await stripe.paymentIntents.retrieve(invoice.payment_intent)
      
      await db.insert(stripePayments).values({
        stripePaymentIntentId: paymentIntent.id,
        stripeCustomerId: invoice.customer as string,
        amount: invoice.amount_paid,
        currency: invoice.currency,
        status: 'succeeded',
        description: invoice.description || `Payment for ${invoice.lines.data[0]?.description}`,
        metadata: invoice.metadata
      }).onConflictDoUpdate({
        target: stripePayments.stripePaymentIntentId,
        set: {
          status: 'succeeded',
          updatedAt: new Date()
        }
      })
    }

    console.log(`Invoice ${invoice.id} paid successfully`)
  } catch (error) {
    console.error('Error handling invoice paid:', error)
    throw error
  }
}

async function handleInvoicePaymentFailed(invoice: Stripe.Invoice): Promise<void> {
  try {
    const subscriptionId = typeof invoice.subscription === 'string' ? invoice.subscription : null

    if (subscriptionId) {
      // Handle failed payment - could trigger dunning management
      console.log(`Payment failed for subscription ${subscriptionId}`)
      
      // Send payment failure notification
      await sendPaymentFailureNotification(invoice)
    }

    // Record failed payment
    if (typeof invoice.payment_intent === 'string') {
      await db.insert(stripePayments).values({
        stripePaymentIntentId: invoice.payment_intent,
        stripeCustomerId: invoice.customer as string,
        amount: invoice.amount_due,
        currency: invoice.currency,
        status: 'failed',
        description: invoice.description || `Failed payment for ${invoice.lines.data[0]?.description}`,
        metadata: invoice.metadata
      }).onConflictDoUpdate({
        target: stripePayments.stripePaymentIntentId,
        set: {
          status: 'failed',
          updatedAt: new Date()
        }
      })
    }

    console.log(`Invoice ${invoice.id} payment failed`)
  } catch (error) {
    console.error('Error handling invoice payment failed:', error)
    throw error
  }
}

async function handleInvoicePaymentActionRequired(invoice: Stripe.Invoice): Promise<void> {
  try {
    // Send notification for 3D Secure authentication
    await sendPaymentActionRequiredNotification(invoice)
    
    console.log(`Payment action required for invoice ${invoice.id}`)
  } catch (error) {
    console.error('Error handling invoice payment action required:', error)
    throw error
  }
}

// Checkout event handlers
async function handleCheckoutCompleted(session: Stripe.Checkout.Session): Promise<void> {
  try {
    const subscriptionId = session.subscription as string | null
    const paymentIntentId = session.payment_intent as string | null

    // If it's a subscription checkout
    if (subscriptionId) {
      await grantEntitlements(subscriptionId)
    }

    // If it's a one-time payment (like listing boost)
    if (paymentIntentId && !subscriptionId) {
      const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId)
      
      // Handle one-time product purchases (like listing boost)
      await handleOneTimeProductPurchase(session, paymentIntent)
    }

    console.log(`Checkout completed for session ${session.id}`)
  } catch (error) {
    console.error('Error handling checkout completed:', error)
    throw error
  }
}

// Payment event handlers
async function handlePaymentSucceeded(paymentIntent: Stripe.PaymentIntent): Promise<void> {
  try {
    // Record successful payment
    await db.insert(stripePayments).values({
      stripePaymentIntentId: paymentIntent.id,
      stripeCustomerId: paymentIntent.customer as string,
      amount: paymentIntent.amount,
      currency: paymentIntent.currency,
      status: 'succeeded',
      paymentMethodId: paymentIntent.payment_method as string,
      description: paymentIntent.description,
      metadata: paymentIntent.metadata
    }).onConflictDoUpdate({
      target: stripePayments.stripePaymentIntentId,
      set: {
        status: 'succeeded',
        updatedAt: new Date()
      }
    })

    console.log(`Payment ${paymentIntent.id} succeeded`)
  } catch (error) {
    console.error('Error handling payment succeeded:', error)
    throw error
  }
}

async function handlePaymentFailed(paymentIntent: Stripe.PaymentIntent): Promise<void> {
  try {
    // Record failed payment
    await db.insert(stripePayments).values({
      stripePaymentIntentId: paymentIntent.id,
      stripeCustomerId: paymentIntent.customer as string,
      amount: paymentIntent.amount,
      currency: paymentIntent.currency,
      status: 'failed',
      paymentMethodId: paymentIntent.payment_method as string,
      description: paymentIntent.description,
      metadata: paymentIntent.metadata
    }).onConflictDoUpdate({
      target: stripePayments.stripePaymentIntentId,
      set: {
        status: 'failed',
        updatedAt: new Date()
      }
    })

    console.log(`Payment ${paymentIntent.id} failed`)
  } catch (error) {
    console.error('Error handling payment failed:', error)
    throw error
  }
}

// Customer event handlers
async function handleCustomerCreated(customer: Stripe.Customer): Promise<void> {
  try {
    // Customer records are created by our application, so this is mainly for logging
    console.log(`Customer ${customer.id} created in Stripe`)
  } catch (error) {
    console.error('Error handling customer created:', error)
    throw error
  }
}

async function handleCustomerUpdated(customer: Stripe.Customer): Promise<void> {
  try {
    // Update customer record if needed
    await db
      .update(stripeCustomers)
      .set({
        email: customer.email,
        name: customer.name,
        defaultPaymentMethodId: customer.default_source as string,
        updatedAt: new Date()
      })
      .where(eq(stripeCustomers.stripeCustomerId, customer.id))

    console.log(`Customer ${customer.id} updated`)
  } catch (error) {
    console.error('Error handling customer updated:', error)
    throw error
  }
}

// Helper functions for one-time product purchases
async function handleOneTimeProductPurchase(
  session: Stripe.Checkout.Session,
  _paymentIntent: Stripe.PaymentIntent
): Promise<void> {
  try {
    const metadata = session.metadata || {}
    const productType = metadata.productType
    
    if (productType === 'listing_boost') {
      const listingId = metadata.listingId
      
      if (listingId) {
        // Apply listing boost (7 days featured placement)
        const boostUntil = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days from now
        
        const { classifieds } = await import('./db')
        await db
          .update(classifieds)
          .set({
            // @ts-ignore
            boostedUntil: boostUntil,
            updatedAt: new Date()
          })
          .where(eq(classifieds.id, listingId))
        
        console.log(`Listing boost applied to listing ${listingId} until ${boostUntil}`)
      }
    }
  } catch (error) {
    console.error('Error handling one-time product purchase:', error)
    throw error
  }
}

// Email notification functions (placeholder - implement with your email service)
async function sendReceiptEmail(invoice: Stripe.Invoice): Promise<void> {
  try {
    // TODO: Implement email service integration
    console.log(`Should send receipt email for invoice ${invoice.id} to ${invoice.customer_email}`)
  } catch (error) {
    console.error('Error sending receipt email:', error)
  }
}

async function sendPaymentFailureNotification(invoice: Stripe.Invoice): Promise<void> {
  try {
    // TODO: Implement email service integration
    console.log(`Should send payment failure notification for invoice ${invoice.id} to ${invoice.customer_email}`)
  } catch (error) {
    console.error('Error sending payment failure notification:', error)
  }
}

async function sendPaymentActionRequiredNotification(invoice: Stripe.Invoice): Promise<void> {
  try {
    // TODO: Implement email service integration
    console.log(`Should send payment action required notification for invoice ${invoice.id} to ${invoice.customer_email}`)
  } catch (error) {
    console.error('Error sending payment action required notification:', error)
  }
}
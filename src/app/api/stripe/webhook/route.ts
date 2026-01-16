import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { syncSubscriptionFromStripe } from "@/lib/stripe/subscriptions";
import { serverEnv } from "@/env";
import type Stripe from "stripe";

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "No signature" }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, serverEnv.STRIPE_WEBHOOK_SECRET);
  } catch (error) {
    console.error("Webhook signature verification failed:", error);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        console.log("Processing checkout.session.completed:", {
          sessionId: session.id,
          mode: session.mode,
          subscription: session.subscription,
          metadata: session.metadata,
        });
        
        if (session.mode === "subscription" && session.subscription) {
          const subscriptionId = typeof session.subscription === "string" 
            ? session.subscription 
            : session.subscription.id;
          
          const subscription = await stripe.subscriptions.retrieve(subscriptionId, {
            expand: ["customer"],
          });
          
          console.log("Retrieved subscription:", {
            id: subscription.id,
            status: subscription.status,
            metadata: subscription.metadata,
            customerMetadata: typeof subscription.customer === "object" && !subscription.customer.deleted
              ? subscription.customer.metadata
              : null,
          });
          
          await syncSubscriptionFromStripe(subscription);
        }
        break;
      }

      case "customer.subscription.created":
      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        console.log(`Processing ${event.type}:`, {
          subscriptionId: subscription.id,
          status: subscription.status,
          metadata: subscription.metadata,
        });
        await syncSubscriptionFromStripe(subscription);
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        console.log("Processing customer.subscription.deleted:", {
          subscriptionId: subscription.id,
          metadata: subscription.metadata,
        });
        await syncSubscriptionFromStripe(subscription);
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Error processing webhook:", {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      eventType: event.type,
    });
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 });
  }
}


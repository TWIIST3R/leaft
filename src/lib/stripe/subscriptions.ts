import { stripe } from "@/lib/stripe";
import { supabaseServer } from "@/lib/supabase/server";
import type Stripe from "stripe";

// Pricing tiers based on seat count
const PRICING_TIERS = {
  monthly: {
    "1-5": { perSeat: 9, base: 49 },
    "6-19": { perSeat: 8, base: 79 },
    "20-99": { perSeat: 7, base: 99 },
    "100+": { perSeat: 6, base: 119 },
  },
  annual: {
    "1-5": { perSeat: 90, base: 490 },
    "6-19": { perSeat: 80, base: 790 },
    "20-99": { perSeat: 70, base: 990 },
    "100+": { perSeat: 60, base: 1190 },
  },
} as const;

/**
 * Determine pricing tier based on seat count
 */
function getPricingTier(seatCount: number): "1-5" | "6-19" | "20-99" | "100+" {
  if (seatCount <= 5) return "1-5";
  if (seatCount <= 19) return "6-19";
  if (seatCount <= 99) return "20-99";
  return "100+";
}

/**
 * Calculate subscription amount based on seat count and plan type
 */
export function calculateSubscriptionAmount(seatCount: number, planType: "monthly" | "annual"): number {
  const tier = getPricingTier(seatCount);
  const pricing = PRICING_TIERS[planType][tier];
  return pricing.base + pricing.perSeat * seatCount;
}

/**
 * Get or create Stripe customer for organization
 */
export async function getOrCreateStripeCustomer(organizationId: string, email: string, name: string) {
  const supabase = await supabaseServer();

  // Check if organization already has a customer ID
  const { data: org } = await supabase.from("organizations").select("stripe_customer_id").eq("id", organizationId).single();

  if (org?.stripe_customer_id) {
    // Verify customer exists in Stripe
    try {
      const customer = await stripe.customers.retrieve(org.stripe_customer_id);
      if (!customer.deleted) {
        return customer as Stripe.Customer;
      }
    } catch (error) {
      // Customer doesn't exist, create new one
    }
  }

  // Create new Stripe customer
  const customer = await stripe.customers.create({
    email,
    name,
    metadata: {
      organization_id: organizationId,
    },
  });

  // Update organization with customer ID
  await supabase.from("organizations").update({ stripe_customer_id: customer.id }).eq("id", organizationId);

  return customer;
}

/**
 * Get or create Stripe Product for Leaft
 */
async function getOrCreateLeaftProduct() {
  const productName = "Leaft";
  
  // Try to find existing product
  const products = await stripe.products.list({ limit: 100 });
  const existingProduct = products.data.find((p) => p.name === productName);

  if (existingProduct) {
    return existingProduct;
  }

  // Create new product
  return await stripe.products.create({
    name: productName,
    description: "Abonnement Leaft - Transparence salariale et gestion des talents",
  });
}

/**
 * Get or create Stripe Price for subscription
 */
async function getOrCreatePrice(
  productId: string,
  seatCount: number,
  planType: "monthly" | "annual",
): Promise<string> {
  const amount = calculateSubscriptionAmount(seatCount, planType);
  const interval = planType === "monthly" ? "month" : "year";

  // Try to find existing price
  const prices = await stripe.prices.list({
    product: productId,
    active: true,
    limit: 100,
  });

  const existingPrice = prices.data.find(
    (p) =>
      p.unit_amount === Math.round(amount * 100) &&
      p.currency === "eur" &&
      p.recurring?.interval === interval,
  );

  if (existingPrice) {
    return existingPrice.id;
  }

  // Create new price
  const price = await stripe.prices.create({
    product: productId,
    unit_amount: Math.round(amount * 100), // Convert to cents
    currency: "eur",
    recurring: {
      interval,
    },
    metadata: {
      seat_count: seatCount.toString(),
      plan_type: planType,
    },
  });

  return price.id;
}

/**
 * Create Stripe Checkout Session for subscription
 */
export async function createCheckoutSession(
  organizationId: string,
  customerId: string,
  seatCount: number,
  planType: "monthly" | "annual",
  successUrl: string,
  cancelUrl: string,
) {
  // Get or create product
  const product = await getOrCreateLeaftProduct();

  // Get or create price
  const priceId = await getOrCreatePrice(product.id, seatCount, planType);

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    payment_method_types: ["card"],
    mode: "subscription",
    line_items: [
      {
        price: priceId,
        quantity: 1,
      },
    ],
    metadata: {
      organization_id: organizationId,
      seat_count: seatCount.toString(),
      plan_type: planType,
    },
    success_url: successUrl,
    cancel_url: cancelUrl,
    subscription_data: {
      metadata: {
        organization_id: organizationId,
        seat_count: seatCount.toString(),
        plan_type: planType,
      },
    },
  });

  return session;
}

/**
 * Check if organization has active subscription
 */
export async function hasActiveSubscription(organizationId: string): Promise<boolean> {
  const supabase = await supabaseServer();

  const { data, error } = await supabase.rpc("has_active_subscription", { org_id: organizationId });

  if (error) {
    console.error("Error checking subscription:", error);
    return false;
  }

  return data ?? false;
}

/**
 * Get organization subscription details
 */
export async function getOrganizationSubscription(organizationId: string) {
  const supabase = await supabaseServer();

  const { data, error } = await supabase.rpc("get_organization_subscription", { org_id: organizationId });

  if (error) {
    console.error("Error getting subscription:", error);
    return null;
  }

  return data?.[0] ?? null;
}

/**
 * Sync subscription from Stripe webhook
 */
export async function syncSubscriptionFromStripe(subscription: Stripe.Subscription) {
  const supabase = await supabaseServer();

  const organizationId = subscription.metadata.organization_id;
  if (!organizationId) {
    throw new Error("Organization ID not found in subscription metadata");
  }

  const seatCount = parseInt(subscription.metadata.seat_count || "0", 10);
  const planType = (subscription.metadata.plan_type || "monthly") as "monthly" | "annual";

  // Upsert subscription
  const { error } = await supabase.from("subscriptions").upsert(
    {
      organization_id: organizationId,
      stripe_subscription_id: subscription.id,
      stripe_customer_id: subscription.customer as string,
      status: subscription.status,
      plan_type: planType,
      seat_count: seatCount,
      current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
      current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
      cancel_at_period_end: subscription.cancel_at_period_end ?? false,
      canceled_at: subscription.canceled_at ? new Date(subscription.canceled_at * 1000).toISOString() : null,
    },
    {
      onConflict: "stripe_subscription_id",
    },
  );

  if (error) {
    console.error("Error syncing subscription:", error);
    throw error;
  }
}


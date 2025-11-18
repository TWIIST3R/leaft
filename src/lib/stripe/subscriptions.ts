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
export function getPricingTier(seatCount: number): "1-5" | "6-19" | "20-99" | "100+" {
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
 * Get or create Stripe Product for Leaft Base (Forfait)
 */
async function getOrCreateLeaftBaseProduct() {
  const productName = "Leaft - Forfait";
  
  // Try to find existing product
  const products = await stripe.products.list({ limit: 100 });
  const existingProduct = products.data.find((p) => p.name === productName);

  if (existingProduct) {
    return existingProduct;
  }

  // Create new product
  return await stripe.products.create({
    name: productName,
    description: "Forfait mensuel Leaft - Accès à la plateforme",
  });
}

/**
 * Get or create Stripe Product for Leaft Talent (Prix par talent)
 */
async function getOrCreateLeaftTalentProduct() {
  const productName = "Leaft - Talent";
  
  // Try to find existing product
  const products = await stripe.products.list({ limit: 100 });
  const existingProduct = products.data.find((p) => p.name === productName);

  if (existingProduct) {
    return existingProduct;
  }

  // Create new product
  return await stripe.products.create({
    name: productName,
    description: "Prix par talent Leaft",
  });
}

/**
 * Get or create Stripe Price for base subscription (forfait)
 */
async function getOrCreateBasePrice(
  productId: string,
  tier: "1-5" | "6-19" | "20-99" | "100+",
  planType: "monthly" | "annual",
): Promise<string> {
  const pricing = PRICING_TIERS[planType][tier];
  const amount = pricing.base;
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
      p.recurring?.interval === interval &&
      p.metadata?.tier === tier,
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
      type: "base",
      tier: tier,
      plan_type: planType,
    },
  });

  return price.id;
}

/**
 * Get or create Stripe Price for talent subscription (prix unitaire par talent)
 */
async function getOrCreateTalentPrice(
  productId: string,
  tier: "1-5" | "6-19" | "20-99" | "100+",
  planType: "monthly" | "annual",
): Promise<string> {
  const pricing = PRICING_TIERS[planType][tier];
  const amount = pricing.perSeat;
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
      p.recurring?.interval === interval &&
      p.metadata?.tier === tier,
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
      type: "talent",
      tier: tier,
      plan_type: planType,
    },
  });

  return price.id;
}

/**
 * Create Stripe Checkout Session for subscription
 * Uses two line items: base (forfait) and talent (prix unitaire)
 */
export async function createCheckoutSession(
  organizationId: string,
  customerId: string,
  seatCount: number,
  planType: "monthly" | "annual",
  successUrl: string,
  cancelUrl: string,
) {
  const tier = getPricingTier(seatCount);

  // Get or create products
  const baseProduct = await getOrCreateLeaftBaseProduct();
  const talentProduct = await getOrCreateLeaftTalentProduct();

  // Get or create prices
  const basePriceId = await getOrCreateBasePrice(baseProduct.id, tier, planType);
  const talentPriceId = await getOrCreateTalentPrice(talentProduct.id, tier, planType);

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    payment_method_types: ["card"],
    mode: "subscription",
    line_items: [
      {
        price: basePriceId,
        quantity: 1, // Forfait unique
      },
      {
        price: talentPriceId,
        quantity: seatCount, // Nombre de talents
      },
    ],
    metadata: {
      organization_id: organizationId,
      seat_count: seatCount.toString(),
      tier: tier,
      plan_type: planType,
    },
    success_url: successUrl,
    cancel_url: cancelUrl,
    subscription_data: {
      metadata: {
        organization_id: organizationId,
        seat_count: seatCount.toString(),
        tier: tier,
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
 * Calculates seat count from subscription items (talent quantity)
 */
export async function syncSubscriptionFromStripe(subscription: Stripe.Subscription) {
  const supabase = await supabaseServer();

  const organizationId = subscription.metadata.organization_id;
  if (!organizationId) {
    throw new Error("Organization ID not found in subscription metadata");
  }

  // Calculate seat count from subscription items
  // The talent item quantity represents the number of seats
  let seatCount = 0;
  const tier = subscription.metadata.tier as "1-5" | "6-19" | "20-99" | "100+" | undefined;
  
  // Find the talent item in subscription
  for (const item of subscription.items.data) {
    const priceMetadata = item.price.metadata;
    if (priceMetadata?.type === "talent") {
      seatCount = item.quantity;
      break;
    }
  }

  // Fallback to metadata if not found in items
  if (seatCount === 0) {
    seatCount = parseInt(subscription.metadata.seat_count || "0", 10);
  }

  const planType = (subscription.metadata.plan_type || "monthly") as "monthly" | "annual";

  // Extract period dates (Stripe uses Unix timestamps)
  // Type assertion needed because TypeScript types may not be fully up to date
  const sub = subscription as Stripe.Subscription & {
    current_period_start: number;
    current_period_end: number;
    canceled_at: number | null;
  };

  // Upsert subscription
  const { error } = await supabase.from("subscriptions").upsert(
    {
      organization_id: organizationId,
      stripe_subscription_id: subscription.id,
      stripe_customer_id: typeof subscription.customer === "string" ? subscription.customer : subscription.customer.id,
      status: subscription.status,
      plan_type: planType,
      seat_count: seatCount,
      current_period_start: new Date(sub.current_period_start * 1000).toISOString(),
      current_period_end: new Date(sub.current_period_end * 1000).toISOString(),
      cancel_at_period_end: subscription.cancel_at_period_end ?? false,
      canceled_at: sub.canceled_at ? new Date(sub.canceled_at * 1000).toISOString() : null,
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

/**
 * Create Stripe Billing Portal session
 * Allows users to manage their subscription (add/remove talents) without going through checkout
 */
export async function createBillingPortalSession(
  organizationId: string,
  customerId: string,
  returnUrl: string,
): Promise<string> {
  const session = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: returnUrl,
  });

  return session.url;
}


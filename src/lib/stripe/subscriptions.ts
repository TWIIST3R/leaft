import { stripe } from "@/lib/stripe";
import { supabaseServer } from "@/lib/supabase/server";
import type Stripe from "stripe";

// Pricing tiers based on seat count
// Only per-seat pricing, no base subscription
const PRICING_TIERS = {
  monthly: {
    "1-5": { perSeat: 9 },
    "6-19": { perSeat: 8 },
    "20-99": { perSeat: 7 },
    "100+": { perSeat: 6 },
  },
  annual: {
    "1-5": { perSeat: 90 },
    "6-19": { perSeat: 80 },
    "20-99": { perSeat: 70 },
    "100+": { perSeat: 60 },
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
 * Only per-seat pricing, no base subscription
 */
export function calculateSubscriptionAmount(seatCount: number, planType: "monthly" | "annual"): number {
  const tier = getPricingTier(seatCount);
  const pricing = PRICING_TIERS[planType][tier];
  return pricing.perSeat * seatCount;
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

  console.log("Created Stripe customer:", {
    customerId: customer.id,
    organizationId,
    email,
    name,
  });

  // Update organization with customer ID
  const { error: updateError } = await supabase
    .from("organizations")
    .update({ stripe_customer_id: customer.id })
    .eq("id", organizationId);

  if (updateError) {
    console.error("Error updating organization with customer ID:", updateError);
    throw updateError;
  }

  console.log("Updated organization with Stripe customer ID:", {
    organizationId,
    customerId: customer.id,
  });

  return customer;
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
    description: "Abonnement Leaft par talent",
  });
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
 * Only per-seat pricing, no base subscription
 * Configured for B2B with tax ID collection
 */
export async function createCheckoutSession(
  organizationId: string,
  customerId: string,
  seatCount: number,
  planType: "monthly" | "annual",
  businessName: string,
  taxId: string,
  successUrl: string,
  cancelUrl: string,
) {
  const tier = getPricingTier(seatCount);

  // Get or create talent product
  const talentProduct = await getOrCreateLeaftTalentProduct();

  // Get or create talent price
  const talentPriceId = await getOrCreateTalentPrice(talentProduct.id, tier, planType);

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    payment_method_types: ["card"],
    mode: "subscription",
    line_items: [
      {
        price: talentPriceId,
        quantity: seatCount, // Nombre de talents uniquement
      },
    ],
    // Collect tax ID for businesses (B2B)
    tax_id_collection: {
      enabled: true,
    },
    // Update customer with business information
    customer_update: {
      name: "auto",
      address: "auto",
    },
    // Collect billing address (required for tax ID collection)
    billing_address_collection: "required",
    metadata: {
      organization_id: organizationId,
      seat_count: seatCount.toString(),
      tier: tier,
      plan_type: planType,
      business_name: businessName,
      tax_id: taxId,
    },
    success_url: successUrl,
    cancel_url: cancelUrl,
    subscription_data: {
      metadata: {
        organization_id: organizationId,
        seat_count: seatCount.toString(),
        tier: tier,
        plan_type: planType,
        business_name: businessName,
        tax_id: taxId,
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

  // Try to get organization_id from subscription metadata first
  let organizationId = subscription.metadata.organization_id;
  
  // If not in subscription metadata, try to get it from subscription_data metadata
  // (which is set during checkout session creation)
  if (!organizationId && subscription.metadata) {
    organizationId = subscription.metadata.organization_id;
  }

  // If still not found, try to get it from the customer's metadata
  if (!organizationId) {
    try {
      const customer = typeof subscription.customer === "string" 
        ? await stripe.customers.retrieve(subscription.customer)
        : subscription.customer;
      
      if (!customer.deleted && customer.metadata?.organization_id) {
        organizationId = customer.metadata.organization_id;
      }
    } catch (error) {
      console.error("Error retrieving customer for organization_id:", error);
    }
  }

  if (!organizationId) {
    console.error("Organization ID not found in subscription metadata. Subscription:", {
      id: subscription.id,
      metadata: subscription.metadata,
      customer: typeof subscription.customer === "string" ? subscription.customer : subscription.customer.id,
    });
    throw new Error("Organization ID not found in subscription metadata");
  }

  // Calculate seat count from subscription items
  // The talent item quantity represents the number of seats
  let seatCount = 0;
  const tier = subscription.metadata.tier as "1-5" | "6-19" | "20-99" | "100+" | undefined;
  
  // Find the talent item in subscription
  for (const item of subscription.items.data) {
    const priceMetadata = item.price.metadata;
    if (priceMetadata?.type === "talent" && item.quantity !== undefined) {
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
  // Access properties directly - they should always be present on a subscription
  // Use bracket notation to access properties that TypeScript might not recognize
  let currentPeriodStart = (subscription as any).current_period_start;
  let currentPeriodEnd = (subscription as any).current_period_end;
  let canceledAt = (subscription as any).canceled_at;

  // If period dates are missing, retrieve the full subscription from Stripe
  // This can happen when the subscription object in the webhook event is incomplete
  if (!currentPeriodStart || !currentPeriodEnd) {
    console.log("Period dates missing, retrieving full subscription from Stripe...");
    try {
      const fullSubscription = await stripe.subscriptions.retrieve(subscription.id);
      currentPeriodStart = (fullSubscription as any).current_period_start;
      currentPeriodEnd = (fullSubscription as any).current_period_end;
      canceledAt = (fullSubscription as any).canceled_at;
      console.log("Retrieved full subscription with period dates:", {
        currentPeriodStart,
        currentPeriodEnd,
        canceledAt,
      });
    } catch (error) {
      console.error("Error retrieving full subscription:", error);
      throw new Error("Failed to retrieve subscription period dates");
    }
  }

  console.log("Subscription period dates:", {
    subscriptionId: subscription.id,
    currentPeriodStart,
    currentPeriodEnd,
    canceledAt,
  });

  // Convert Unix timestamps to ISO strings, handling both number and Date types
  const convertTimestamp = (timestamp: number | Date | null | undefined): string | null => {
    if (!timestamp) return null;
    
    // If it's already a Date object, convert directly
    if (timestamp instanceof Date) {
      if (isNaN(timestamp.getTime())) return null;
      return timestamp.toISOString();
    }
    
    // If it's a number, treat as Unix timestamp (seconds)
    if (typeof timestamp === "number") {
      const date = new Date(timestamp * 1000);
      if (isNaN(date.getTime())) {
        console.error("Invalid timestamp:", timestamp);
        return null;
      }
      return date.toISOString();
    }
    
    return null;
  };

  const periodStartISO = convertTimestamp(currentPeriodStart);
  const periodEndISO = convertTimestamp(currentPeriodEnd);
  const canceledAtISO = convertTimestamp(canceledAt);

  if (!periodStartISO || !periodEndISO) {
    console.error("Missing required period dates:", {
      currentPeriodStart,
      currentPeriodEnd,
      subscriptionId: subscription.id,
    });
    throw new Error("Missing required period dates in subscription");
  }

  // Upsert subscription
  const subscriptionData = {
    organization_id: organizationId,
    stripe_subscription_id: subscription.id,
    stripe_customer_id: typeof subscription.customer === "string" ? subscription.customer : subscription.customer.id,
    status: subscription.status,
    plan_type: planType,
    seat_count: seatCount,
    current_period_start: periodStartISO,
    current_period_end: periodEndISO,
    cancel_at_period_end: subscription.cancel_at_period_end ?? false,
    canceled_at: canceledAtISO,
  };

  console.log("Syncing subscription to database:", {
    organizationId,
    subscriptionId: subscription.id,
    status: subscription.status,
    planType,
    seatCount,
  });

  const { error, data } = await supabase.from("subscriptions").upsert(
    subscriptionData,
    {
      onConflict: "stripe_subscription_id",
    },
  );

  if (error) {
    console.error("Error syncing subscription:", {
      error,
      subscriptionData,
      subscriptionMetadata: subscription.metadata,
    });
    throw error;
  }

  console.log("Subscription synced successfully:", data);
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


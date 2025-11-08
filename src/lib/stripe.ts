import Stripe from "stripe";
import { serverEnv } from "@/env";

export const stripe = new Stripe(serverEnv.STRIPE_SECRET_KEY, {
  apiVersion: "2025-10-29.clover",
});


import Stripe from "stripe";
import { serverEnv } from "@/env";

export const stripe = new Stripe(serverEnv.STRIPE_SECRET_KEY, {
  apiVersion: "2024-12-18",
});


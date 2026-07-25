import { db } from "./db";
import { userSubscriptions } from "./db/schema";
import { eq } from "drizzle-orm";

const DAY_IN_MS = 1000 * 60 * 60 * 24;
export const checkSubscription = async () => {
  // NOTE: Stripe is currently invite-only in India.
  // We are mocking this function to always return true (Pro status) 
  // so you can demo the full app without needing Stripe API keys!
  return true;
};

import Razorpay from "razorpay";
import { env } from "../../config/env";

let client: Razorpay | null = null;

export function getRazorpayClient(): Razorpay {
  if (!env.razorpayKeyId || !env.razorpayKeySecret) {
    throw new Error("Razorpay keys are not configured.");
  }
  if (!client) {
    client = new Razorpay({
      key_id: env.razorpayKeyId,
      key_secret: env.razorpayKeySecret,
    });
  }
  return client;
}

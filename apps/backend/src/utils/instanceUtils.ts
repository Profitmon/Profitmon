// src/utils/instanceUtils.ts
import crypto from "crypto";

/**
 * Generate a deterministic instance id (hex string) for a card instance.
 * instanceId = sha256(cardId + wallet + timestamp + secret) -> hex(32 bytes)
 */
export function generateInstanceId(cardId: string | number, wallet: string, timestamp: number): string {
  const secret = process.env.INSTANCE_SECRET || "dev_secret_change_me";
  const data = `${cardId}:${wallet}:${timestamp}:${secret}`;
  return crypto.createHash("sha256").update(data).digest("hex"); // 64 hex chars (32 bytes)
}

/**
 * Convert hex string -> Uint8Array (32 bytes)
 */
export function hexToUint8Array(hex: string): Uint8Array {
  if (hex.length % 2 !== 0) throw new Error("Invalid hex");
  const arr = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    arr[i / 2] = parseInt(hex.slice(i, i + 2), 16);
  }
  return arr;
}

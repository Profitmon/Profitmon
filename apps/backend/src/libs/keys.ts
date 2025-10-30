// src/lib/keys.ts
import crypto from "crypto";

export function genBattleKey(): string {
  return crypto.randomBytes(24).toString("hex"); // k2, ephemeral
}

export function nowTs(): number {
  return Date.now();
}

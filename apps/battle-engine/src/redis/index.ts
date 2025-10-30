// src/lib/redis.ts
import IORedis from "ioredis";

const REDIS_URL = process.env.REDIS_URL ?? "redis://127.0.0.1:6379";



export class RedisClient {
  private static _instance: IORedis | null = null;

  public static get instance(): IORedis {
    if (!this._instance) {
      this._instance = new IORedis(REDIS_URL);
      this._instance.on("connect", () => console.log("[Redis] connected"));
      this._instance.on("error", (e) => console.error("[Redis] error", e));
    }
    return this._instance;
  }
}

export const redis = RedisClient.instance;

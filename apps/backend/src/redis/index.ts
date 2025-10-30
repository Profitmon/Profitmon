import Redis from "ioredis";

export const redisClient = new Redis(process.env.REDIS_URL || "redis://localhost:6379");

export const subscribeChannel = (channel: string, callback: (msg: string) => void) => {
  const sub = new Redis(process.env.REDIS_URL || "redis://localhost:6379");
  sub.subscribe(channel, (err, count) => {
    if (err) console.error(err);
  });
  sub.on("message", (_, message) => callback(message));
};

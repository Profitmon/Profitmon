import cron from "node-cron";
import { generateEggsForAllUsers } from "../services/eggGenerator";

// Run every 24 hours (at midnight)
cron.schedule("0 0 * * *", async () => {
    console.log("🚀 Running daily egg generation...");
    await generateEggsForAllUsers();
});

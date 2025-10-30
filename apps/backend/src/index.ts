import express from "express";
import adminRoutes from "./routes/admin";
import userRoutes from "./routes/user";

const app = express();
app.use(express.json());

// Prefix routes
app.use("/api/admin", adminRoutes);
app.use("/api/user", userRoutes);

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));

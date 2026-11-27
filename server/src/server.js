import "dotenv/config";
import { createApp } from "./app.js";
import { connectDB } from "./config/db.js";

const port = process.env.PORT ?? 5000;

try {
  await connectDB(process.env.MONGODB_URI);
} catch (error) {
  console.error("Could not connect to MongoDB:", error.message);
  process.exit(1);
}

createApp().listen(port, () => {
  console.log(`NAMMA-SANDBOX server running on http://localhost:${port}`);
});
import { createApp } from "../server/app";
import { registerRoutes } from "../server/routes";

// Initialize the app
const app = createApp();

// Register the API routes
// Note: We ignore the returned server instance since Vercel handles the listening
registerRoutes(app).catch(err => {
    console.error("Failed to register routes:", err);
});

// Export the app for Vercel serverless functions
export default app;

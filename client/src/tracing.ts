// Frontend Tracing for SkyView
// DISABLED: OpenTelemetry browser SDK has compatibility issues with Vite/Rollup bundler.
// The backend tracing works fine and captures all API requests.
// 
// To enable frontend tracing in the future, consider:
// 1. Using @vercel/otel package instead
// 2. Using a custom fetch wrapper that sends traces via beacon API
// 3. Waiting for OpenTelemetry browser SDK Vite compatibility fix

export async function initTracing() {
    // Temporarily disabled due to Rollup bundling incompatibility
    // Error: "X is not a constructor" when WebTracerProvider is instantiated
    console.log('ℹ️ Frontend tracing disabled. Backend tracing is active.');
}

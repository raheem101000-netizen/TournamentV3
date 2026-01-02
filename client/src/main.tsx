import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Initialize OpenTelemetry tracing after app loads (lazy to avoid Rollup build issues)
import('./tracing').then(({ initTracing }) => initTracing());

createRoot(document.getElementById("root")!).render(<App />);

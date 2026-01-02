// import './tracing';  // Disabled - OpenTelemetry packages causing Rollup build issues
import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

createRoot(document.getElementById("root")!).render(<App />);

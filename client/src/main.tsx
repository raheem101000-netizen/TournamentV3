import './tracing';  // Must be first - OpenTelemetry initialization
import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

createRoot(document.getElementById("root")!).render(<App />);

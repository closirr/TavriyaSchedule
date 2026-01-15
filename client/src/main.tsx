import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

console.log('[MAIN] Starting React app...');
console.log('[MAIN] Root element:', document.getElementById("root"));

const rootElement = document.getElementById("root");
if (!rootElement) {
  console.error('[MAIN] Root element not found!');
} else {
  console.log('[MAIN] Mounting React app...');
  createRoot(rootElement).render(<App />);
  console.log('[MAIN] React app mounted!');
}

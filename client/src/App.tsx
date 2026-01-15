import { Switch, Route, Router as WouterRouter } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Schedule from "@/pages/schedule";
import NotFound from "@/pages/not-found";

// Base path for production - should match Vite's base config
// For Render deployment, use root path
const basePath = "";

console.log('[APP] Base path:', basePath);
console.log('[APP] Environment:', import.meta.env.MODE);
console.log('[APP] Production:', import.meta.env.PROD);

function Router() {
  console.log('[APP] Rendering Router with base:', basePath);
  return (
    <WouterRouter base={basePath}>
      <Switch>
        <Route path="/" component={Schedule} />
        <Route component={NotFound} />
      </Switch>
    </WouterRouter>
  );
}

function App() {
  console.log('[APP] Rendering App component');
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;

import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { MoodProvider } from "./contexts/MoodContext";
import Landing from "./pages/Landing";
import Feed from "./pages/Feed";
import Discover from "./pages/Discover";
import Circles from "./pages/Circles";
import CircleDetail from "./pages/CircleDetail";
import Messages from "./pages/Messages";
import SocialProfile from "./pages/SocialProfile";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Landing} />
      <Route path="/app" component={Feed} />
      <Route path="/entdecken" component={Discover} />
      <Route path="/kreise" component={Circles} />
      <Route path="/kreise/:slug" component={CircleDetail} />
      <Route path="/nachrichten" component={Messages} />
      <Route path="/u/:handle" component={SocialProfile} />
      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <MoodProvider>
          <TooltipProvider>
            <Toaster
              theme="light"
              toastOptions={{
                style: {
                  background: "oklch(0.99 0.004 160)",
                  border: "1px solid oklch(0.88 0.015 165)",
                  color: "oklch(0.22 0.025 165)",
                },
              }}
            />
            <Router />
          </TooltipProvider>
        </MoodProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;

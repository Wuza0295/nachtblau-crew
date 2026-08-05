import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import PortalNav from "./components/portal/PortalNav";
import Home from "./pages/Home";
import Feed from "./pages/Feed";
import Flashes from "./pages/Flashes";
import Circles from "./pages/Circles";
import CircleView from "./pages/CircleView";
import Explore from "./pages/Explore";
import MomentPage from "./pages/MomentPage";
import Compose from "./pages/Compose";
import About from "./pages/About";
import Profile from "./pages/Profile";
import ProfileRedirect from "./pages/ProfileRedirect";

function Router() {
  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <PortalNav />
      <main className="flex-1 pb-16 md:pb-0">
        <Switch>
          <Route path="/" component={Home} />
          <Route path="/feed" component={Feed} />
          <Route path="/flashes" component={Flashes} />
          <Route path="/kreise" component={Circles} />
          <Route path="/kreise/:slug" component={CircleView} />
          <Route path="/entdecken" component={Explore} />
          <Route path="/moment" component={MomentPage} />
          <Route path="/erstellen" component={Compose} />
          <Route path="/ueber-uns" component={About} />
          <Route path="/profil" component={ProfileRedirect} />
          <Route path="/profil/:id" component={Profile} />
          <Route path="/404" component={NotFound} />
          <Route component={NotFound} />
        </Switch>
      </main>
      <footer className="hidden md:block border-t border-border/50 py-6 text-center text-xs text-muted-foreground">
        ◈ Social-Universum · Name folgt · 2026
      </footer>
    </div>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="dark">
        <TooltipProvider>
          <Toaster
            theme="dark"
            toastOptions={{
              style: {
                background: "oklch(0.11 0.03 280)",
                border: "1px solid oklch(0.22 0.05 280)",
                color: "oklch(0.93 0.02 280)",
              },
            }}
          />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;

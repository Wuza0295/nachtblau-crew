import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import SiteHeader from "./components/SiteHeader";
import SiteFooter from "./components/SiteFooter";
import Home from "./pages/Home";
import Feed from "./pages/Feed";
import Circles from "./pages/Circles";
import CircleDetail from "./pages/CircleDetail";
import Discover from "./pages/Discover";
import Boards from "./pages/Boards";
import Messages from "./pages/Messages";
import SocialProfile from "./pages/SocialProfile";
import PostDetail from "./pages/PostDetail";
import Concept from "./pages/Concept";

function Router() {
  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />
      <main className="flex-1">
        <Switch>
          <Route path="/" component={Home} />
          <Route path="/feed" component={Feed} />
          <Route path="/kreise" component={Circles} />
          <Route path="/kreise/:slug" component={CircleDetail} />
          <Route path="/entdecken" component={Discover} />
          <Route path="/boards" component={Boards} />
          <Route path="/nachrichten" component={Messages} />
          <Route path="/profil/:handle" component={SocialProfile} />
          <Route path="/beitrag/:id" component={PostDetail} />
          <Route path="/konzept" component={Concept} />
          <Route path="/404" component={NotFound} />
          <Route component={NotFound} />
        </Switch>
      </main>
      <SiteFooter />
    </div>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster
            theme="light"
            toastOptions={{
              style: {
                background: "oklch(0.99 0.004 160)",
                border: "1px solid oklch(0.88 0.015 155)",
                color: "oklch(0.22 0.03 160)",
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

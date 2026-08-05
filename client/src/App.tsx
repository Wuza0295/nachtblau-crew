import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import Feed from "./pages/Feed";
import Compose from "./pages/Compose";
import PostDetail from "./pages/PostDetail";
import Circles from "./pages/Circles";
import Spaces from "./pages/Spaces";
import SpaceDetail from "./pages/SpaceDetail";
import Profile from "./pages/Profile";
import ProfileRedirect from "./pages/ProfileRedirect";
import Concept from "./pages/Concept";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";

function Router() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-1">
        <Switch>
          <Route path="/" component={Home} />
          <Route path="/feed" component={Feed} />
          <Route path="/schreiben" component={Compose} />
          <Route path="/beitrag/:id" component={PostDetail} />
          <Route path="/kreis" component={Circles} />
          <Route path="/raeume/:slug" component={SpaceDetail} />
          <Route path="/raeume" component={Spaces} />
          <Route path="/konzept" component={Concept} />
          <Route path="/profil" component={ProfileRedirect} />
          <Route path="/profil/:id" component={Profile} />
          <Route path="/404" component={NotFound} />
          <Route component={NotFound} />
        </Switch>
      </main>
      <Footer />
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
                background: "oklch(0.99 0.008 195)",
                border: "1px solid oklch(0.88 0.02 195)",
                color: "oklch(0.22 0.03 210)",
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

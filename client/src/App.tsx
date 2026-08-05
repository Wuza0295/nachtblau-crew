import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Route, Switch, useParams } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Landing from "./pages/Landing";
import FeedPage from "./pages/Feed";
import CirclesPage, { CircleDetailPage } from "./pages/Circles";
import RecipesPage from "./pages/Recipes";
import VaultPage, { MessagesPage } from "./pages/VaultMessages";
import DiscoverPage from "./pages/Discover";
import ComposePage from "./pages/Compose";
import TruthPage, { MiraProfilePage } from "./pages/TruthProfile";
import NotFound from "./pages/NotFound";

function CircleRoute() {
  const params = useParams<{ slug: string }>();
  return <CircleDetailPage slug={params.slug!} />;
}

function ProfileRoute() {
  const params = useParams<{ id: string }>();
  return <MiraProfilePage id={params.id!} />;
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={Landing} />
      <Route path="/app" component={FeedPage} />
      <Route path="/circles" component={CirclesPage} />
      <Route path="/circles/:slug" component={CircleRoute} />
      <Route path="/recipes" component={RecipesPage} />
      <Route path="/vault" component={VaultPage} />
      <Route path="/messages" component={MessagesPage} />
      <Route path="/discover" component={DiscoverPage} />
      <Route path="/compose" component={ComposePage} />
      <Route path="/truth" component={TruthPage} />
      <Route path="/profil/:id" component={ProfileRoute} />
      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
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
                background: "oklch(0.99 0.008 200)",
                border: "1px solid oklch(0.88 0.02 200)",
                color: "oklch(0.22 0.02 240)",
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

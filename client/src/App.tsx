import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { Route, Switch, useParams } from "wouter";
import Landing from "./pages/Landing";
import FeedPage from "./pages/FeedPage";
import CirclesPage, { CircleDetailPage } from "./pages/CirclesPage";
import CollectivesPage, { CollectiveDetailPage } from "./pages/CollectivesPage";
import SparksPage from "./pages/SparksPage";
import MessagesPage from "./pages/MessagesPage";
import ExplorePage from "./pages/ExplorePage";
import SocialProfilePage from "./pages/SocialProfilePage";
import PostDetailPage from "./pages/PostDetailPage";
import NotFound from "./pages/NotFound";

function CircleRoute() {
  const params = useParams<{ slug: string }>();
  return <CircleDetailPage slug={params.slug ?? ""} />;
}

function CollectiveRoute() {
  const params = useParams<{ slug: string }>();
  return <CollectiveDetailPage slug={params.slug ?? ""} />;
}

function ProfileRoute() {
  const params = useParams<{ handle: string }>();
  return <SocialProfilePage handle={params.handle ?? ""} />;
}

function PostRoute() {
  const params = useParams<{ id: string }>();
  return <PostDetailPage id={params.id ?? ""} />;
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={Landing} />
      <Route path="/app" component={FeedPage} />
      <Route path="/app/sparks" component={SparksPage} />
      <Route path="/app/circles" component={CirclesPage} />
      <Route path="/app/circles/:slug" component={CircleRoute} />
      <Route path="/app/collectives" component={CollectivesPage} />
      <Route path="/app/collectives/:slug" component={CollectiveRoute} />
      <Route path="/app/explore" component={ExplorePage} />
      <Route path="/app/messages" component={MessagesPage} />
      <Route path="/app/u/:handle" component={ProfileRoute} />
      <Route path="/u/:handle" component={ProfileRoute} />
      <Route path="/post/:id" component={PostRoute} />
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
                background: "oklch(0.985 0.008 95)",
                border: "1px solid oklch(0.88 0.015 95)",
                color: "oklch(0.22 0.02 150)",
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

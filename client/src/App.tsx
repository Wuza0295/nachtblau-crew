import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Redirect, Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import LyraNav from "./components/LyraNav";
import LyraFooter from "./components/LyraFooter";
import Home from "./pages/Home";
import Feed from "./pages/Feed";
import Circles from "./pages/Circles";
import CircleDetail from "./pages/CircleDetail";
import Compose from "./pages/Compose";
import PostDetail from "./pages/PostDetail";
import Profile from "./pages/Profile";
import About from "./pages/About";

function Router() {
  return (
    <div className="min-h-screen flex flex-col">
      <LyraNav />
      <main className="flex-1">
        <Switch>
          <Route path="/" component={Home} />
          <Route path="/app" component={Feed} />
          <Route path="/app/orbit" component={Feed} />
          <Route path="/app/depth" component={Feed} />
          <Route path="/circles" component={Circles} />
          <Route path="/circles/:slug" component={CircleDetail} />
          <Route path="/compose" component={Compose} />
          <Route path="/post/:id" component={PostDetail} />
          <Route path="/u/:handle" component={Profile} />
          <Route path="/profil">
            <Redirect to="/u/you" />
          </Route>
          <Route path="/about" component={About} />
          <Route path="/ueber-uns" component={About} />
          <Route path="/404" component={NotFound} />
          <Route component={NotFound} />
        </Switch>
      </main>
      <LyraFooter />
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
                background: "oklch(0.99 0.006 140)",
                border: "1px solid oklch(0.88 0.02 150)",
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

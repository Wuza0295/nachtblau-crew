import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import Feed from "./pages/Feed";
import Explore from "./pages/Explore";
import Circles from "./pages/Circles";
import CircleDetail from "./pages/CircleDetail";
import Compose from "./pages/Compose";
import PostDetail from "./pages/PostDetail";
import Boards from "./pages/Boards";
import PulseSettings from "./pages/PulseSettings";
import Profile from "./pages/Profile";
import ProfileRedirect from "./pages/ProfileRedirect";
import About from "./pages/About";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";

function Router() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1">
        <Switch>
          <Route path="/" component={Home} />
          <Route path="/feed" component={Feed} />
          <Route path="/explore" component={Explore} />
          <Route path="/circles" component={Circles} />
          <Route path="/circles/:slug" component={CircleDetail} />
          <Route path="/compose" component={Compose} />
          <Route path="/post/:id" component={PostDetail} />
          <Route path="/boards" component={Boards} />
          <Route path="/boards/:id" component={Boards} />
          <Route path="/pulse" component={PulseSettings} />
          <Route path="/profil" component={ProfileRedirect} />
          <Route path="/profil/:id" component={Profile} />
          <Route path="/ueber-uns" component={About} />
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
                background: "oklch(0.99 0.006 200)",
                border: "1px solid oklch(0.88 0.02 200)",
                color: "oklch(0.22 0.03 230)",
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

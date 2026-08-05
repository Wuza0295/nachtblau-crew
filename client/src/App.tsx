import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import Feed from "./pages/Feed";
import Motion from "./pages/Motion";
import Circles from "./pages/Circles";
import Vault from "./pages/Vault";
import Algorithm from "./pages/Algorithm";
import Explore from "./pages/Explore";
import PostPage from "./pages/PostPage";
import Profile from "./pages/Profile";
import About from "./pages/About";
import Notifications from "./pages/Notifications";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";

function Router() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1">
        <Switch>
          <Route path="/" component={Home} />
          <Route path="/home" component={Feed} />
          <Route path="/motion" component={Motion} />
          <Route path="/circles/:slug" component={Circles} />
          <Route path="/circles" component={Circles} />
          <Route path="/vault/:id" component={Vault} />
          <Route path="/vault" component={Vault} />
          <Route path="/algorithm" component={Algorithm} />
          <Route path="/explore" component={Explore} />
          <Route path="/post/:id" component={PostPage} />
          <Route path="/profil/:idOrHandle" component={Profile} />
          <Route path="/notifications" component={Notifications} />
          <Route path="/ueber" component={About} />
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

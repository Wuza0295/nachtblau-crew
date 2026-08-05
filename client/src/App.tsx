import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import Feed from "./pages/Feed";
import Pulse from "./pages/Pulse";
import Circles from "./pages/Circles";
import CircleDetail from "./pages/CircleDetail";
import Messages from "./pages/Messages";
import Radar from "./pages/Radar";
import Compose from "./pages/Compose";
import FreeGames from "./pages/FreeGames";
import News from "./pages/News";
import Forum from "./pages/Forum";
import ForumCategory from "./pages/ForumCategory";
import ForumThread from "./pages/ForumThread";
import NewThread from "./pages/NewThread";
import Profile from "./pages/Profile";
import ProfileRedirect from "./pages/ProfileRedirect";
import About from "./pages/About";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";

function Router() {
  return (
    <div className="min-h-screen flex flex-col bg-transparent">
      <Navbar />
      <main className="flex-1">
        <Switch>
          <Route path="/" component={Home} />
          <Route path="/feed" component={Feed} />
          <Route path="/pulse" component={Pulse} />
          <Route path="/circles" component={Circles} />
          <Route path="/circles/:slug" component={CircleDetail} />
          <Route path="/messages" component={Messages} />
          <Route path="/radar" component={Radar} />
          <Route path="/compose" component={Compose} />
          <Route path="/free-games" component={FreeGames} />
          <Route path="/news" component={News} />
          <Route path="/forum" component={Forum} />
          <Route path="/forum/kategorie/:slug" component={ForumCategory} />
          <Route path="/forum/thread/:id" component={ForumThread} />
          <Route path="/forum/neu" component={NewThread} />
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
      <ThemeProvider defaultTheme="dark">
        <TooltipProvider>
          <Toaster
            theme="dark"
            toastOptions={{
              style: {
                background: "oklch(0.18 0.03 195)",
                border: "1px solid oklch(0.28 0.04 195)",
                color: "oklch(0.96 0.012 95)",
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

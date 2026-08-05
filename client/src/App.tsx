import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Router, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { getAppBasePath } from "@/lib/basePath";
import Home from "./pages/Home";
import FreeGames from "./pages/FreeGames";
import News from "./pages/News";
import Forum from "./pages/Forum";
import ForumCategory from "./pages/ForumCategory";
import ForumThread from "./pages/ForumThread";
import NewThread from "./pages/NewThread";
import Profile from "./pages/Profile";
import ProfileRedirect from "./pages/ProfileRedirect";
import About from "./pages/About";
import SocialHub from "./pages/social/SocialHub";
import SocialFluss from "./pages/social/SocialFluss";
import SocialKreise from "./pages/social/SocialKreise";
import SocialMomente from "./pages/social/SocialMomente";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";

function CrewLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}

function AppRoutes() {
  return (
    <Switch>
      <Route path="/" component={SocialHub} />
      <Route path="/fluss" component={SocialFluss} />
      <Route path="/kreise" component={SocialKreise} />
      <Route path="/momente" component={SocialMomente} />
      <Route path="/portal/fluss" component={SocialFluss} />
      <Route path="/portal/kreise" component={SocialKreise} />
      <Route path="/portal/momente" component={SocialMomente} />
      <Route path="/portal" component={SocialHub} />
      <Route path="/crew">
        <CrewLayout>
          <Home />
        </CrewLayout>
      </Route>
      <Route path="/free-games">
        <CrewLayout>
          <FreeGames />
        </CrewLayout>
      </Route>
      <Route path="/news">
        <CrewLayout>
          <News />
        </CrewLayout>
      </Route>
      <Route path="/forum">
        <CrewLayout>
          <Forum />
        </CrewLayout>
      </Route>
      <Route path="/forum/kategorie/:slug">
        <CrewLayout>
          <ForumCategory />
        </CrewLayout>
      </Route>
      <Route path="/forum/thread/:id">
        <CrewLayout>
          <ForumThread />
        </CrewLayout>
      </Route>
      <Route path="/forum/neu">
        <CrewLayout>
          <NewThread />
        </CrewLayout>
      </Route>
      <Route path="/profil">
        <CrewLayout>
          <ProfileRedirect />
        </CrewLayout>
      </Route>
      <Route path="/profil/:id">
        <CrewLayout>
          <Profile />
        </CrewLayout>
      </Route>
      <Route path="/ueber-uns">
        <CrewLayout>
          <About />
        </CrewLayout>
      </Route>
      <Route path="/404">
        <CrewLayout>
          <NotFound />
        </CrewLayout>
      </Route>
      <Route>
        <CrewLayout>
          <NotFound />
        </CrewLayout>
      </Route>
    </Switch>
  );
}

function App() {
  const base = getAppBasePath();
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="dark">
        <TooltipProvider>
          <Toaster
            theme="dark"
            toastOptions={{
              style: {
                background: "oklch(0.12 0.03 250)",
                border: "1px solid oklch(0.22 0.04 250)",
                color: "oklch(0.93 0.015 220)",
              },
            }}
          />
          <Router base={base}>
            <AppRoutes />
          </Router>
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;

import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import Marketplace from "./pages/Marketplace";
import CardDetail from "./pages/CardDetail";
import SellCard from "./pages/SellCard";
import SellerProfile from "./pages/SellerProfile";
import Profile from "./pages/Profile";
import SetupProfile from "./pages/SetupProfile";
import Register from "./pages/Register";
import Login from "./pages/Login";
import Cart from "./pages/Cart";
import Wants from "./pages/Wants";
import ProfileRedirect from "./pages/ProfileRedirect";
import About from "./pages/About";
import FreeGames from "./pages/FreeGames";
import News from "./pages/News";
import Forum from "./pages/Forum";
import ForumCategory from "./pages/ForumCategory";
import ForumThread from "./pages/ForumThread";
import NewThread from "./pages/NewThread";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";

function Router() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-1">
        <Switch>
          <Route path="/" component={Home} />
          <Route path="/marktplatz" component={Marketplace} />
          <Route path="/karte/:id" component={CardDetail} />
          <Route path="/verkaufen" component={SellCard} />
          <Route path="/verkaeufer/:id" component={SellerProfile} />
          <Route path="/profil-erstellen" component={SetupProfile} />
          <Route path="/registrieren" component={Register} />
          <Route path="/anmelden" component={Login} />
          <Route path="/warenkorb" component={Cart} />
          <Route path="/merkliste" component={Wants} />
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
                background: "oklch(0.12 0.03 250)",
                border: "1px solid oklch(0.22 0.04 250)",
                color: "oklch(0.93 0.015 220)",
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

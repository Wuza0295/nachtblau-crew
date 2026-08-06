import { useEffect, useState } from "react";
import { Link, NavLink, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../lib/auth";

export function Shell() {
  const { user, brand, logout, loading } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [compact, setCompact] = useState(false);
  const location = useLocation();

  useEffect(() => setMenuOpen(false), [location.pathname]);

  useEffect(() => {
    let last = window.scrollY;
    let ticking = false;
    const onScroll = () => {
      const y = window.scrollY;
      setCompact(y > last && y > 48);
      last = y;
      ticking = false;
    };
    const handler = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(onScroll);
    };
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, []);

  return (
    <div className="app-shell">
      <header className={`glass-bar top-glass ${menuOpen ? "is-open" : ""}`}>
        <Link to="/" className="brand">
          <img src="/assets/img/logo.svg" width={36} height={36} alt="" />
          <span>
            <strong>{brand.name}</strong>
            <small>{brand.tagline}</small>
          </span>
        </Link>
        <button
          type="button"
          className="menu-btn"
          aria-expanded={menuOpen}
          aria-label={menuOpen ? "Menü schließen" : "Menü öffnen"}
          onClick={() => setMenuOpen((v) => !v)}
        >
          <span />
          <span />
          <span />
        </button>
        <nav className={`side-nav ${menuOpen ? "is-open" : ""}`}>
          <NavLink to="/">Feed</NavLink>
          {user ? (
            <>
              <NavLink to="/compose">Posten</NavLink>
              <NavLink to="/messages">DMs</NavLink>
              <NavLink to="/profile">@{user.username}</NavLink>
              {user.isAdmin ? (
                <a href="/admin/">Admin</a>
              ) : null}
              <button type="button" className="linkish" onClick={() => void logout()}>
                Logout
              </button>
            </>
          ) : (
            <>
              <NavLink to="/login">Anmelden</NavLink>
              <NavLink to="/register" className="btn btn-sm">
                Registrieren
              </NavLink>
            </>
          )}
          <a href="/rules.php">Regeln</a>
          <a href="/privacy.php">Datenschutz</a>
        </nav>
      </header>

      <main className="main-pane">
        {loading ? <div className="muted center pad">Lade…</div> : <Outlet />}
      </main>

      <nav className={`dock ${compact ? "is-compact" : ""}`} aria-label="Schnellnavigation">
        <div className="dock-glass">
          <NavLink to="/" className="dock-item" end>
            <i className="ico ico-feed" aria-hidden />
            <span>Feed</span>
          </NavLink>
          {user ? (
            <>
              <NavLink to="/messages" className="dock-item">
                <i className="ico ico-dm" aria-hidden />
                <span>DMs</span>
              </NavLink>
              <NavLink to="/compose" className="dock-fab" aria-label="Neuen Beitrag">
                <span className="fab-core" />
              </NavLink>
              <NavLink to="/profile" className="dock-item">
                <i className="ico ico-profile" aria-hidden />
                <span>Profil</span>
              </NavLink>
            </>
          ) : (
            <>
              <NavLink to="/login" className="dock-item">
                <i className="ico ico-login" aria-hidden />
                <span>Login</span>
              </NavLink>
              <NavLink to="/register" className="dock-fab" aria-label="Registrieren">
                <span className="fab-core" />
              </NavLink>
              <a href="/rules.php" className="dock-item">
                <i className="ico ico-info" aria-hidden />
                <span>Info</span>
              </a>
            </>
          )}
        </div>
      </nav>
    </div>
  );
}

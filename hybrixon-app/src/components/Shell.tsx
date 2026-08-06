import { useEffect, useState } from "react";
import { Link, NavLink, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../lib/auth";
import {
  IconChat,
  IconCompose,
  IconFeed,
  IconInfo,
  IconLogin,
  IconProfile,
} from "./icons";

export function Shell() {
  const { user, brand, logout, loading } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();

  useEffect(() => setMenuOpen(false), [location.pathname]);

  useEffect(() => {
    document.body.classList.toggle("menu-open", menuOpen);
    return () => document.body.classList.remove("menu-open");
  }, [menuOpen]);

  return (
    <div className="app-shell">
      <header className="site-header">
        <div className="site-header-inner">
          <Link to="/" className="brand">
            <img src="/assets/img/logo.svg" width={34} height={34} alt="" />
            <span className="brand-text">
              <strong>{brand.name}</strong>
              <small>{brand.tagline}</small>
            </span>
          </Link>

          <nav className="desktop-nav" aria-label="Hauptnavigation">
            <NavLink to="/" end>
              Feed
            </NavLink>
            {user ? (
              <>
                <NavLink to="/compose">Posten</NavLink>
                <NavLink to="/messages">Nachrichten</NavLink>
                <NavLink to="/profile">@{user.username}</NavLink>
                {user.isAdmin ? <a href="/admin/">Admin</a> : null}
                <button type="button" className="nav-text-btn" onClick={() => void logout()}>
                  Abmelden
                </button>
              </>
            ) : (
              <>
                <NavLink to="/login">Anmelden</NavLink>
                <NavLink to="/register" className="nav-cta">
                  Registrieren
                </NavLink>
              </>
            )}
          </nav>

          <button
            type="button"
            className="menu-btn"
            aria-expanded={menuOpen}
            aria-controls="mobile-drawer"
            aria-label={menuOpen ? "Menü schließen" : "Menü öffnen"}
            onClick={() => setMenuOpen((v) => !v)}
          >
            <span />
            <span />
            <span />
          </button>
        </div>
      </header>

      <div
        className={`drawer-backdrop ${menuOpen ? "is-open" : ""}`}
        onClick={() => setMenuOpen(false)}
        aria-hidden={!menuOpen}
      />
      <aside
        id="mobile-drawer"
        className={`mobile-drawer ${menuOpen ? "is-open" : ""}`}
        aria-hidden={!menuOpen}
      >
        <div className="drawer-head">
          <strong>Menü</strong>
          <button type="button" className="drawer-close" onClick={() => setMenuOpen(false)}>
            Schließen
          </button>
        </div>
        <nav className="drawer-nav">
          <NavLink to="/">Feed</NavLink>
          {user ? (
            <>
              <NavLink to="/compose">Beitrag schreiben</NavLink>
              <NavLink to="/messages">Nachrichten</NavLink>
              <NavLink to="/profile">Profil (@{user.username})</NavLink>
              {user.isAdmin ? <a href="/admin/">Admin</a> : null}
              <button type="button" onClick={() => void logout()}>
                Abmelden
              </button>
            </>
          ) : (
            <>
              <NavLink to="/login">Anmelden</NavLink>
              <NavLink to="/register">Registrieren</NavLink>
            </>
          )}
          <hr />
          <a href="/rules.php">Regeln</a>
          <a href="/terms.php">Nutzungsbedingungen</a>
          <a href="/privacy.php">Datenschutz</a>
          <a href="/impressum.php">Impressum</a>
        </nav>
      </aside>

      <main className="main-pane">
        {loading ? <div className="muted center pad">Lade…</div> : <Outlet />}
      </main>

      <footer className="site-footer">
        <div className="site-footer-inner">
          <p>
            <strong>{brand.name}</strong> · {brand.tagline}
          </p>
          <p className="footer-links">
            <a href="/rules.php">Regeln</a>
            <a href="/terms.php">Nutzungsbedingungen</a>
            <a href="/privacy.php">Datenschutz</a>
            <a href="/impressum.php">Impressum</a>
          </p>
        </div>
      </footer>

      <nav className="tabbar" aria-label="Mobile Navigation">
        <NavLink to="/" className="tab" end>
          <IconFeed className="tab-ico" />
          <span>Feed</span>
        </NavLink>
        {user ? (
          <>
            <NavLink to="/compose" className="tab">
              <IconCompose className="tab-ico" />
              <span>Posten</span>
            </NavLink>
            <NavLink to="/messages" className="tab">
              <IconChat className="tab-ico" />
              <span>Chats</span>
            </NavLink>
            <NavLink to="/profile" className="tab">
              <IconProfile className="tab-ico" />
              <span>Profil</span>
            </NavLink>
          </>
        ) : (
          <>
            <NavLink to="/login" className="tab">
              <IconLogin className="tab-ico" />
              <span>Login</span>
            </NavLink>
            <NavLink to="/register" className="tab">
              <IconCompose className="tab-ico" />
              <span>Join</span>
            </NavLink>
            <a href="/rules.php" className="tab">
              <IconInfo className="tab-ico" />
              <span>Info</span>
            </a>
          </>
        )}
      </nav>
    </div>
  );
}

import React from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../state/AuthContext";
import { Button } from "../components/ui";

function navLinkClass({ isActive }) {
  return isActive ? "navLink navLinkActive" : "navLink";
}

// PUBLIC_INTERFACE
export function AppLayout() {
  /** App shell with top navigation and mobile bottom navigation. */
  const { isAuthed, user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="appShell">
      <div className="topNav">
        <div className="container topNavInner">
          <div
            className="brand"
            role="button"
            tabIndex={0}
            onClick={() => navigate("/")}
            onKeyDown={(e) => {
              if (e.key === "Enter") navigate("/");
            }}
            aria-label="Go to home"
          >
            <div className="brandMark" aria-hidden="true">
              <span>R</span>
            </div>
            <div>
              Resident Connect
              <div className="helper">Directory • Messaging • Announcements</div>
            </div>
          </div>

          <div className="topNavActions">
            {isAuthed ? (
              <>
                <div className="pill">
                  <span className="badge">{user?.role || "resident"}</span>
                  <span style={{ color: "var(--muted)", fontSize: 13 }}>
                    {user?.email || "Signed in"}
                  </span>
                </div>
                <Button
                  variant="ghost"
                  onClick={() => navigate("/profile")}
                  aria-label="Profile"
                >
                  Profile
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => {
                    logout();
                    navigate("/login");
                  }}
                >
                  Logout
                </Button>
              </>
            ) : (
              <>
                <Button variant="ghost" onClick={() => navigate("/login")}>
                  Login
                </Button>
                <Button variant="primary" onClick={() => navigate("/register")}>
                  Register
                </Button>
              </>
            )}
          </div>
        </div>
      </div>

      <main className="main">
        <Outlet />
      </main>

      <nav className="bottomNav" aria-label="Primary">
        <div className="container bottomNavInner">
          <NavLink to="/" className={navLinkClass} end>
            Home
          </NavLink>
          <NavLink to="/directory" className={navLinkClass}>
            Directory
          </NavLink>
          <NavLink to="/messages" className={navLinkClass}>
            Messages
          </NavLink>
          <NavLink to="/content" className={navLinkClass}>
            Updates
          </NavLink>
          <NavLink to="/admin" className={navLinkClass}>
            Admin
          </NavLink>
        </div>
      </nav>
    </div>
  );
}

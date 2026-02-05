import React from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../state/AuthContext";
import { Button } from "../components/ui";

// PUBLIC_INTERFACE
export default function HomePage() {
  /** Landing page; routes users to core features. */
  const { isAuthed, user } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="container">
      <div className="pageHeader">
        <div>
          <h1 className="pageTitle">Resident Directory</h1>
          <p className="pageSubtitle">
            Search residents, manage your profile privacy, view announcements/events, and message neighbors.
          </p>
        </div>
        <div className="row">
          <span className="badge">Light theme</span>
          <span className="badge">Responsive</span>
        </div>
      </div>

      <div className="grid grid2">
        <div className="card">
          <h2 className="cardTitle">Quick actions</h2>
          <p className="cardHint">
            {isAuthed
              ? `Signed in as ${user?.email || "user"}.`
              : "Sign in to access the directory and messaging."}
          </p>

          <div className="btnRow">
            <Button variant="primary" onClick={() => navigate("/directory")}>
              Search directory
            </Button>
            <Button onClick={() => navigate("/content")}>Announcements & events</Button>
            <Button onClick={() => navigate("/messages")}>Messages</Button>
            <Button onClick={() => navigate("/gdpr")}>GDPR requests</Button>
            {user?.role === "admin" ? (
              <Button onClick={() => navigate("/admin")}>Admin tools</Button>
            ) : null}
          </div>

          {!isAuthed ? (
            <>
              <hr className="sep" />
              <div className="btnRow">
                <Button variant="primary" onClick={() => navigate("/login")}>
                  Login
                </Button>
                <Button onClick={() => navigate("/register")}>Create account</Button>
              </div>
              <p className="helper" style={{ marginTop: 10 }}>
                Registration creates a resident account (admin cannot be created via self-registration).
              </p>
            </>
          ) : null}
        </div>

        <div className="card">
          <h2 className="cardTitle">Privacy controls</h2>
          <p className="cardHint">
            You decide what other residents can see (email/phone/unit visibility) and whether you appear in the directory.
          </p>
          <div className="btnRow">
            <Button variant="primary" onClick={() => navigate("/profile")}>
              View / edit my profile
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

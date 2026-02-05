import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../api/client";
import { Button, ErrorBox, TextField } from "../components/ui";
import { useAuth } from "../state/AuthContext";

function validateEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email).trim());
}

// PUBLIC_INTERFACE
export default function LoginPage() {
  /** Login page (JWT token pair). */
  const { setTokensAndFetchMe } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  async function onSubmit(e) {
    e.preventDefault();
    setError(null);

    if (!validateEmail(email)) {
      setError("Please enter a valid email.");
      return;
    }
    if (!password) {
      setError("Please enter your password.");
      return;
    }

    setLoading(true);
    try {
      const tokens = await api.login({ email, password });
      await setTokensAndFetchMe(tokens);
      navigate("/");
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="container">
      <div className="pageHeader">
        <div>
          <h1 className="pageTitle">Login</h1>
          <p className="pageSubtitle">Access the directory and messaging.</p>
        </div>
      </div>

      <div className="grid">
        <div className="card">
          <form onSubmit={onSubmit}>
            <TextField label="Email" value={email} onChange={setEmail} type="email" required />
            <TextField
              label="Password"
              value={password}
              onChange={setPassword}
              type="password"
              required
            />
            <div className="btnRow">
              <Button variant="primary" type="submit" disabled={loading}>
                {loading ? "Signing in…" : "Login"}
              </Button>
              <Link className="btn btnGhost" to="/register">
                Create account
              </Link>
            </div>
          </form>
        </div>

        <ErrorBox error={error} />
      </div>
    </div>
  );
}

import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../api/client";
import { Button, ErrorBox, TextField } from "../components/ui";
import { useAuth } from "../state/AuthContext";

function validateEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email).trim());
}

// PUBLIC_INTERFACE
export default function RegisterPage() {
  /** Self-registration for resident accounts. */
  const { setTokensAndFetchMe } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  async function onSubmit(e) {
    e.preventDefault();
    setError(null);

    if (!validateEmail(email)) {
      setError("Please enter a valid email.");
      return;
    }
    if (!password || password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (password !== password2) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      const tokens = await api.register({ email, password, role: "resident" });
      await setTokensAndFetchMe(tokens);
      navigate("/profile");
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
          <h1 className="pageTitle">Create account</h1>
          <p className="pageSubtitle">Register as a resident. You control your privacy settings.</p>
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
              placeholder="Min 8 characters"
            />
            <TextField
              label="Confirm password"
              value={password2}
              onChange={setPassword2}
              type="password"
              required
            />
            <div className="btnRow">
              <Button variant="primary" type="submit" disabled={loading}>
                {loading ? "Creating…" : "Register"}
              </Button>
              <Link className="btn btnGhost" to="/login">
                I already have an account
              </Link>
            </div>
            <p className="helper" style={{ marginTop: 10 }}>
              Note: self-registration can only create resident accounts.
            </p>
          </form>
        </div>

        <ErrorBox error={error} />
      </div>
    </div>
  );
}

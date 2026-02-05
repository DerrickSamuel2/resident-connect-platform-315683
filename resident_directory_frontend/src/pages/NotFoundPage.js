import React from "react";
import { Link } from "react-router-dom";

// PUBLIC_INTERFACE
export default function NotFoundPage() {
  /** 404 page. */
  return (
    <div className="container">
      <div className="pageHeader">
        <div>
          <h1 className="pageTitle">Page not found</h1>
          <p className="pageSubtitle">The page you requested doesn’t exist.</p>
        </div>
      </div>
      <div className="card">
        <Link className="btn btnPrimary" to="/">
          Go home
        </Link>
      </div>
    </div>
  );
}

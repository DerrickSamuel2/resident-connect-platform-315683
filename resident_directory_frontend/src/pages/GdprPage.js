import React, { useState } from "react";
import { api } from "../api/client";
import { Button, ErrorBox, SelectField } from "../components/ui";
import { useAuth } from "../state/AuthContext";

// PUBLIC_INTERFACE
export default function GdprPage() {
  /** GDPR request UI for export/delete + admin process delete. */
  const { user } = useAuth();

  const [requestType, setRequestType] = useState("export");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [created, setCreated] = useState(null);

  // Admin helper
  const [processId, setProcessId] = useState("");
  const [processing, setProcessing] = useState(false);

  return (
    <div className="container">
      <div className="pageHeader">
        <div>
          <h1 className="pageTitle">GDPR requests</h1>
          <p className="pageSubtitle">
            Request an export of your data or request deletion of your account.
          </p>
        </div>
        <div className="row">
          <span className="badge">GDPR</span>
          {user?.role === "admin" ? <span className="badge">Admin</span> : null}
        </div>
      </div>

      <div className="grid grid2">
        <div className="card">
          <h2 className="cardTitle">Create request</h2>
          <SelectField
            label="Request type"
            value={requestType}
            onChange={setRequestType}
            options={[
              { value: "export", label: "export (download your data)" },
              { value: "delete", label: "delete (request account deletion)" },
            ]}
          />

          <div className="btnRow">
            <Button
              variant="primary"
              disabled={loading}
              onClick={async () => {
                setError(null);
                setCreated(null);
                setLoading(true);
                try {
                  const resp = await api.createGdprRequest({ request_type: requestType });
                  setCreated(resp);
                } catch (err) {
                  setError(err);
                } finally {
                  setLoading(false);
                }
              }}
            >
              {loading ? "Submitting…" : "Submit request"}
            </Button>
          </div>

          {created ? (
            <>
              <hr className="sep" />
              <div className="helper">Request created:</div>
              <pre style={{ margin: 0, whiteSpace: "pre-wrap" }}>
                {JSON.stringify(created, null, 2)}
              </pre>
            </>
          ) : null}
        </div>

        <div className="card">
          <h2 className="cardTitle">Admin: process delete</h2>
          <p className="cardHint">
            Admin-only endpoint that processes a delete request by deleting the user (cascade).
            Provide the GDPR request ID (UUID).
          </p>

          <input
            className="input"
            value={processId}
            onChange={(e) => setProcessId(e.target.value)}
            placeholder="GDPR request UUID"
            aria-label="GDPR request id"
          />

          <div className="btnRow" style={{ marginTop: 10 }}>
            <Button
              variant="danger"
              disabled={processing || !processId.trim()}
              onClick={async () => {
                setError(null);
                setProcessing(true);
                try {
                  const resp = await api.processDeleteRequest({ request_id: processId.trim() });
                  setCreated(resp);
                } catch (err) {
                  setError(err);
                } finally {
                  setProcessing(false);
                }
              }}
            >
              {processing ? "Processing…" : "Process delete request"}
            </Button>
          </div>

          <ErrorBox error={error} />
        </div>
      </div>
    </div>
  );
}

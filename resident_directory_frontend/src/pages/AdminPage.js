import React, { useEffect, useState } from "react";
import { api } from "../api/client";
import { Button, ErrorBox, Loading, SelectField, TextField } from "../components/ui";

// PUBLIC_INTERFACE
export default function AdminPage() {
  /** Admin tools: list users, update role/active, view audit logs. */
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [users, setUsers] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);

  const [limit, setLimit] = useState("50");
  const [offset, setOffset] = useState("0");

  const [selectedUserId, setSelectedUserId] = useState("");
  const [newRole, setNewRole] = useState("");
  const [newActive, setNewActive] = useState("");

  const [updating, setUpdating] = useState(false);

  async function load() {
    setError(null);
    setLoading(true);
    try {
      const u = await api.listUsers({ limit: Number(limit) || 50, offset: Number(offset) || 0 });
      const ul = Array.isArray(u) ? u : u?.users || u?.results || [];
      setUsers(ul);

      const a = await api.listAuditLogs({ limit: 100 });
      setAuditLogs(a || []);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="container">
      <div className="pageHeader">
        <div>
          <h1 className="pageTitle">Admin tools</h1>
          <p className="pageSubtitle">Manage users and review audit logs.</p>
        </div>
      </div>

      {loading ? <Loading label="Loading admin data…" /> : null}
      <ErrorBox error={error} />

      <div className="grid grid2">
        <div className="card">
          <h2 className="cardTitle">Users</h2>

          <div className="grid" style={{ gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <TextField label="Limit" value={limit} onChange={setLimit} />
            <TextField label="Offset" value={offset} onChange={setOffset} />
          </div>
          <div className="btnRow" style={{ marginTop: 8 }}>
            <Button variant="primary" onClick={load} disabled={loading}>
              Refresh
            </Button>
          </div>

          <hr className="sep" />

          <div className="list">
            {users.map((u) => (
              <div key={u.id || u.user_id || u.email} className="listItem">
                <div className="listMeta">
                  <div className="listTitle">{u.email || "User"}</div>
                  <div className="listSub">
                    {(u.id || u.user_id) ? `ID: ${u.id || u.user_id}` : ""}
                    {u.role ? ` • Role: ${u.role}` : ""}
                    {typeof u.is_active === "boolean" ? ` • Active: ${String(u.is_active)}` : ""}
                  </div>
                </div>
                <Button
                  onClick={() => {
                    setSelectedUserId(u.id || u.user_id || "");
                    setNewRole(u.role || "");
                    setNewActive(typeof u.is_active === "boolean" ? String(u.is_active) : "");
                  }}
                >
                  Manage
                </Button>
              </div>
            ))}
            {users.length === 0 ? <div className="helper">No users found.</div> : null}
          </div>
        </div>

        <div className="card">
          <h2 className="cardTitle">Update user</h2>
          <p className="cardHint">Updates are sent as query params (role / is_active) to the PATCH endpoint.</p>

          <TextField
            label="User ID"
            value={selectedUserId}
            onChange={setSelectedUserId}
            placeholder="UUID"
          />

          <SelectField
            label="Role (optional)"
            value={newRole}
            onChange={setNewRole}
            options={[
              { value: "", label: "(no change)" },
              { value: "resident", label: "resident" },
              { value: "admin", label: "admin" },
            ]}
          />

          <SelectField
            label="Active (optional)"
            value={newActive}
            onChange={setNewActive}
            options={[
              { value: "", label: "(no change)" },
              { value: "true", label: "true" },
              { value: "false", label: "false" },
            ]}
          />

          <div className="btnRow">
            <Button
              variant="primary"
              disabled={updating || !selectedUserId.trim()}
              onClick={async () => {
                setError(null);
                setUpdating(true);
                try {
                  await api.updateUser({
                    user_id: selectedUserId.trim(),
                    role: newRole ? newRole : null,
                    is_active: newActive ? newActive === "true" : null,
                  });
                  await load();
                } catch (err) {
                  setError(err);
                } finally {
                  setUpdating(false);
                }
              }}
            >
              {updating ? "Updating…" : "Apply update"}
            </Button>
          </div>

          <hr className="sep" />

          <h2 className="cardTitle">Audit logs</h2>
          <div className="list">
            {auditLogs.map((l) => (
              <div key={l.id} className="listItem" style={{ alignItems: "start" }}>
                <div className="listMeta">
                  <div className="listTitle">{l.action}</div>
                  <div className="listSub">
                    {l.created_at ? new Date(l.created_at).toLocaleString() : ""}
                    {l.actor_user_id ? ` • Actor: ${l.actor_user_id}` : ""}
                    {l.entity_type ? ` • ${l.entity_type}` : ""}
                  </div>
                  {l.metadata ? (
                    <pre style={{ margin: "8px 0 0", whiteSpace: "pre-wrap" }}>
                      {JSON.stringify(l.metadata, null, 2)}
                    </pre>
                  ) : null}
                </div>
              </div>
            ))}
            {auditLogs.length === 0 ? <div className="helper">No audit logs.</div> : null}
          </div>
        </div>
      </div>
    </div>
  );
}

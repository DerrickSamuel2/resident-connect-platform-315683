import React, { useEffect, useMemo, useState } from "react";
import { api } from "../api/client";
import { Button, ErrorBox, Loading, TextField } from "../components/ui";

// PUBLIC_INTERFACE
export default function DirectoryPage() {
  /** Directory search with results and detail view. */
  const [q, setQ] = useState("");
  const [buildingId, setBuildingId] = useState("");
  const [limit, setLimit] = useState("20");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [results, setResults] = useState([]);
  const [selected, setSelected] = useState(null);

  const canSearch = useMemo(() => q.trim().length >= 1, [q]);

  async function runSearch() {
    setError(null);
    setLoading(true);
    try {
      const resp = await api.directorySearch({
        q: q.trim(),
        building_id: buildingId.trim() ? buildingId.trim() : null,
        limit: Number(limit) || 20,
      });
      setResults(resp?.results || []);
      setSelected(null);
    } catch (err) {
      setError(err);
      setResults([]);
      setSelected(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    // Small convenience: run a search when user lands with a prefilled query from browser autofill etc.
    // (but only if q already has content)
    if (q.trim()) runSearch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="container">
      <div className="pageHeader">
        <div>
          <h1 className="pageTitle">Directory search</h1>
          <p className="pageSubtitle">
            Search by name, email, or unit label. Results respect each resident’s privacy settings.
          </p>
        </div>
      </div>

      <div className="grid grid2">
        <div className="card">
          <h2 className="cardTitle">Search</h2>

          <div className="searchBar" style={{ marginBottom: 10 }}>
            <input
              className="input"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search (name/email/unit)…"
              aria-label="Search query"
            />
            <Button variant="primary" onClick={runSearch} disabled={!canSearch || loading}>
              {loading ? "Searching…" : "Search"}
            </Button>
          </div>

          <div className="grid" style={{ gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <TextField
              label="Building ID (optional UUID filter)"
              value={buildingId}
              onChange={setBuildingId}
              placeholder="Optional"
            />
            <TextField label="Limit (max 50)" value={limit} onChange={setLimit} />
          </div>

          <hr className="sep" />

          {loading ? <Loading label="Searching residents…" /> : null}
          <ErrorBox error={error} />

          <div className="list" aria-label="Search results">
            {results.map((r) => {
              const name =
                [r.first_name, r.last_name].filter(Boolean).join(" ") ||
                (r.email ? r.email : "Resident");
              const sub = [
                r.email ? `Email: ${r.email}` : null,
                r.phone ? `Phone: ${r.phone}` : null,
                r.show_unit && (r.building_id || r.unit_id)
                  ? `Unit: ${r.unit_id || "—"}`
                  : null,
              ]
                .filter(Boolean)
                .join(" • ");

              return (
                <div key={r.user_id} className="listItem">
                  <div className="listMeta">
                    <div className="listTitle">{name}</div>
                    <div className="listSub">{sub || "Limited by privacy settings"}</div>
                  </div>
                  <div className="row">
                    <span className="badge">{r.is_directory_visible ? "Visible" : "Hidden"}</span>
                    <Button onClick={() => setSelected(r)}>View</Button>
                  </div>
                </div>
              );
            })}

            {!loading && results.length === 0 ? (
              <div className="helper">No results yet. Try a search above.</div>
            ) : null}
          </div>
        </div>

        <div className="card">
          <h2 className="cardTitle">Resident detail</h2>
          <p className="cardHint">
            Select a resident to see available details. Information may be redacted per privacy settings.
          </p>

          {selected ? (
            <>
              <div className="formRow">
                <div className="label">User ID</div>
                <div className="pill">{selected.user_id}</div>
              </div>
              <div className="formRow">
                <div className="label">Name</div>
                <div>
                  {[selected.first_name, selected.last_name].filter(Boolean).join(" ") || "—"}
                </div>
              </div>
              <div className="formRow">
                <div className="label">Email</div>
                <div>{selected.email || "Hidden"}</div>
              </div>
              <div className="formRow">
                <div className="label">Phone</div>
                <div>{selected.phone || "Hidden"}</div>
              </div>
              <div className="formRow">
                <div className="label">Bio</div>
                <div>{selected.bio || "—"}</div>
              </div>

              <hr className="sep" />

              <div className="helper">
                Messaging is available in the Messages tab. To start a conversation you will need the resident’s user ID.
              </div>
            </>
          ) : (
            <div className="helper">No resident selected.</div>
          )}
        </div>
      </div>
    </div>
  );
}

import React, { useEffect, useState } from "react";
import { api } from "../api/client";
import { Button, ErrorBox, Loading, TextArea, TextField } from "../components/ui";
import { useAuth } from "../state/AuthContext";

function fmtDate(d) {
  try {
    return new Date(d).toLocaleString();
  } catch {
    return d;
  }
}

// PUBLIC_INTERFACE
export default function ContentPage() {
  /** Announcements + events list; admin create. */
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [announcements, setAnnouncements] = useState([]);
  const [events, setEvents] = useState([]);

  // Admin create
  const [creating, setCreating] = useState(false);
  const [createErr, setCreateErr] = useState(null);
  const [buildingId, setBuildingId] = useState("");

  const [aTitle, setATitle] = useState("");
  const [aBody, setABody] = useState("");

  const [eTitle, setETitle] = useState("");
  const [eDesc, setEDesc] = useState("");
  const [eStartsAt, setEStartsAt] = useState("");
  const [eEndsAt, setEEndsAt] = useState("");
  const [eLocation, setELocation] = useState("");

  async function load() {
    setError(null);
    setLoading(true);
    try {
      const [a, e] = await Promise.all([
        api.listAnnouncements({ building_id: buildingId.trim() ? buildingId.trim() : null, limit: 20 }),
        api.listEvents({ building_id: buildingId.trim() ? buildingId.trim() : null, limit: 50 }),
      ]);
      setAnnouncements(a || []);
      setEvents(e || []);
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
          <h1 className="pageTitle">Announcements & events</h1>
          <p className="pageSubtitle">Stay up to date with building notices and upcoming events.</p>
        </div>
        <div className="row">
          <span className="badge">Content</span>
          {user?.role === "admin" ? <span className="badge">Admin create enabled</span> : null}
        </div>
      </div>

      <div className="grid grid2">
        <div className="card">
          <h2 className="cardTitle">Filters</h2>
          <TextField
            label="Building ID (optional)"
            value={buildingId}
            onChange={setBuildingId}
            placeholder="UUID"
          />
          <div className="btnRow">
            <Button variant="primary" onClick={load} disabled={loading}>
              {loading ? "Loading…" : "Apply"}
            </Button>
          </div>

          <hr className="sep" />

          {loading ? <Loading label="Loading content…" /> : null}
          <ErrorBox error={error} />

          <h3 className="cardTitle" style={{ marginTop: 14 }}>Announcements</h3>
          <div className="list">
            {announcements.map((a) => (
              <div key={a.id} className="listItem" style={{ alignItems: "start" }}>
                <div className="listMeta">
                  <div className="listTitle">{a.title}</div>
                  <div className="listSub">
                    {a.is_pinned ? "Pinned • " : ""}
                    {fmtDate(a.published_at)}
                    {a.building_id ? ` • Building: ${a.building_id}` : " • Global"}
                  </div>
                  <div style={{ marginTop: 6, whiteSpace: "pre-wrap" }}>{a.body}</div>
                </div>
              </div>
            ))}
            {announcements.length === 0 ? (
              <div className="helper">No announcements.</div>
            ) : null}
          </div>

          <h3 className="cardTitle" style={{ marginTop: 14 }}>Events</h3>
          <div className="list">
            {events.map((e) => (
              <div key={e.id} className="listItem" style={{ alignItems: "start" }}>
                <div className="listMeta">
                  <div className="listTitle">{e.title}</div>
                  <div className="listSub">
                    {fmtDate(e.starts_at)}
                    {e.ends_at ? ` – ${fmtDate(e.ends_at)}` : ""}
                    {e.location ? ` • ${e.location}` : ""}
                    {e.building_id ? ` • Building: ${e.building_id}` : " • Global"}
                  </div>
                  {e.description ? (
                    <div style={{ marginTop: 6, whiteSpace: "pre-wrap" }}>{e.description}</div>
                  ) : null}
                </div>
              </div>
            ))}
            {events.length === 0 ? <div className="helper">No events.</div> : null}
          </div>
        </div>

        <div className="card">
          <h2 className="cardTitle">Create (admin)</h2>
          <p className="cardHint">
            Backend enforces admin-only creation. If you are not an admin, these actions will fail.
          </p>

          <ErrorBox error={createErr} />

          <h3 className="cardTitle">New announcement</h3>
          <TextField label="Title" value={aTitle} onChange={setATitle} />
          <TextArea label="Body" value={aBody} onChange={setABody} />
          <div className="btnRow">
            <Button
              variant="primary"
              disabled={creating || !aTitle.trim() || !aBody.trim()}
              onClick={async () => {
                setCreateErr(null);
                setCreating(true);
                try {
                  await api.createAnnouncement({
                    title: aTitle.trim(),
                    body: aBody.trim(),
                    building_id: buildingId.trim() ? buildingId.trim() : null,
                    is_pinned: false,
                  });
                  setATitle("");
                  setABody("");
                  await load();
                } catch (err) {
                  setCreateErr(err);
                } finally {
                  setCreating(false);
                }
              }}
            >
              {creating ? "Creating…" : "Create announcement"}
            </Button>
          </div>

          <hr className="sep" />

          <h3 className="cardTitle">New event</h3>
          <TextField label="Title" value={eTitle} onChange={setETitle} />
          <TextArea label="Description (optional)" value={eDesc} onChange={setEDesc} />
          <TextField
            label="Starts at (ISO8601)"
            value={eStartsAt}
            onChange={setEStartsAt}
            placeholder="2026-01-20T18:30:00Z"
          />
          <TextField
            label="Ends at (optional ISO8601)"
            value={eEndsAt}
            onChange={setEEndsAt}
            placeholder="2026-01-20T20:00:00Z"
          />
          <TextField
            label="Location (optional)"
            value={eLocation}
            onChange={setELocation}
            placeholder="Lobby / Courtyard"
          />
          <div className="btnRow">
            <Button
              variant="primary"
              disabled={creating || !eTitle.trim() || !eStartsAt.trim()}
              onClick={async () => {
                setCreateErr(null);
                setCreating(true);
                try {
                  await api.createEvent({
                    title: eTitle.trim(),
                    description: eDesc.trim() ? eDesc.trim() : null,
                    building_id: buildingId.trim() ? buildingId.trim() : null,
                    starts_at: eStartsAt.trim(),
                    ends_at: eEndsAt.trim() ? eEndsAt.trim() : null,
                    location: eLocation.trim() ? eLocation.trim() : null,
                  });
                  setETitle("");
                  setEDesc("");
                  setEStartsAt("");
                  setEEndsAt("");
                  setELocation("");
                  await load();
                } catch (err) {
                  setCreateErr(err);
                } finally {
                  setCreating(false);
                }
              }}
            >
              {creating ? "Creating…" : "Create event"}
            </Button>
          </div>

          <p className="helper" style={{ marginTop: 10 }}>
            For dates, use ISO8601 strings; backend expects date-time formatted values.
          </p>
        </div>
      </div>
    </div>
  );
}

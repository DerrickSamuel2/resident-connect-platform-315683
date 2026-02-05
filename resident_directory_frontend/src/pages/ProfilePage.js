import React, { useEffect, useMemo, useState } from "react";
import { api } from "../api/client";
import { Button, ErrorBox, Loading, TextArea, TextField } from "../components/ui";

// PUBLIC_INTERFACE
export default function ProfilePage() {
  /** Profile view/edit with privacy controls and consents. */
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState("");

  const [profile, setProfile] = useState(null);

  const form = useMemo(() => {
    if (!profile) return null;
    return {
      first_name: profile.first_name || "",
      last_name: profile.last_name || "",
      phone: profile.phone || "",
      bio: profile.bio || "",
      building_id: profile.building_id || "",
      unit_id: profile.unit_id || "",
      privacy: {
        is_directory_visible: Boolean(profile.is_directory_visible),
        show_email: Boolean(profile.show_email),
        show_phone: Boolean(profile.show_phone),
        show_unit: Boolean(profile.show_unit),
      },
      consent_directory: Boolean(profile.consent_directory),
      consent_messaging: Boolean(profile.consent_messaging),
      consent_marketing: Boolean(profile.consent_marketing),
    };
  }, [profile]);

  const [draft, setDraft] = useState(null);

  useEffect(() => {
    let mounted = true;
    async function load() {
      setError(null);
      setLoading(true);
      try {
        const p = await api.getMyProfile();
        if (!mounted) return;
        setProfile(p);
        setDraft(null); // reset draft; will be re-initialized below
      } catch (err) {
        if (!mounted) return;
        setError(err);
      } finally {
        if (!mounted) return;
        setLoading(false);
      }
    }
    load();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (form && !draft) setDraft(form);
  }, [form, draft]);

  if (loading) return <div className="container"><Loading label="Loading profile…" /></div>;

  return (
    <div className="container">
      <div className="pageHeader">
        <div>
          <h1 className="pageTitle">My profile</h1>
          <p className="pageSubtitle">Edit your details, privacy settings, and consent preferences.</p>
        </div>
        <div className="row">
          <span className="badge">Privacy-aware directory</span>
        </div>
      </div>

      <div className="grid grid2">
        <div className="card">
          <h2 className="cardTitle">Profile details</h2>
          <p className="cardHint">
            You can optionally set building/unit IDs if you have them (UUIDs). These may be hidden from others depending on privacy.
          </p>

          {draft ? (
            <>
              <TextField label="First name" value={draft.first_name} onChange={(v) => setDraft({ ...draft, first_name: v })} />
              <TextField label="Last name" value={draft.last_name} onChange={(v) => setDraft({ ...draft, last_name: v })} />
              <TextField label="Phone" value={draft.phone} onChange={(v) => setDraft({ ...draft, phone: v })} placeholder="Optional" />
              <TextArea label="Bio" value={draft.bio} onChange={(v) => setDraft({ ...draft, bio: v })} placeholder="Optional" />
              <TextField label="Building ID (UUID)" value={draft.building_id} onChange={(v) => setDraft({ ...draft, building_id: v })} placeholder="Optional" />
              <TextField label="Unit ID (UUID)" value={draft.unit_id} onChange={(v) => setDraft({ ...draft, unit_id: v })} placeholder="Optional" />
            </>
          ) : null}

          <div className="btnRow">
            <Button
              variant="primary"
              disabled={saving || !draft}
              onClick={async () => {
                setError(null);
                setSuccess("");
                if (!draft) return;

                setSaving(true);
                try {
                  // Send null for optional UUIDs if blank, to satisfy anyOf null|uuid.
                  const payload = {
                    ...draft,
                    building_id: draft.building_id.trim() ? draft.building_id.trim() : null,
                    unit_id: draft.unit_id.trim() ? draft.unit_id.trim() : null,
                  };
                  const updated = await api.updateMyProfile(payload);
                  setProfile(updated);
                  setDraft(null);
                  setSuccess("Profile saved.");
                } catch (err) {
                  setError(err);
                } finally {
                  setSaving(false);
                }
              }}
            >
              {saving ? "Saving…" : "Save changes"}
            </Button>
            {success ? <span className="successText">{success}</span> : null}
          </div>
        </div>

        <div className="card">
          <h2 className="cardTitle">Privacy & consent</h2>
          <p className="cardHint">
            These settings determine what other residents can see and how you can participate in the platform.
          </p>

          {draft ? (
            <>
              <div className="formRow">
                <label className="label">
                  <input
                    type="checkbox"
                    checked={draft.privacy.is_directory_visible}
                    onChange={(e) =>
                      setDraft({
                        ...draft,
                        privacy: { ...draft.privacy, is_directory_visible: e.target.checked },
                      })
                    }
                  />{" "}
                  Appear in directory
                </label>
                <div className="helper">Controls whether your profile is discoverable at all.</div>
              </div>

              <div className="formRow">
                <label className="label">
                  <input
                    type="checkbox"
                    checked={draft.privacy.show_email}
                    onChange={(e) =>
                      setDraft({
                        ...draft,
                        privacy: { ...draft.privacy, show_email: e.target.checked },
                      })
                    }
                  />{" "}
                  Show email to residents
                </label>
              </div>

              <div className="formRow">
                <label className="label">
                  <input
                    type="checkbox"
                    checked={draft.privacy.show_phone}
                    onChange={(e) =>
                      setDraft({
                        ...draft,
                        privacy: { ...draft.privacy, show_phone: e.target.checked },
                      })
                    }
                  />{" "}
                  Show phone to residents
                </label>
              </div>

              <div className="formRow">
                <label className="label">
                  <input
                    type="checkbox"
                    checked={draft.privacy.show_unit}
                    onChange={(e) =>
                      setDraft({
                        ...draft,
                        privacy: { ...draft.privacy, show_unit: e.target.checked },
                      })
                    }
                  />{" "}
                  Show building/unit to residents
                </label>
              </div>

              <hr className="sep" />

              <div className="formRow">
                <label className="label">
                  <input
                    type="checkbox"
                    checked={draft.consent_directory}
                    onChange={(e) => setDraft({ ...draft, consent_directory: e.target.checked })}
                  />{" "}
                  Consent to be included in directory
                </label>
              </div>

              <div className="formRow">
                <label className="label">
                  <input
                    type="checkbox"
                    checked={draft.consent_messaging}
                    onChange={(e) => setDraft({ ...draft, consent_messaging: e.target.checked })}
                  />{" "}
                  Consent to messaging
                </label>
              </div>

              <div className="formRow">
                <label className="label">
                  <input
                    type="checkbox"
                    checked={draft.consent_marketing}
                    onChange={(e) => setDraft({ ...draft, consent_marketing: e.target.checked })}
                  />{" "}
                  Consent to marketing emails
                </label>
              </div>
            </>
          ) : null}

          <p className="helper">
            Tip: If you disable messaging consent, you may not be able to start new conversations.
          </p>
        </div>
      </div>

      <div style={{ marginTop: 14 }}>
        <ErrorBox error={error} />
      </div>
    </div>
  );
}

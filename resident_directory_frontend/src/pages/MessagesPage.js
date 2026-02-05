import React, { useEffect, useMemo, useRef, useState } from "react";
import { api } from "../api/client";
import { createMessagingSocket } from "../messaging/ws";
import { Button, ErrorBox, Loading } from "../components/ui";

/**
 * Note: REST messaging schemas are empty in OpenAPI. We assume typical shapes:
 * - conversation: { id, participant_user_ids?, created_at? }
 * - message: { id, conversation_id, sender_user_id, body, created_at }
 * WebSocket messages are treated as JSON; we append those that match selected conversation.
 */

// PUBLIC_INTERFACE
export default function MessagesPage() {
  /** Messaging UI: conversations, history (REST), realtime updates (WebSocket). */
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [conversations, setConversations] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const selected = useMemo(
    () => conversations.find((c) => c.id === selectedId) || null,
    [conversations, selectedId]
  );

  const [messages, setMessages] = useState([]);
  const [msgLoading, setMsgLoading] = useState(false);
  const [compose, setCompose] = useState("");

  const [participantUserId, setParticipantUserId] = useState("");
  const [creating, setCreating] = useState(false);

  const wsRef = useRef(null);

  async function loadConversations() {
    const cs = await api.listConversations();
    // Backend might return array or object wrapper; normalize
    const arr = Array.isArray(cs) ? cs : cs?.conversations || cs?.results || [];
    setConversations(arr);
    if (arr.length && !selectedId) setSelectedId(arr[0].id);
  }

  async function loadMessages(conversation_id) {
    setMsgLoading(true);
    try {
      const ms = await api.listMessages({ conversation_id, limit: 50 });
      const arr = Array.isArray(ms) ? ms : ms?.messages || ms?.results || [];
      // API says "latest first"; for chat we render oldest->newest
      setMessages([...arr].reverse());
    } finally {
      setMsgLoading(false);
    }
  }

  useEffect(() => {
    let mounted = true;
    async function init() {
      setError(null);
      setLoading(true);
      try {
        await loadConversations();
        if (!mounted) return;
      } catch (err) {
        if (!mounted) return;
        setError(err);
      } finally {
        if (!mounted) return;
        setLoading(false);
      }
    }
    init();
    return () => {
      mounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!selectedId) return;
    loadMessages(selectedId).catch((err) => setError(err));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId]);

  useEffect(() => {
    // Connect WebSocket for realtime delivery
    const ws = createMessagingSocket({
      conversationId: selectedId,
      onOpen: () => {
        // no-op
      },
      onError: () => {
        // non-fatal; REST still works
      },
      onMessage: (data) => {
        // Backend broadcasts:
        // { type: "message", conversation_id: "...", message: {...} }
        // We normalize to the nested message but keep conversation_id if present.
        const msg = data?.message ? { ...data.message, conversation_id: data.conversation_id } : data;
        if (!msg) return;
        if (!msg.conversation_id) return;
        if (msg.conversation_id !== selectedId) return;

        // Backend message uses sent_at; UI expects created_at (fallback).
        const normalized = {
          ...msg,
          created_at: msg.created_at || msg.sent_at,
        };
        setMessages((prev) => [...prev, normalized]);
      },
    });

    wsRef.current = ws;
    return () => {
      try {
        ws.close();
      } catch {
        // ignore
      }
      wsRef.current = null;
    };
  }, [selectedId]);

  async function sendMessage() {
    // Backend WS send format is not in OpenAPI; we attempt a simple JSON envelope.
    const text = compose.trim();
    if (!text || !selectedId || !wsRef.current) return;

    try {
      wsRef.current.send(
        JSON.stringify({
          type: "message",
          body: text,
        })
      );
      // Optimistic append (sender metadata may be filled by server later)
      setMessages((prev) => [
        ...prev,
        {
          id: `local-${Date.now()}`,
          conversation_id: selectedId,
          body: text,
          created_at: new Date().toISOString(),
          local: true,
        },
      ]);
      setCompose("");
    } catch (err) {
      setError(err);
    }
  }

  return (
    <div className="container">
      <div className="pageHeader">
        <div>
          <h1 className="pageTitle">Messages</h1>
          <p className="pageSubtitle">Real-time chat via WebSocket + conversation history via REST.</p>
        </div>
      </div>

      {loading ? <Loading label="Loading conversations…" /> : null}
      <ErrorBox error={error} />

      <div className="chatLayout">
        <div className="card">
          <div className="row" style={{ marginBottom: 8 }}>
            <div className="cardTitle" style={{ margin: 0 }}>Conversations</div>
            <div className="spacer" />
            <Button onClick={() => loadConversations().catch((e) => setError(e))}>Refresh</Button>
          </div>

          <div className="formRow">
            <div className="label">Start new conversation (user UUID)</div>
            <div className="row">
              <input
                className="input"
                style={{ flex: 1 }}
                value={participantUserId}
                onChange={(e) => setParticipantUserId(e.target.value)}
                placeholder="Paste resident user_id from Directory"
              />
              <Button
                variant="primary"
                disabled={creating || !participantUserId.trim()}
                onClick={async () => {
                  setError(null);
                  setCreating(true);
                  try {
                    const created = await api.createConversation({
                      participant_user_id: participantUserId.trim(),
                    });
                    // backend may return conversation object or {}
                    await loadConversations();
                    if (created?.id) setSelectedId(created.id);
                    setParticipantUserId("");
                  } catch (err) {
                    setError(err);
                  } finally {
                    setCreating(false);
                  }
                }}
              >
                {creating ? "Creating…" : "Create"}
              </Button>
            </div>
            <div className="helper">
              If you don’t know the user ID, search in Directory and open Resident detail.
            </div>
          </div>

          <div className="list">
            {conversations.map((c) => (
              <div key={c.id} className="listItem">
                <div className="listMeta">
                  <div className="listTitle">Conversation</div>
                  <div className="listSub">{c.id}</div>
                </div>
                <Button onClick={() => setSelectedId(c.id)}>
                  {selectedId === c.id ? "Open" : "View"}
                </Button>
              </div>
            ))}
            {conversations.length === 0 ? (
              <div className="helper">No conversations yet.</div>
            ) : null}
          </div>
        </div>

        <div className="card chatPane">
          <div className="chatHeader">
            <div>
              <div className="cardTitle" style={{ margin: 0 }}>Chat</div>
              <div className="helper">
                {selected ? `Conversation: ${selected.id}` : "Select a conversation"}
              </div>
            </div>
            <span className="badge">WS + REST</span>
          </div>

          <div className="chatMessages" aria-label="Messages">
            {msgLoading ? <div className="helper">Loading messages…</div> : null}
            {messages.map((m) => {
              const mine = Boolean(m.local); // without sender_user_id info, only mark optimistic local as "mine"
              return (
                <div key={m.id} className={mine ? "msg msgMine" : "msg"}>
                  <div className="msgMeta">{m.created_at ? new Date(m.created_at).toLocaleString() : ""}</div>
                  <div className="msgBubble">{m.body || m.content || JSON.stringify(m)}</div>
                </div>
              );
            })}
            {!msgLoading && messages.length === 0 ? (
              <div className="helper">No messages.</div>
            ) : null}
          </div>

          <div className="row">
            <input
              className="input"
              style={{ flex: 1 }}
              value={compose}
              onChange={(e) => setCompose(e.target.value)}
              placeholder="Type a message…"
              aria-label="Message input"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  sendMessage();
                }
              }}
              disabled={!selectedId}
            />
            <Button variant="primary" onClick={sendMessage} disabled={!selectedId || !compose.trim()}>
              Send
            </Button>
          </div>

          <div className="helper">
            If realtime is not working, verify WS_BASE_URL and check backend’s <code>/docs/websocket</code> guide for the correct path/payload.
          </div>
        </div>
      </div>
    </div>
  );
}

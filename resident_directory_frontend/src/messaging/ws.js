import { WS_BASE_URL } from "../config";
import { authStore } from "../state/authStore";

/**
 * Messaging WebSocket connector.
 * Backend spec is documented at GET /docs/websocket, but the OpenAPI doesn't include the WS path.
 * We support configurable WS_BASE_URL and a few common paths.
 */

function buildWsUrl({ conversationId }) {
  const base = WS_BASE_URL.replace(/\/$/, "");
  const token = authStore.getAccessToken();

  // Backend contract (see GET /docs/websocket on the FastAPI app):
  //   /ws/messages?token=<ACCESS_JWT>&conversation_id=<UUID>
  const url = new URL(`${base}/ws/messages`);

  if (token) url.searchParams.set("token", token);
  if (conversationId) url.searchParams.set("conversation_id", conversationId);

  return url.toString();
}

// PUBLIC_INTERFACE
export function createMessagingSocket({ conversationId, onOpen, onClose, onError, onMessage }) {
  /** Create and return a WebSocket for real-time messaging. */
  const wsUrl = buildWsUrl({ conversationId });
  const ws = new WebSocket(wsUrl);

  ws.addEventListener("open", (e) => onOpen && onOpen(e));
  ws.addEventListener("close", (e) => onClose && onClose(e));
  ws.addEventListener("error", (e) => onError && onError(e));
  ws.addEventListener("message", (e) => {
    let data = e.data;
    try {
      data = JSON.parse(e.data);
    } catch {
      // keep text
    }
    onMessage && onMessage(data);
  });

  return ws;
}

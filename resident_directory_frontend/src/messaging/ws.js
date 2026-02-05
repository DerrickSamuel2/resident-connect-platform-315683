import { WS_BASE_URL } from "../config";
import { authStore } from "../state/authStore";

/**
 * Messaging WebSocket connector.
 * Backend spec is documented at GET /docs/websocket, but the OpenAPI doesn't include the WS path.
 * We support configurable WS_BASE_URL and a few common paths.
 */

function buildWsUrl() {
  const base = WS_BASE_URL.replace(/\/$/, "");

  // Common guesses; backend docs will clarify actual path.
  const candidatePaths = ["/ws/messaging", "/ws", "/messaging/ws"];

  const token = authStore.getAccessToken();
  for (const p of candidatePaths) {
    const url = new URL(`${base}${p}`);
    // Common pattern: token in query. If backend instead uses Authorization header,
    // this won't work (browser WS can't set headers); backend likely supports query.
    if (token) url.searchParams.set("token", token);
    return url.toString();
  }
  return `${base}/ws`;
}

// PUBLIC_INTERFACE
export function createMessagingSocket({ onOpen, onClose, onError, onMessage }) {
  /** Create and return a WebSocket for real-time messaging. */
  const wsUrl = buildWsUrl();
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

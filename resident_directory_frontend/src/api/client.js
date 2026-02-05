import { API_BASE_URL } from "../config";
import { authStore } from "../state/authStore";

/**
 * Low-level fetch wrapper that:
 * - Adds Authorization header (access token) when present
 * - Automatically attempts one refresh on 401
 * - Returns JSON when possible, otherwise text
 */
async function request(path, { method = "GET", query, body, headers } = {}) {
  const url = new URL(`${API_BASE_URL}${path}`);
  if (query) {
    Object.entries(query).forEach(([k, v]) => {
      if (v === undefined || v === null || v === "") return;
      url.searchParams.set(k, String(v));
    });
  }

  const token = authStore.getAccessToken();
  const res = await fetch(url.toString(), {
    method,
    headers: {
      "Content-Type": body ? "application/json" : undefined,
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(headers || {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  // One attempt to refresh if unauthorized (common when access token expires)
  if (res.status === 401 && authStore.getRefreshToken()) {
    const refreshed = await authStore.tryRefresh();
    if (refreshed) {
      return request(path, { method, query, body, headers });
    }
  }

  const contentType = res.headers.get("content-type") || "";
  let payload = null;

  if (contentType.includes("application/json")) {
    payload = await res.json().catch(() => null);
  } else {
    payload = await res.text().catch(() => null);
  }

  if (!res.ok) {
    const message =
      (payload && payload.detail && JSON.stringify(payload.detail)) ||
      (payload && payload.message) ||
      (typeof payload === "string" && payload) ||
      `Request failed (${res.status})`;
    const err = new Error(message);
    err.status = res.status;
    err.payload = payload;
    throw err;
  }

  return payload;
}

export const api = {
  // Auth
  register: (data) => request("/auth/register", { method: "POST", body: data }),
  login: (data) => request("/auth/login", { method: "POST", body: data }),
  refresh: (data) => request("/auth/refresh", { method: "POST", body: data }),
  me: () => request("/auth/me"),

  // Profiles
  getMyProfile: () => request("/profiles/me"),
  updateMyProfile: (data) =>
    request("/profiles/me", { method: "PUT", body: data }),
  directorySearch: ({ q, building_id, limit } = {}) =>
    request("/profiles/directory/search", {
      method: "GET",
      query: { q, building_id, limit },
    }),

  // Content
  listAnnouncements: ({ building_id, limit } = {}) =>
    request("/content/announcements", { query: { building_id, limit } }),
  createAnnouncement: (data) =>
    request("/content/announcements", { method: "POST", body: data }),
  listEvents: ({ building_id, limit } = {}) =>
    request("/content/events", { query: { building_id, limit } }),
  createEvent: (data) => request("/content/events", { method: "POST", body: data }),

  // Messaging (schemas are {} in OpenAPI; treat as JSON)
  listConversations: () => request("/messaging/conversations"),
  createConversation: ({ participant_user_id }) =>
    request("/messaging/conversations", {
      method: "POST",
      query: { participant_user_id },
    }),
  listMessages: ({ conversation_id, limit } = {}) =>
    request(`/messaging/conversations/${conversation_id}/messages`, {
      query: { limit },
    }),

  // Admin
  listUsers: ({ limit, offset } = {}) =>
    request("/admin/users", { query: { limit, offset } }),
  updateUser: ({ user_id, role, is_active }) =>
    request(`/admin/users/${user_id}`, {
      method: "PATCH",
      query: { role, is_active },
    }),
  listAuditLogs: ({ limit } = {}) =>
    request("/admin/audit-logs", { query: { limit } }),

  // GDPR
  createGdprRequest: (data) =>
    request("/gdpr/requests", { method: "POST", body: data }),
  processDeleteRequest: ({ request_id }) =>
    request(`/gdpr/requests/${request_id}/process-delete`, { method: "POST" }),
};

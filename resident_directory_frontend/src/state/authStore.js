import { api } from "../api/client";

const LS_KEY = "rd_auth_v1";

function load() {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function save(data) {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(data));
  } catch {
    // ignore
  }
}

function clear() {
  try {
    localStorage.removeItem(LS_KEY);
  } catch {
    // ignore
  }
}

const state = {
  access_token: null,
  refresh_token: null,
  user: null,
  hydrated: false,
};

const listeners = new Set();

function emit() {
  listeners.forEach((fn) => fn(getSnapshot()));
}

function getSnapshot() {
  return { ...state };
}

export const authStore = {
  subscribe(fn) {
    listeners.add(fn);
    return () => listeners.delete(fn);
  },

  hydrate() {
    if (state.hydrated) return;
    const data = load();
    state.access_token = data?.access_token || null;
    state.refresh_token = data?.refresh_token || null;
    state.user = data?.user || null;
    state.hydrated = true;
    emit();
  },

  getAccessToken() {
    return state.access_token;
  },

  getRefreshToken() {
    return state.refresh_token;
  },

  isAuthed() {
    return Boolean(state.access_token);
  },

  getUser() {
    return state.user;
  },

  async setTokensAndFetchMe(tokenPair) {
    state.access_token = tokenPair.access_token;
    state.refresh_token = tokenPair.refresh_token;
    save({
      access_token: state.access_token,
      refresh_token: state.refresh_token,
      user: state.user,
    });
    emit();

    // Try to fetch /auth/me after token set
    try {
      const me = await api.me();
      state.user = me;
      save({
        access_token: state.access_token,
        refresh_token: state.refresh_token,
        user: state.user,
      });
      emit();
    } catch {
      // Non-fatal; user can still navigate
    }
  },

  logout() {
    state.access_token = null;
    state.refresh_token = null;
    state.user = null;
    clear();
    emit();
  },

  async tryRefresh() {
    if (!state.refresh_token) return false;
    try {
      const tokenPair = await api.refresh({ refresh_token: state.refresh_token });
      state.access_token = tokenPair.access_token;
      state.refresh_token = tokenPair.refresh_token;
      save({
        access_token: state.access_token,
        refresh_token: state.refresh_token,
        user: state.user,
      });
      emit();
      return true;
    } catch {
      authStore.logout();
      return false;
    }
  },
};

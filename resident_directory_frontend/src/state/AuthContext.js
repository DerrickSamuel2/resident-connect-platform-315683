import React, { createContext, useEffect, useMemo, useSyncExternalStore } from "react";
import { authStore } from "./authStore";

const AuthContext = createContext(null);

function useAuthSnapshot() {
  // IMPORTANT: getSnapshot must return a referentially-stable value unless state changes.
  // authStore.getSnapshot() is updated only when the store mutates, preventing
  // forceStoreRerender loops.
  const snap = useSyncExternalStore(authStore.subscribe, authStore.getSnapshot);

  // Map internal state fields to context-friendly names.
  return {
    accessToken: snap.access_token,
    refreshToken: snap.refresh_token,
    user: snap.user,
    isAuthed: Boolean(snap.access_token),
  };
}

// PUBLIC_INTERFACE
export function useAuth() {
  /** Hook providing auth state + actions. */
  const ctx = React.useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within <AuthProvider />");
  }
  return ctx;
}

// PUBLIC_INTERFACE
export function AuthProvider({ children }) {
  /** Provides authentication state and actions for the app. */
  useEffect(() => {
    authStore.hydrate();
  }, []);

  const snap = useAuthSnapshot();

  const value = useMemo(() => {
    return {
      ...snap,
      setTokensAndFetchMe: authStore.setTokensAndFetchMe,
      logout: authStore.logout,
    };
  }, [snap]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

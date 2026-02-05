import React, { createContext, useEffect, useMemo, useSyncExternalStore } from "react";
import { authStore } from "./authStore";

const AuthContext = createContext(null);

function useAuthSnapshot() {
  return useSyncExternalStore(authStore.subscribe, () => ({
    accessToken: authStore.getAccessToken(),
    refreshToken: authStore.getRefreshToken(),
    user: authStore.getUser(),
    isAuthed: authStore.isAuthed(),
  }));
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

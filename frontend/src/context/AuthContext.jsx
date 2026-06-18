import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { api, tokenStore } from "../services/api.js";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // On boot, if we have a token, restore the session.
  useEffect(() => {
    let active = true;
    async function boot() {
      if (!tokenStore.access) {
        setLoading(false);
        return;
      }
      try {
        const me = await api.me();
        if (active) setUser(me);
      } catch {
        tokenStore.clear();
      } finally {
        if (active) setLoading(false);
      }
    }
    boot();
    return () => {
      active = false;
    };
  }, []);

  const applyAuthResult = useCallback((result) => {
    if (result?.tokens) {
      tokenStore.set(result.tokens);
    }
    if (result?.user) {
      setUser(result.user);
    }
    return result;
  }, []);

  const login = useCallback(
    async (payload) => applyAuthResult(await api.login(payload)),
    [applyAuthResult]
  );

  const register = useCallback(
    async (payload) => applyAuthResult(await api.register(payload)),
    [applyAuthResult]
  );

  const verifyEmail = useCallback(
    async (payload) => applyAuthResult(await api.verifyEmail(payload)),
    [applyAuthResult]
  );

  const logout = useCallback(async () => {
    const refresh = tokenStore.refresh;
    if (refresh) {
      try {
        await api.logout(refresh);
      } catch {
        /* ignore */
      }
    }
    tokenStore.clear();
    setUser(null);
  }, []);

  const updateUser = useCallback(async (patch) => {
    const updated = await api.updateMe(patch);
    setUser(updated);
    return updated;
  }, []);

  // Optimistic local patch (e.g. role select before persisting).
  const patchUserLocal = useCallback((patch) => {
    setUser((cur) => (cur ? { ...cur, ...patch } : cur));
  }, []);

  const value = useMemo(
    () => ({
      user,
      loading,
      isAuthenticated: Boolean(user),
      login,
      register,
      verifyEmail,
      logout,
      updateUser,
      patchUserLocal,
      setUser,
    }),
    [user, loading, login, register, verifyEmail, logout, updateUser, patchUserLocal]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

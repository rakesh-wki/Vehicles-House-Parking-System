import { createContext, useContext, useState } from "react";
import api from "../lib/api";

const AuthContext = createContext(null);

const TOKEN_KEY = "parkease_token";
const USER_KEY = "parkease_user";

function loadUser() {
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(loadUser);

  const persist = (token, u) => {
    if (token) localStorage.setItem(TOKEN_KEY, token);
    if (u) localStorage.setItem(USER_KEY, JSON.stringify(u));
    setUser(u || null);
  };

  const login = async (email, password) => {
    const { data } = await api.post("/auth/login", { email, password });
    // Contract: { token, user }
    const token = data?.token;
    const u = data?.user || data;
    if (!token) throw new Error("Login did not return a token");
    persist(token, u);
    return u;
  };

  const register = async ({ name, email, password, mobile, role }) => {
    const { data } = await api.post("/auth/register", {
      name,
      email,
      password,
      mobile,
      role,
    });
    const token = data?.token;
    const u = data?.user || data;
    if (!token) throw new Error("Registration did not return a token");
    persist(token, u);
    return u;
  };

  const logout = () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthed: !!user,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

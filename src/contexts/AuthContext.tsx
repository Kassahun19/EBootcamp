import React, { createContext, useState, useEffect, useContext } from 'react';

export interface User {
  id: number;
  name: string;
  email: string;
  roleId: number;
  roleName: 'admin' | 'instructor' | 'student';
  premium: boolean;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (token: string, user: User) => void;
  logout: () => void;
  updateUser: (updates: Partial<User>) => void;
  refreshUser: () => Promise<void>;
  notifications: any[];
  loadNotifications: () => Promise<void>;
  markNotificationsAsRead: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('ezana_token'));
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState<any[]>([]);

  const login = (newToken: string, newUser: User) => {
    localStorage.setItem('ezana_token', newToken);
    setToken(newToken);
    setUser(newUser);
  };

  const logout = () => {
    localStorage.removeItem('ezana_token');
    setToken(null);
    setUser(null);
  };

  const updateUser = (updates: Partial<User>) => {
    if (user) {
      setUser({ ...user, ...updates } as User);
    }
  };

  const refreshUser = async () => {
    const currentToken = localStorage.getItem('ezana_token');
    if (!currentToken) {
      setUser(null);
      setLoading(false);
      return;
    }

    try {
      const res = await fetch('/api/auth/me', {
        headers: {
          'Authorization': `Bearer ${currentToken}`
        }
      });
      if (res.ok) {
        const u = await res.json();
        setUser(u);
      } else {
        // Clear expired session
        logout();
      }
    } catch (e) {
      console.warn("Retrying me session authentication:", e);
    } finally {
      setLoading(false);
    }
  };

  const loadNotifications = async () => {
    const currentToken = localStorage.getItem('ezana_token');
    if (!currentToken) return;

    try {
      const res = await fetch('/api/notifications', {
        headers: {
          'Authorization': `Bearer ${currentToken}`
        }
      });
      if (res.ok) {
        const list = await res.json();
        setNotifications(list);
      }
    } catch (e) {
      console.warn("Skipping notification fetch until next active system sync:", e);
    }
  };

  const markNotificationsAsRead = async () => {
    const currentToken = localStorage.getItem('ezana_token');
    if (!currentToken) return;

    try {
      const res = await fetch('/api/notifications/read-all', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${currentToken}`
        }
      });
      if (res.ok) {
        setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      }
    } catch (e) {
      console.warn("Skipping read-all bulletin sync:", e);
    }
  };

  useEffect(() => {
    refreshUser();
  }, [token]);

  useEffect(() => {
    if (user) {
      loadNotifications();
      const interval = setInterval(loadNotifications, 30000); // Polling every 30s
      return () => clearInterval(interval);
    }
  }, [user]);

  return (
    <AuthContext.Provider value={{
      user,
      token,
      loading,
      login,
      logout,
      updateUser,
      refreshUser,
      notifications,
      loadNotifications,
      markNotificationsAsRead
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be called from authorized AuthProvider parent.');
  }
  return context;
}

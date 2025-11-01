import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthChange, signOut as firebaseSignOut, signInWithEmail, signUpWithEmail } from '../firebaseClient';

type AuthContextValue = {
  firebaseUser: any | null;
  appUser: any | null;
  loading: boolean;
  signIn: (creds: { email: string; password: string }) => Promise<any>;
  signUp: (data: { name: string; email: string; password: string; role?: string }) => Promise<any>;
  signOut: () => Promise<void>;
  updateProfile?: (updates: any) => Promise<any>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [firebaseUser, setFirebaseUser] = useState<any | null>(null);
  const [appUser, setAppUser] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthChange(async (u) => {
      setLoading(true);
      if (u) {
        setFirebaseUser(u);
        // Attempt to fetch app user from backend via firebase uid
        try {
          // lazy-import to avoid circular deps
          const { getUserByFirebaseUid } = await import('../api/authApi');
          const app = await getUserByFirebaseUid(u.uid);
          setAppUser(app);
        } catch (err) {
          setAppUser(null);
        }
      } else {
        setFirebaseUser(null);
        setAppUser(null);
      }
      setLoading(false);
    });

    return () => unsub();
  }, []);

  const signIn = async (creds: { email: string; password: string }) => {
    const res = await signInWithEmail(creds);
    setFirebaseUser(res.firebaseUser);
    setAppUser(res.appUser ?? null);
    return res;
  };

  const signUp = async (data: { name: string; email: string; password: string; role?: string }) => {
    const res = await signUpWithEmail(data);
    setFirebaseUser(res.firebaseUser);
    setAppUser(res.userRecord ?? null);
    return res;
  };

  const signOut = async () => {
    await firebaseSignOut();
    setFirebaseUser(null);
    setAppUser(null);
  };

  const updateProfile = async (updates: any) => {
    if (!appUser || !appUser._id) throw new Error('No authenticated app user');
    const { updateUserRecord } = await import('../api/authApi');
    const updated = await updateUserRecord(appUser._id, updates);
    setAppUser(updated);
    return updated;
  };

  return (
    <AuthContext.Provider value={{ firebaseUser, appUser, loading, signIn, signUp, signOut, updateProfile }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};

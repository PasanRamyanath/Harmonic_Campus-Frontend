import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthChange, signOut as firebaseSignOut, signInWithEmail, signUpWithEmail } from '../firebaseClient';
import ContinueEnrollmentsModal from '../components/ContinueEnrollmentsModal';

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
  const [continueItems, setContinueItems] = useState<any[]>([]);
  const [showContinueModal, setShowContinueModal] = useState(false);

  useEffect(() => {
    const unsub = onAuthChange(async (u) => {
      setLoading(true);
      if (u) {
        setFirebaseUser(u);
        // Attempt to fetch app user from backend via firebase uid
        try {
          const { getUserByFirebaseUid } = await import('../api/authApi');
          const app = await getUserByFirebaseUid(u.uid);
          setAppUser(app);
        } catch (err) {
          setAppUser(null);
        }
        // Do NOT show continue modal here; only after explicit login
      } else {
        setFirebaseUser(null);
        setAppUser(null);
      }
      setLoading(false);
    });
    return () => unsub();
  }, []);

  // Show continue modal only after login
  const showContinueCoursesModal = async (user: any) => {
    try {
      const enrollmentApi = await import('../api/enrollmentApi');
      const courseApi = await import('../api/courseApi');
      const maybeApp = user;
      if (maybeApp && maybeApp.role !== 'instructor') {
        const enrollments = await enrollmentApi.listEnrollments({ mine: true });
        const items: any[] = [];
        for (const e of (enrollments || [])) {
          const completed = e?.progress?.completedLessons || [];
          if (!Array.isArray(completed) || completed.length === 0) continue;
          try {
            const course = await courseApi.getCourse(e.courseId);
            const modules = course?.modules || [];
            let totalLessons = 0;
            for (const m of modules) totalLessons += (m.lessons || []).length;
            if (totalLessons === 0) continue;
            const completedCount = completed.length;
            if (completedCount >= totalLessons) continue;
            const completedSet = new Set((completed || []).map((id: any) => String(id)));
            let nextLessonId: string | null = null;
            outer: for (const m of modules) {
              for (const l of (m.lessons || [])) {
                const lid = String(l.lessonId || l._id || l.id);
                if (!completedSet.has(lid)) {
                  nextLessonId = lid;
                  break outer;
                }
              }
            }
            items.push({ course, enrollment: e, nextLessonId, completedCount, totalLessons });
          } catch (err) {
            console.warn('Failed to load course for continue modal', e?.courseId, err);
          }
        }
        if (items.length > 0) {
          setContinueItems(items);
          setShowContinueModal(true);
        }
      }
    } catch (err) {
      // non-fatal
    }
  };

  const signIn = async (creds: { email: string; password: string }) => {
  const res = await signInWithEmail(creds);
  setFirebaseUser(res.firebaseUser);
  setAppUser(res.appUser ?? null);
  // Only show continue modal after login, with 3s delay
  if (res.appUser) {
    setTimeout(() => {
      showContinueCoursesModal(res.appUser);
    }, 1000);
  }
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
      <ContinueEnrollmentsModal open={showContinueModal} items={continueItems} onClose={() => setShowContinueModal(false)} />
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};

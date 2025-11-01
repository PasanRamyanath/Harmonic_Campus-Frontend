import axios from 'axios';
import { getAuth } from 'firebase/auth';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

export const createUserRecord = async (user: any) => {
  const res = await axios.post(`${API_BASE}/api/users`, user);
  return res.data;
};

export const getUserByFirebaseUid = async (uid: string) => {
  const res = await axios.get(`${API_BASE}/api/users/firebase/${uid}`);
  return res.data;
};

export const updateUserRecord = async (id: string, updates: any) => {
  // Get Firebase ID token and include in Authorization header
  const auth = getAuth();
  const currentUser = auth.currentUser;
  if (!currentUser) throw new Error('No authenticated Firebase user');
  
  const idToken = await currentUser.getIdToken();
  
  const res = await axios.patch(`${API_BASE}/api/users/${id}`, updates, {
    headers: {
      'Authorization': `Bearer ${idToken}`
    }
  });
  return res.data;
};

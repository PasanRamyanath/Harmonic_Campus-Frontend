import axios from 'axios';
import { getAuth } from 'firebase/auth';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

// #35: Always include the Firebase ID token so the backend can verify the caller's identity
async function authHeaders() {
  const auth = getAuth();
  const user = auth.currentUser;
  if (!user) throw new Error('No authenticated Firebase user');
  const token = await user.getIdToken();
  return { Authorization: `Bearer ${token}` };
}

export const createUserRecord = async (user: any) => {
  const headers = await authHeaders();
  const res = await axios.post(`${API_BASE}/api/users`, user, { headers });
  return res.data;
};

// #33: Route now requires auth — send token so caller proves identity
export const getUserByFirebaseUid = async (uid: string) => {
  const headers = await authHeaders();
  const res = await axios.get(`${API_BASE}/api/users/firebase/${uid}`, { headers });
  return res.data;
};

export const updateUserRecord = async (id: string, updates: any) => {
  const headers = await authHeaders();
  const res = await axios.patch(`${API_BASE}/api/users/${id}`, updates, { headers });
  return res.data;
};

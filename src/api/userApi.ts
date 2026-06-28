import axios from 'axios';
import { getAuth } from 'firebase/auth';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

export interface User {
  _id?: string;
  name?: string;
  username?: string;
  email: string;
  role?: 'student' | 'instructor' | 'admin';
  lessonsCompleted?: string[];
}

// #34: /api/users is now admin-only — requires auth token
async function authHeaders() {
  const auth = getAuth();
  const user = auth.currentUser;
  if (!user) throw new Error('No authenticated Firebase user');
  const token = await user.getIdToken();
  return { Authorization: `Bearer ${token}` };
}

export const getUsers = async (): Promise<User[]> => {
  const headers = await authHeaders();
  const res = await axios.get(`${API_BASE}/api/users`, { headers });
  return res.data;
};

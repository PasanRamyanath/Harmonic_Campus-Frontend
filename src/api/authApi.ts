import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

export const createUserRecord = async (user: any) => {
  const res = await axios.post(`${API_BASE}/api/users`, user);
  return res.data;
};

export const getUserByFirebaseUid = async (uid: string) => {
  const res = await axios.get(`${API_BASE}/api/users/firebase/${uid}`);
  return res.data;
};

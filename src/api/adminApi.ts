import axios from 'axios';
import { getAuth } from 'firebase/auth';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

async function authHeaders() {
  const auth = getAuth();
  const user = auth.currentUser;
  if (!user) throw new Error('Not authenticated');
  const token = await user.getIdToken();
  return { Authorization: `Bearer ${token}` };
}

export const getStats = async () => {
  const res = await axios.get(`${API_BASE}/api/admin/stats`, { headers: await authHeaders() });
  return res.data;
};

// #42: Backend now returns { items, meta } — updated to accept page/limit and expose typed response
export const getAllUsers = async (page = 1, limit = 50): Promise<{ items: any[]; meta: { page: number; limit: number; total: number; totalPages: number } }> => {
  const res = await axios.get(`${API_BASE}/api/admin/users`, { headers: await authHeaders(), params: { page, limit } });
  return res.data;
};

export const updateUserRole = async (id: string, role: string) => {
  const res = await axios.patch(`${API_BASE}/api/admin/users/${id}/role`, { role }, { headers: await authHeaders() });
  return res.data;
};

export const reviewInstructorApplication = async (id: string, approve: boolean, notes?: string) => {
  const res = await axios.patch(
    `${API_BASE}/api/admin/users/${id}/instructor-application`,
    { approve, notes },
    { headers: await authHeaders() }
  );
  return res.data;
};

export const getAllCourses = async () => {
  const res = await axios.get(`${API_BASE}/api/admin/courses`, { headers: await authHeaders() });
  return res.data;
};

export const adminUpdateCourse = async (id: string, updates: any) => {
  const res = await axios.patch(`${API_BASE}/api/admin/courses/${id}`, updates, { headers: await authHeaders() });
  return res.data;
};

export const adminDeleteCourse = async (id: string) => {
  const res = await axios.delete(`${API_BASE}/api/admin/courses/${id}`, { headers: await authHeaders() });
  return res.data;
};

export const getAllFiles = async () => {
  const res = await axios.get(`${API_BASE}/api/admin/files`, { headers: await authHeaders() });
  return res.data;
};

export const deleteFile = async (id: string) => {
  const res = await axios.delete(`${API_BASE}/api/admin/files/${id}`, { headers: await authHeaders() });
  return res.data;
};

export const applyForInstructor = async () => {
  const res = await axios.post(`${API_BASE}/api/users/apply-instructor`, {}, { headers: await authHeaders() });
  return res.data;
};

import axios from 'axios';
import { getAuth } from 'firebase/auth';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

async function authHeaders(optional = false) {
  const auth = getAuth();
  const user = auth.currentUser;
  if (!optional && !user) throw new Error('No authenticated Firebase user');
  const token = user ? await user.getIdToken() : undefined;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export const listQna = async (courseId: string, lessonId: string, page: number = 1, limit: number = 5) => {
  const headers = await authHeaders(true);
  const params: any = { courseId, lessonId, page, limit };
  const res = await axios.get(`${API_BASE}/api/qna`, { headers, params });
  return res.data; // { items: [], meta: { totalRoots, page, limit, totalPages } }
};

export const postQna = async (courseId: string, lessonId: string, content: string, parentId?: string) => {
  const headers = await authHeaders();
  const payload: any = { courseId, lessonId, content };
  if (parentId) payload.parentId = parentId;
  const res = await axios.post(`${API_BASE}/api/qna`, payload, { headers });
  return res.data;
};

export const updateQna = async (id: string, content: string) => {
  const headers = await authHeaders();
  const res = await axios.patch(`${API_BASE}/api/qna/${id}`, { content }, { headers });
  return res.data;
};

export const deleteQna = async (id: string) => {
  const headers = await authHeaders();
  const res = await axios.delete(`${API_BASE}/api/qna/${id}`, { headers });
  return res.data;
};

export default { listQna, postQna, updateQna, deleteQna };

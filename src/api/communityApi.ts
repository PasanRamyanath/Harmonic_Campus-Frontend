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

export const listThreads = async (search: string = '', page: number = 1, limit: number = 10) => {
  const headers = await authHeaders(true);
  const params: any = { page, limit };
  if (search) params.search = search;
  const res = await axios.get(`${API_BASE}/api/community`, { headers, params });
  return res.data; // { items, meta }
};

export const getThread = async (id: string) => {
  const headers = await authHeaders(true);
  const res = await axios.get(`${API_BASE}/api/community/thread/${id}`, { headers });
  return res.data; // { root, posts }
};

export const createThread = async (content: string, title?: string) => {
  const headers = await authHeaders();
  const payload: any = { content };
  if (title) payload.title = title;
  const res = await axios.post(`${API_BASE}/api/community`, payload, { headers });
  return res.data;
};

export const postReply = async (threadId: string, content: string, parentId?: string) => {
  const headers = await authHeaders();
  const payload: any = { content };
  if (parentId) payload.parentId = parentId;
  const res = await axios.post(`${API_BASE}/api/community/${threadId}/replies`, payload, { headers });
  return res.data;
};

export const updatePost = async (id: string, content: string) => {
  const headers = await authHeaders();
  const res = await axios.patch(`${API_BASE}/api/community/post/${id}`, { content }, { headers });
  return res.data;
};

export const deletePost = async (id: string) => {
  const headers = await authHeaders();
  const res = await axios.delete(`${API_BASE}/api/community/post/${id}`, { headers });
  return res.data;
};

export default { listThreads, getThread, createThread, postReply, updatePost, deletePost };

import axios from 'axios';
import { getAuth } from 'firebase/auth';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

async function authHeaders() {
  const auth = getAuth();
  const user = auth.currentUser;
  if (!user) throw new Error('No authenticated Firebase user');
  const token = await user.getIdToken();
  return { Authorization: `Bearer ${token}` };
}

export const enroll = async (courseId: string) => {
  const headers = await authHeaders();
  const res = await axios.post(`${API_BASE}/api/enrollments`, { courseId }, { headers });
  return res.data;
};

export const listEnrollments = async (opts: { mine?: boolean; courseId?: string } = {}) => {
  const headers = await authHeaders();
  const params: any = {};
  if (opts.mine) params.mine = 'true';
  if (opts.courseId) params.courseId = opts.courseId;
  const res = await axios.get(`${API_BASE}/api/enrollments`, { headers, params });
  return res.data;
};

export const updateProgress = async (courseId: string, lessonId: string, completed?: boolean) => {
  const headers = await authHeaders();
  const payload: any = { courseId, lessonId };
  if (typeof completed !== 'undefined') payload.completed = !!completed;
  const res = await axios.patch(`${API_BASE}/api/enrollments/progress`, payload, { headers });
  return res.data;
};

export const unenroll = async (courseId: string, password?: string) => {
  const headers = await authHeaders();
  // axios.delete supports a request body via the `data` option in the config
  const config: any = { headers };
  if (typeof password !== 'undefined') config.data = { password };
  const res = await axios.delete(`${API_BASE}/api/enrollments/${courseId}`, config);
  return res.data;
};

export default { enroll, listEnrollments, updateProgress, unenroll };

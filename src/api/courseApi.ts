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

async function maybeAuthHeaders() {
  const auth = getAuth();
  const user = auth.currentUser;
  if (!user) return {};
  const token = await user.getIdToken();
  return { Authorization: `Bearer ${token}` };
}

export const listCourses = async (opts: Record<string, any> = {}) => {
	// listing can be public; include auth headers if available
	const headers = await maybeAuthHeaders();
	// forward all provided opts as query params so search/tag/accessTier/sort work
	const params = { ...opts };
	// normalize boolean-like mine flag
	if (params.mine === true) params.mine = 'true';
	const res = await axios.get(`${API_BASE}/api/courses`, { headers, params });
	return res.data;
};

export const getCourse = async (id: string) => {
	// course details are public for published courses; include auth if available
	const headers = await maybeAuthHeaders();
	const res = await axios.get(`${API_BASE}/api/courses/${id}`, { headers });
	return res.data;
};

export const createCourse = async (payload: any) => {
	const headers = await authHeaders();
	const res = await axios.post(`${API_BASE}/api/courses`, payload, { headers });
	return res.data;
};

export const updateCourse = async (id: string, payload: any) => {
	const headers = await authHeaders();
	const res = await axios.patch(`${API_BASE}/api/courses/${id}`, payload, { headers });
	return res.data;
};

export const deleteCourse = async (id: string) => {
	const headers = await authHeaders();
	const res = await axios.delete(`${API_BASE}/api/courses/${id}`, { headers });
	return res.data;
};

export const uploadFile = async (file: File) => {
	const headers = await authHeaders();
	const fd = new FormData();
	fd.append('file', file);
	const res = await axios.post(`${API_BASE}/api/uploads`, fd, { headers: { ...headers, 'Content-Type': 'multipart/form-data' } });
	return res.data;
};

// Upload multiple files sequentially and return array of results
export const uploadFiles = async (files: File[]) => {
	const results: any[] = [];
	for (const f of files) {
		// reuse uploadFile
		results.push(await uploadFile(f));
	}
	return results;
};

export default { listCourses, getCourse, createCourse, updateCourse, deleteCourse };


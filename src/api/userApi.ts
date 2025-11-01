import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

export interface User {
  _id?: string;
  name: string;
  email: string;
  role?: 'student' | 'instructor' | 'admin';
  lessonsCompleted?: string[];
}

export const getUsers = async (): Promise<User[]> => {
  const res = await axios.get(`${API_BASE}/api/users`);
  return res.data;
};

export const addUser = async (user: User): Promise<User> => {
  const res = await axios.post(`${API_BASE}/api/users`, user);
  return res.data;
};

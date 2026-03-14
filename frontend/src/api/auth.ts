import client from './client';
import type { User } from '../types/auth';

export async function login(email: string, password: string): Promise<{ token: string }> {
  const res = await client.post<{ token: string }>('/auth/login', { email, password });
  return res.data;
}

export async function register(name: string, email: string, password: string): Promise<User> {
  const res = await client.post<User>('/auth/register', { name, email, password });
  return res.data;
}

export async function getMe(): Promise<User> {
  const res = await client.get<User>('/auth/me');
  return res.data;
}

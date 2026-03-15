import client from './client';

export interface UserSummary {
  id: number;
  name: string;
  email: string;
}

export async function getUsers(): Promise<UserSummary[]> {
  const res = await client.get<UserSummary[]>('/users');
  return res.data;
}

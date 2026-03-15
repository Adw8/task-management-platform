import client from './client';

export interface Comment {
  id: number;
  body: string;
  user_id: number;
  user_name: string;
  created_at: string;
  updated_at: string;
}

export async function getComments(taskId: number): Promise<Comment[]> {
  const res = await client.get<Comment[]>(`/tasks/${taskId}/comments`);
  return res.data;
}

export async function createComment(taskId: number, body: string): Promise<Comment> {
  const res = await client.post<Comment>(`/tasks/${taskId}/comments`, { body });
  return res.data;
}

export async function updateComment(taskId: number, commentId: number, body: string): Promise<Comment> {
  const res = await client.put<Comment>(`/tasks/${taskId}/comments/${commentId}`, { body });
  return res.data;
}

export async function deleteComment(taskId: number, commentId: number): Promise<void> {
  await client.delete(`/tasks/${taskId}/comments/${commentId}`);
}

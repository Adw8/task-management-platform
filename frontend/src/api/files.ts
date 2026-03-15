import client from './client';

export interface TaskFile {
  id: number;
  original_name: string;
  mime_type: string;
  size: number;
  uploaded_by: string;
  created_at: string;
}

export async function getFiles(taskId: number): Promise<TaskFile[]> {
  const res = await client.get<TaskFile[]>(`/tasks/${taskId}/files`);
  return res.data;
}

export async function uploadFiles(taskId: number, files: File[]): Promise<TaskFile[]> {
  const form = new FormData();
  files.forEach((f) => form.append('files', f));
  const res = await client.post<TaskFile[]>(`/tasks/${taskId}/files`, form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return res.data;
}

export async function deleteFile(taskId: number, fileId: number): Promise<void> {
  await client.delete(`/tasks/${taskId}/files/${fileId}`);
}

export function getFileDownloadUrl(taskId: number, fileId: number): string {
  const base = import.meta.env['VITE_API_URL'] ?? '';
  return `${base}/tasks/${taskId}/files/${fileId}`;
}

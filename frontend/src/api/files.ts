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

export async function downloadFile(taskId: number, fileId: number, originalName: string): Promise<void> {
  const res = await client.get(`/tasks/${taskId}/files/${fileId}`, { responseType: 'blob' });
  const url = URL.createObjectURL(res.data);
  const a = document.createElement('a');
  a.href = url;
  a.download = originalName;
  a.click();
  URL.revokeObjectURL(url);
}

import { useEffect, useRef, useState } from 'react';
import {
  deleteFile, getFileDownloadUrl, getFiles, uploadFiles, type TaskFile,
} from '../api/files';
import '../styles/file-upload.css';

interface Props {
  taskId: number;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function FileUpload({ taskId }: Props) {
  const [files, setFiles] = useState<TaskFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    getFiles(taskId)
      .then(setFiles)
      .finally(() => setLoading(false));
  }, [taskId]);

  async function handleUpload(selected: FileList | null) {
    if (!selected || selected.length === 0) return;
    setError('');
    setUploading(true);
    try {
      const uploaded = await uploadFiles(taskId, Array.from(selected));
      setFiles((prev) => [...prev, ...uploaded]);
    } catch {
      setError('Upload failed. Check file type and size (max 10 MB).');
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  }

  async function handleDelete(fileId: number) {
    await deleteFile(taskId, fileId);
    setFiles((prev) => prev.filter((f) => f.id !== fileId));
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    handleUpload(e.dataTransfer.files);
  }

  return (
    <div className="file-upload-section">
      <h2>Attachments {files.length > 0 && <span className="file-count">({files.length})</span>}</h2>

      <div
        className={`drop-zone ${dragOver ? 'drop-zone--active' : ''} ${uploading ? 'drop-zone--uploading' : ''}`}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
      >
        <input
          ref={inputRef}
          type="file"
          multiple
          hidden
          onChange={(e) => handleUpload(e.target.files)}
        />
        <span className="drop-zone-icon">📎</span>
        <span className="drop-zone-text">
          {uploading ? 'Uploading...' : 'Drop files here or click to upload'}
        </span>
        <span className="drop-zone-hint">PDF, images, Word, Excel — max 10 MB each</span>
      </div>

      {error && <p className="file-error">{error}</p>}

      {loading ? (
        <p className="files-loading">Loading...</p>
      ) : files.length > 0 && (
        <ul className="file-list">
          {files.map((f) => (
            <li key={f.id} className="file-item">
              <span className="file-icon">{f.mime_type.startsWith('image/') ? '🖼️' : '📄'}</span>
              <div className="file-info">
                <a
                  href={getFileDownloadUrl(taskId, f.id)}
                  className="file-name"
                  download={f.original_name}
                >
                  {f.original_name}
                </a>
                <span className="file-meta">{formatBytes(f.size)} · {f.uploaded_by}</span>
              </div>
              <button className="btn-file-delete" onClick={() => handleDelete(f.id)} title="Delete file">×</button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

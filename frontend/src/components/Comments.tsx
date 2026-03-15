import { useEffect, useRef, useState } from 'react';
import {
  createComment, deleteComment, getComments, updateComment, type Comment,
} from '../api/comments';
import useAuthStore from '../store/authStore';
import '../styles/comments.css';

interface Props {
  taskId: number;
}

export default function Comments({ taskId }: Props) {
  const currentUser = useAuthStore((s) => s.user);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [body, setBody] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editBody, setEditBody] = useState('');
  const editRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    getComments(taskId)
      .then(setComments)
      .finally(() => setLoading(false));
  }, [taskId]);

  useEffect(() => {
    if (editingId !== null) editRef.current?.focus();
  }, [editingId]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!body.trim()) return;
    setSubmitting(true);
    try {
      const comment = await createComment(taskId, body.trim());
      setComments((prev) => [...prev, { ...comment, user_id: Number(currentUser!.id), user_name: currentUser!.name }]);
      setBody('');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleUpdate(commentId: number) {
    if (!editBody.trim()) return;
    const updated = await updateComment(taskId, commentId, editBody.trim());
    setComments((prev) => prev.map((c) => (c.id === commentId ? { ...c, ...updated } : c)));
    setEditingId(null);
  }

  async function handleDelete(commentId: number) {
    await deleteComment(taskId, commentId);
    setComments((prev) => prev.filter((c) => c.id !== commentId));
  }

  function startEdit(comment: Comment) {
    setEditingId(comment.id);
    setEditBody(comment.body);
  }

  return (
    <div className="comments-section">
      <h2>Comments {comments.length > 0 && <span className="comment-count">({comments.length})</span>}</h2>

      {loading ? (
        <p className="comments-loading">Loading...</p>
      ) : comments.length === 0 ? (
        <p className="comments-empty">No comments yet. Be the first to comment.</p>
      ) : (
        <ul className="comment-list">
          {comments.map((c) => (
            <li key={c.id} className="comment-item">
              <div className="comment-header">
                <span className="comment-author">{c.user_name}</span>
                <span className="comment-date">{new Date(c.created_at).toLocaleString()}</span>
                {c.updated_at !== c.created_at && <span className="comment-edited">(edited)</span>}
              </div>

              {editingId === c.id ? (
                <div className="comment-edit">
                  <textarea
                    ref={editRef}
                    value={editBody}
                    onChange={(e) => setEditBody(e.target.value)}
                    rows={3}
                  />
                  <div className="comment-edit-actions">
                    <button className="btn-comment-save" onClick={() => handleUpdate(c.id)}>Save</button>
                    <button className="btn-comment-cancel" onClick={() => setEditingId(null)}>Cancel</button>
                  </div>
                </div>
              ) : (
                <p className="comment-body">{c.body}</p>
              )}

              {Number(currentUser?.id) === c.user_id && editingId !== c.id && (
                <div className="comment-actions">
                  <button className="btn-comment-action" onClick={() => startEdit(c)}>Edit</button>
                  <button className="btn-comment-action btn-comment-delete" onClick={() => handleDelete(c.id)}>Delete</button>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}

      <form className="comment-form" onSubmit={handleSubmit}>
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Write a comment..."
          rows={3}
          disabled={submitting}
        />
        <div className="comment-form-footer">
          <button type="submit" className="btn-post-comment" disabled={submitting || !body.trim()}>
            {submitting ? 'Posting...' : 'Post Comment'}
          </button>
        </div>
      </form>
    </div>
  );
}

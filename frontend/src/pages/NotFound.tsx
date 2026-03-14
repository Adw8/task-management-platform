import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div style={{ textAlign: 'center', padding: '60px 20px' }}>
      <h1 style={{ fontSize: '48px', color: '#111' }}>404</h1>
      <p style={{ color: '#666', marginTop: '8px' }}>Page not found</p>
      <Link to="/" style={{ color: '#2563eb', marginTop: '16px', display: 'inline-block' }}>
        Go home
      </Link>
    </div>
  );
}

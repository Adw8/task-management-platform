import useAuthStore from '../store/authStore';
import '../styles/profile.css';

export default function Profile() {
  const user = useAuthStore((s) => s.user);

  if (!user) return null;

  const memberSince = new Date(user.created_at).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className="profile-page">
      <div className="profile-header">
        <h1>Profile</h1>
      </div>

      <div className="profile-card">
        <div className="profile-avatar">{user.name.charAt(0).toUpperCase()}</div>
        <div className="profile-info">
          <h2 className="profile-name">{user.name}</h2>
          <p className="profile-email">{user.email}</p>
          <p className="profile-since">Member since {memberSince}</p>
        </div>
      </div>

      <div className="profile-details">
        <h2>Account Details</h2>
        <div className="profile-field">
          <span className="profile-field-label">Full Name</span>
          <span className="profile-field-value">{user.name}</span>
        </div>
        <div className="profile-field">
          <span className="profile-field-label">Email</span>
          <span className="profile-field-value">{user.email}</span>
        </div>
        <div className="profile-field">
          <span className="profile-field-label">Member Since</span>
          <span className="profile-field-value">{memberSince}</span>
        </div>
      </div>
    </div>
  );
}

import { useEffect, useState } from 'react';
import { getMe } from '../api/auth';
import useAuthStore from '../store/authStore';

export function useAuthInit() {
  const { token, setUser, logout } = useAuthStore();
  // If there's no token, we're immediately ready — no async work needed
  const [ready, setReady] = useState(!token);

  useEffect(() => {
    if (!token) return;

    getMe()
      .then((user) => setUser(user))
      .catch(() => logout())
      .finally(() => setReady(true));
  }, [token, setUser, logout]);

  return ready;
}

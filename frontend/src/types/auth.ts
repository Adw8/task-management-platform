export interface User {
  id: string;
  name: string;
  email: string;
  created_at: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  login: (token: string, user: User) => void;
  logout: () => void;
}

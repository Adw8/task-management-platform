import { create } from 'zustand';
import { getUsers, type UserSummary } from '../api/users';

interface UsersState {
  users: UserSummary[];
  loaded: boolean;
  fetch: () => Promise<void>;
}

const useUsersStore = create<UsersState>((set, get) => ({
  users: [],
  loaded: false,

  fetch: async () => {
    if (get().loaded) return;
    const users = await getUsers();
    set({ users, loaded: true });
  },
}));

export default useUsersStore;

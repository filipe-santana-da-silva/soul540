const TOKEN_KEY = 'soul540_token';
const USER_KEY = 'soul540_user';

export const Storage = {
  getToken: () => localStorage.getItem(TOKEN_KEY),
  setToken: (t: string) => localStorage.setItem(TOKEN_KEY, t),
  getUser: <T>(): T | null => {
    const d = localStorage.getItem(USER_KEY);
    return d ? JSON.parse(d) : null;
  },
  setUser: <T>(u: T) => localStorage.setItem(USER_KEY, JSON.stringify(u)),
  clear: () => { localStorage.removeItem(TOKEN_KEY); localStorage.removeItem(USER_KEY); },
};

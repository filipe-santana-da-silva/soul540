const TOKEN_KEY = 'soul540_token';
const USER_KEY = 'soul540_user';

export const TokenStorage = {
  getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  },

  setToken(token: string): void {
    localStorage.setItem(TOKEN_KEY, token);
  },

  removeToken(): void {
    localStorage.removeItem(TOKEN_KEY);
  },

  getUser<T>(): T | null {
    const data = localStorage.getItem(USER_KEY);
    if (!data) return null;
    return JSON.parse(data) as T;
  },

  setUser<T>(user: T): void {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  },

  removeUser(): void {
    localStorage.removeItem(USER_KEY);
  },

  clear(): void {
    this.removeToken();
    this.removeUser();
  },
};

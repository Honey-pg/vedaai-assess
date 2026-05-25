import axios from 'axios';

/** Normalize API origin — strip trailing slashes and stray `/api`. */
export function normalizeBackendOrigin(raw?: string): string {
  let s = (raw ?? '').trim().replace(/\/+$/, '');
  if (/\/api$/i.test(s)) {
    s = s.replace(/\/api$/i, '').replace(/\/+$/, '');
  }
  // Prefer 127.0.0.1: some setups resolve `localhost` to ::1 while the API listens on IPv4 only → connection refused.
  return s || 'http://127.0.0.1:4000';
}

export const API_BACKEND_ORIGIN = normalizeBackendOrigin(process.env.NEXT_PUBLIC_API_URL);

let getTokenGetter: () => Promise<string | null> = async () => null;

/** Called from Clerk `Providers` once `useAuth` is mounted. */
export function setBackendAuthGetter(fn: () => Promise<string | null>): void {
  getTokenGetter = fn;
}

export const apiClient = axios.create({
  baseURL: `${API_BACKEND_ORIGIN}/api`,
  timeout: 30000,
});

apiClient.interceptors.request.use(async (config) => {
  const token = await getTokenGetter();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

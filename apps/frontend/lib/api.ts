const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

export const api = {
  get: async (path: string) => {
    const res = await fetch(`${BASE_URL}${path}`, { credentials: 'include' });
    return res.json();
  },
  post: async (path: string, body: any) => {
    const res = await fetch(`${BASE_URL}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      credentials: 'include',
    });
    return res.json();
  },
};

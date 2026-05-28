import type { StoredAuth, User } from "./auth";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "";

async function request<T>(path: string, opts?: { method?: string; body?: any; token?: string }): Promise<T> {
  const method = opts?.method || "GET";
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (opts?.token) headers["Authorization"] = `Bearer ${opts.token}`;

  const res = await fetch(`${API_BASE}/api${path}`, {
    method,
    headers,
    body: opts?.body ? JSON.stringify(opts.body) : undefined,
  });

  const data = (await res.json().catch(() => ({}))) as any;
  if (!res.ok) throw new Error(data?.error || `Erro (${res.status})`);
  return data as T;
}

export const api = {
  register: (name: string, username: string, password: string) =>
    request<{ user: any }>("/auth/register", { method: "POST", body: { name, username, password } }),

  logout: (token: string) =>
    request<{ ok: true }>("/auth/logout", { method: "POST", token }),

  login: (username: string, password: string) =>
    request<{ token: string; user: User }>("/auth/login", { method: "POST", body: { username, password } }),

  me: (token: string) => request<{ user: any }>("/me", { token }),

  updateMe: (token: string, payload: { name?: string; password?: string }) =>
    request<{ user: User }>("/me", { method: "PUT", token, body: payload }),

  adminListUsers: (token: string, params: { q?: string; page?: number; limit?: number } = {}) => {
    const q = encodeURIComponent(params.q || "");
    const page = params.page || 1;
    const limit = params.limit || 10;
    return request<{ items: User[]; total: number; page: number; limit: number }>(
      `/admin/users?q=${q}&page=${page}&limit=${limit}`,
      { token }
    );
  },

  adminCreateUser: (token: string, payload: { name: string; username: string; password: string; role: "admin" | "user" }) =>
    request<{ user: User }>("/admin/users", { method: "POST", token, body: payload }),

  adminUpdateUser: (token: string, id: number, payload: Partial<User>) =>
    request<{ user: User }>(`/admin/users/${id}`, { method: "PUT", token, body: payload }),

  adminResetPassword: (token: string, id: number, newPassword: string) =>
    request<{ ok: true }>(`/admin/users/${id}/reset-password`, { method: "POST", token, body: { newPassword } }),

  adminToggleBlock: (token: string, id: number) =>
    request<{ user: User }>(`/admin/users/${id}/toggle-block`, { method: "POST", token }),


  adminGrantTrial: (token: string, id: number) =>
    request<{ user: User }>(`/admin/users/${id}/grant-trial`, { method: "POST", token }),

  adminGrantMonth: (token: string, id: number) =>
    request<{ user: User }>(`/admin/users/${id}/grant-month`, { method: "POST", token }),

  adminGrantLifetime: (token: string, id: number) =>
    request<{ user: User }>(`/admin/users/${id}/grant-lifetime`, { method: "POST", token }),

  adminDeleteUser: (token: string, id: number) =>
    request<{ ok: true }>(`/admin/users/${id}`, { method: "DELETE", token }),

  // Estratégias
  listStrategies: () => request<any[]>("/strategies"),
  createStrategy: (data: { name: string; nums: number[]; color?: string }) =>
    request<any>("/strategies", { method: "POST", body: data }),
  updateStrategy: (id: number | string, data: { name: string; nums: number[]; color?: string }) =>
    request<any>(`/strategies/${id}`, { method: "PUT", body: data }),
  deleteStrategy: (id: number | string) =>
    request<{ success: true }>(`/strategies/${id}`, { method: "DELETE" }),
};

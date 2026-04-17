const BASE = "http://localhost:3000";

async function req<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) throw new Error(`API error ${res.status}`);
  return res.json();
}

export interface Complaint {
  id: string;
  title: string;
  description?: string;
  summary?: string;
  category: string;
  ward: string;
  photoPath?: string;
  lat: number;
  lng: number;
  address: string;
  status: string;
  severity: string;
  upvoteCount: number;
  priorityScore: number;
  createdAt: string;
  department_id?: string;
  dept_short?: string;
  dept_name?: string;
}

export interface Department {
  id: string;
  name: string;
  short: string;
  scope: string;
  officer_name: string;
  officer_phone: string;
  office_address: string;
  lat: number;
  lng: number;
  active_complaints: number;
}

export function getStats() {
  return req<{
    success: boolean;
    data: {
      total_complaints: number;
      resolution_pct: number;
      avg_resolution_hours: number;
    };
  }>("/api/stats");
}

export function getFeed(params?: {
  category?: string;
  status?: string;
  ward?: string;
}) {
  const q = new URLSearchParams(params as Record<string, string>).toString();
  return req<{ success: boolean; total: number; data: Complaint[] }>(
    `/api/feed${q ? "?" + q : ""}`,
  );
}

export function getComplaint(id: string) {
  return req<{ success: boolean; data: Complaint }>(`/api/feed/${id}`);
}

export function upvoteComplaint(id: string) {
  return req<{ success: boolean; upvoteCount: number; priorityScore: number }>(
    `/api/feed/${id}/upvote`,
    {
      method: "PATCH",
    },
  );
}

export function updateStatus(id: string, status: string) {
  return req<{ success: boolean; status: string; data: Complaint }>(
    `/api/feed/${id}/status`,
    {
      method: "PATCH",
      body: JSON.stringify({ status }),
    },
  );
}

export async function raiseComplaint(data: FormData) {
  const res = await fetch(`${BASE}/api/report`, { method: "POST", body: data });
  if (!res.ok) throw new Error(`API error ${res.status}`);
  return res.json() as Promise<{
    success: boolean;
    merged: boolean;
    complaint?: any;
    problem?: any;
    message?: string;
  }>;
}

export function getDepartments() {
  return req<{ success: boolean; data: Department[] }>("/api/departments");
}

export function getDepartment(id: string) {
  return req<{ success: boolean; data: Department }>(`/api/departments/${id}`);
}

export function registerUser(data: {
  name: string;
  phone?: string;
  email?: string;
}) {
  return req("/api/users/register", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function getDashboard(userId: string) {
  return req<{
    success: boolean;
    data: {
      profile: { name: string; badge: string; points: number; lang: string };
      my_complaints: Complaint[];
      status_breakdown: {
        Pending: number;
        InProgress: number;
        Resolved: number;
      };
      contributions: number;
    };
  }>(`/api/users/${userId}`);
}

export function getNotifications(userId: string) {
  return req<{
    success: boolean;
    data: { id: string; message: string; read: number; created_at: string }[];
  }>(`/api/users/${userId}/notifications`);
}

export function askAI(query: string, lang = "en") {
  return req<{ success: boolean; query: string; answer: string }>(
    `/api/ai/ask`,
    {
      method: "POST",
      body: JSON.stringify({ query, lang }),
    },
  );
}

export function getFAQ() {
  return req<{ success: boolean; data: { q: string; a: string }[] }>(
    "/api/ai/faq",
  );
}

export function translateText(text: string) {
  return req<{ success: boolean; original: string; translated: string }>(
    "/api/ai/translate",
    {
      method: "POST",
      body: JSON.stringify({ text }),
    },
  );
}

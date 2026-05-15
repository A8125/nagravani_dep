const isLocalDevHost =
  typeof window !== "undefined" &&
  ["localhost", "127.0.0.1"].includes(window.location.hostname);

const BASE =
  import.meta.env.VITE_API_URL ||
  (typeof window !== "undefined"
    ? (isLocalDevHost ? "http://localhost:3000" : window.location.origin)
    : "http://localhost:3000");

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
  photo_url?: string | null;
  photos?: string[];
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
  comment_count?: number;
  department_id?: string | null;
  dept_short?: string | null;
  dept_name?: string | null;
}

export interface ProblemDetail extends Complaint {
  officer_phone?: string | null;
  resolved_at?: string | null;
}

export interface LinkedComplaint extends Complaint {
  problem_id?: string | null;
  citizen_name?: string | null;
}

export interface ProblemComment {
  id: number;
  problem_id: string;
  author_name: string;
  content: string;
  is_official: boolean;
  created_at: string;
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

export interface WardStat {
  ward: string;
  count: number;
  avg_priority: number;
  top_category: string | null;
  severity?: string | null;
}

export interface ComplaintSubmissionResult {
  success: boolean;
  merged: boolean;
  complaint?: Record<string, unknown>;
  problem?: Record<string, unknown>;
  message?: string;
}

export interface GarbageSchedule {
  id: string | number;
  ward: string;
  collection_days: string[];
  time_slot: string;
  vehicle_number: string;
  updated_at: string;
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

export function getWardStats() {
  return req<WardStat[]>("/api/stats/wards");
}

export function getFeed(params?: {
  category?: string;
  status?: string;
  ward?: string;
  limit?: string | number;
  offset?: string | number;
}) {
  const q = new URLSearchParams(
    Object.entries(params ?? {}).reduce<Record<string, string>>((acc, [key, value]) => {
      if (value !== undefined && value !== null) acc[key] = String(value);
      return acc;
    }, {}),
  ).toString();
  return req<{ success: boolean; total: number; data: Complaint[] }>(
    `/api/feed${q ? "?" + q : ""}`,
  );
}

export function getComplaint(id: string) {
  return req<{
    success: boolean;
    problem: ProblemDetail;
    complaints: LinkedComplaint[];
  }>(`/api/feed/${id}`);
}

export function getProblemComments(id: string) {
  return req<{ success: boolean; data: ProblemComment[] }>(
    `/api/feed/${id}/comments`,
  );
}

export function createProblemComment(
  id: string,
  data: { author_name: string; content: string; aadhaar_last4?: string },
) {
  return req<{ success: boolean; data: ProblemComment }>(
    `/api/feed/${id}/comments`,
    {
      method: "POST",
      body: JSON.stringify(data),
    },
  );
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
  return res.json() as Promise<ComplaintSubmissionResult>;
}

export function getDepartments() {
  return req<{ success: boolean; data: Department[] }>("/api/departments");
}

export function getDepartment(id: string) {
  return req<{ success: boolean; data: Department }>(`/api/departments/${id}`);
}

export function getGarbageSchedules() {
  return req<{ success: boolean; data: GarbageSchedule[] }>("/api/garbage/schedules");
}

export function getGarbageSchedule(ward: string) {
  return req<{ success: boolean; data: GarbageSchedule }>(
    `/api/garbage/schedule/${encodeURIComponent(ward)}`,
  );
}

export function getGarbageMissedCount(ward: string) {
  return req<{ success: boolean; ward: string; date: string; count: number }>(
    `/api/garbage/missed/${encodeURIComponent(ward)}`,
  );
}

export function reportGarbageMissed(data: { ward: string; aadhaar_last4: string }) {
  return req<{
    success: boolean;
    ward: string;
    date: string;
    count: number;
    auto_complaint_raised: boolean;
  }>("/api/garbage/missed", {
    method: "POST",
    body: JSON.stringify(data),
  });
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

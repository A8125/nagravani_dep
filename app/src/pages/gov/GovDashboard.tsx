import { Fragment, useEffect, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import {
  ArrowUpDown,
  ChevronDown,
  Loader2,
  LogOut,
  ShieldCheck,
  ArrowLeft,
  Trash2,
} from "lucide-react";
import {
  createProblemComment,
  deleteProblemComment,
  getGovComplaints,
  getProblemComments,
  updateStatus,
  type GovComplaint,
  type ProblemComment,
} from "@/lib/api";
import { getGovSession, logoutDepartment } from "@/lib/govAuth";
import { Button } from "@/components/ui/button";

const STATUS_OPTIONS = ["all", "pending", "inProgress", "resolved"] as const;
const STATUS_LABELS: Record<string, string> = {
  pending: "Pending",
  inProgress: "In Progress",
  resolved: "Resolved",
};
const STATUS_STYLES: Record<string, string> = {
  pending:
    "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300",
  inProgress:
    "border-blue-200 bg-blue-50 text-blue-800 dark:border-blue-500/30 dark:bg-blue-500/10 dark:text-blue-300",
  resolved:
    "border-green-200 bg-green-50 text-green-800 dark:border-green-500/30 dark:bg-green-500/10 dark:text-green-300",
};

function formatStatus(status: string) {
  return STATUS_LABELS[status] || status;
}

function formatDateLabel(value: string) {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "";
  return parsed.toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function isThisMonth(value?: string | null) {
  if (!value) return false;
  const current = new Date();
  const date = new Date(value);
  return (
    !Number.isNaN(date.getTime()) &&
    date.getMonth() === current.getMonth() &&
    date.getFullYear() === current.getFullYear()
  );
}

function timeAgo(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  const diffSeconds = Math.max(0, Math.floor((Date.now() - date.getTime()) / 1000));
  if (diffSeconds < 60) return "just now";

  const units = [
    ["day", 86400],
    ["hour", 3600],
    ["minute", 60],
  ] as const;

  for (const [label, size] of units) {
    const count = Math.floor(diffSeconds / size);
    if (count >= 1) return `${count} ${label}${count === 1 ? "" : "s"} ago`;
  }

  return "just now";
}

function StatCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: string | number;
  hint: string;
}) {
  return (
    <div className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-[#1a1a1a]">
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-stone-500 dark:text-gray-400">
        {label}
      </p>
      <div className="mt-3 flex items-end justify-between gap-3">
        <p className="text-3xl text-slate-800 dark:text-white">{value}</p>
        <p className="text-right text-xs leading-5 text-stone-500 dark:text-gray-400">{hint}</p>
      </div>
    </div>
  );
}

function OfficialCommentCard({
  comment,
  onDeleteComment,
  deletingCommentId,
}: {
  comment: ProblemComment;
  onDeleteComment: (commentId: number) => void;
  deletingCommentId: number | null;
}) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-[#162234] px-4 py-3 text-white shadow-sm dark:border-slate-600 dark:bg-[#101b2b]">
      <div className="mb-2 flex flex-wrap items-center gap-2">
        <span className="inline-flex items-center gap-1 rounded-full border border-white/15 bg-white/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-white/85">
          <ShieldCheck className="h-3.5 w-3.5" />
          Official Response
        </span>
        <span className="text-sm font-semibold text-white">{comment.author_name}</span>
        <span className="text-xs text-white/60">{timeAgo(comment.created_at)}</span>
        <button
          type="button"
          onClick={() => onDeleteComment(comment.id)}
          disabled={deletingCommentId === comment.id}
          className="ml-auto rounded-full p-1 text-white/50 transition-colors hover:bg-white/10 hover:text-white"
          aria-label="Delete comment"
        >
          {deletingCommentId === comment.id ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Trash2 className="h-3.5 w-3.5" />
          )}
        </button>
      </div>
      <p className="text-sm leading-6 text-white/92">{comment.content}</p>
    </div>
  );
}

type ExpandedPanelProps = {
  complaintId: string;
  comments: ProblemComment[];
  commentsLoading: boolean;
  commentDraft: string;
  commentSubmitting: boolean;
  onDraftChange: (value: string) => void;
  onSubmitComment: () => void;
  onDeleteComment: (commentId: number) => void;
  deletingCommentId: number | null;
};

function ExpandedPanel({
  complaintId,
  comments,
  commentsLoading,
  commentDraft,
  commentSubmitting,
  onDraftChange,
  onSubmitComment,
  onDeleteComment,
  deletingCommentId,
}: ExpandedPanelProps) {
  return (
    <tr>
      <td colSpan={9} className="bg-stone-50/70 px-4 py-4 dark:bg-[#141416]">
        <div className="rounded-2xl border border-stone-200 bg-white p-4 dark:border-white/10 dark:bg-[#111214]">
          <div className="grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
            <div>
              <div className="mb-3 flex items-center justify-between gap-3">
                <div>
                  <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-stone-500 dark:text-gray-400">
                    Discussion
                  </h3>
                  <p className="mt-1 text-sm text-stone-500 dark:text-gray-400">
                    Citizen messages and official responses for this complaint.
                  </p>
                </div>
                <span className="text-xs text-stone-500 dark:text-gray-400">{complaintId}</span>
              </div>

              <div className="space-y-3">
                {commentsLoading && (
                  <div className="flex min-h-24 items-center justify-center rounded-2xl border border-dashed border-stone-200 bg-cream dark:border-white/10 dark:bg-[#18191c]">
                    <Loader2 className="h-5 w-5 animate-spin text-stone-500 dark:text-gray-400" />
                  </div>
                )}

                {!commentsLoading && comments.length === 0 && (
                  <div className="rounded-2xl border border-dashed border-stone-200 bg-cream px-4 py-6 text-center text-sm text-stone-500 dark:border-white/10 dark:bg-[#18191c] dark:text-gray-400">
                    No comments yet.
                  </div>
                )}

                {!commentsLoading &&
                  comments.map((comment) =>
                    comment.is_official ? (
                      <OfficialCommentCard
                        key={comment.id}
                        comment={comment}
                        onDeleteComment={onDeleteComment}
                        deletingCommentId={deletingCommentId}
                      />
                    ) : (
                      <div
                        key={comment.id}
                        className="rounded-2xl border border-stone-200 bg-cream px-4 py-3 dark:border-white/10 dark:bg-[#18191c]"
                      >
                        <div className="mb-1 flex flex-wrap items-center gap-2">
                          <span className="text-sm font-medium text-charcoal dark:text-white">
                            {comment.author_name}
                          </span>
                          <span className="text-xs text-stone-500 dark:text-gray-400">
                            {timeAgo(comment.created_at)}
                          </span>
                          <button
                            type="button"
                            onClick={() => onDeleteComment(comment.id)}
                            disabled={deletingCommentId === comment.id}
                            className="ml-auto rounded-full p-1 text-stone transition-colors hover:bg-red-50 hover:text-red-600"
                            aria-label="Delete comment"
                          >
                            {deletingCommentId === comment.id ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <Trash2 className="h-3.5 w-3.5" />
                            )}
                          </button>
                        </div>
                        <p className="text-sm leading-6 text-stone-600 dark:text-gray-300">
                          {comment.content}
                        </p>
                      </div>
                    ),
                  )}
              </div>
            </div>

            <div className="rounded-2xl border border-stone-200 bg-cream p-4 dark:border-white/10 dark:bg-[#18191c]">
              <div className="mb-3">
                <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-stone-500 dark:text-gray-400">
                  Add Official Comment
                </h3>
                <p className="mt-1 text-sm text-stone-500 dark:text-gray-400">
                  This response is published as a verified department update.
                </p>
              </div>

              <textarea
                value={commentDraft}
                onChange={(event) => onDraftChange(event.target.value.slice(0, 500))}
                placeholder="Share inspection notes, work order progress, or closure details"
                className="min-h-32 w-full rounded-2xl border border-stone-200 bg-white px-3 py-3 text-sm text-charcoal outline-none transition focus:border-stone-400 dark:border-white/10 dark:bg-[#101114] dark:text-white"
              />
              <div className="mt-2 flex items-center justify-between gap-3">
                <span className="text-xs text-stone-500 dark:text-gray-400">{commentDraft.length}/500</span>
                <Button
                  type="button"
                  onClick={onSubmitComment}
                  disabled={commentSubmitting || commentDraft.trim().length === 0}
                  className="rounded-xl bg-charcoal px-4 text-white hover:bg-charcoal/90 dark:bg-white dark:text-[#0f0f0f] dark:hover:bg-white/90"
                >
                  {commentSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Post official response
                </Button>
              </div>
            </div>
          </div>
        </div>
      </td>
    </tr>
  );
}

export default function GovDashboard() {
  const session = getGovSession();
  const [complaints, setComplaints] = useState<GovComplaint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [wardFilter, setWardFilter] = useState("all");
  const [sortBy, setSortBy] = useState<"priorityScore" | "days_open">("priorityScore");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [commentsById, setCommentsById] = useState<Record<string, ProblemComment[]>>({});
  const [commentsLoadingId, setCommentsLoadingId] = useState<string | null>(null);
  const [commentDrafts, setCommentDrafts] = useState<Record<string, string>>({});
  const [commentSubmittingId, setCommentSubmittingId] = useState<string | null>(null);
  const [updatingStatusId, setUpdatingStatusId] = useState<string | null>(null);
  const [deletingCommentId, setDeletingCommentId] = useState<number | null>(null);

  useEffect(() => {
    if (!session?.department) return;

    const run = async () => {
      setLoading(true);
      setError("");
      try {
        const response = await getGovComplaints(session.department);
        setComplaints(response.data);
      } catch {
        setError("Could not load department complaints.");
      } finally {
        setLoading(false);
      }
    };

    run();
  }, [session?.department]);

  if (!session) {
    return <Navigate to="/gov" replace />;
  }

  const wards = Array.from(new Set(complaints.map((item) => item.ward).filter(Boolean))).sort();

  const filteredComplaints = complaints
    .filter((item) => (statusFilter === "all" ? true : item.status === statusFilter))
    .filter((item) => (wardFilter === "all" ? true : item.ward === wardFilter))
    .sort((a, b) => {
      const direction = sortDirection === "asc" ? 1 : -1;
      return (a[sortBy] - b[sortBy]) * direction;
    });

  const pendingCount = complaints.filter((item) => item.status === "pending").length;
  const inProgressCount = complaints.filter((item) => item.status === "inProgress").length;
  const resolvedThisMonth = complaints.filter(
    (item) => item.status === "resolved" && isThisMonth(item.resolved_at),
  ).length;
  const resolvedWithAge = complaints.filter(
    (item) => item.status === "resolved" && item.resolved_at,
  );
  const avgResolutionDays = resolvedWithAge.length
    ? (
        resolvedWithAge.reduce((total, item) => {
          if (!item.resolved_at) return total;
          const diff = new Date(item.resolved_at).getTime() - new Date(item.createdAt).getTime();
          return total + Math.max(0, diff / 86400000);
        }, 0) / resolvedWithAge.length
      ).toFixed(1)
    : "0.0";

  const toggleSort = (field: "priorityScore" | "days_open") => {
    if (sortBy === field) {
      setSortDirection((current) => (current === "desc" ? "asc" : "desc"));
      return;
    }

    setSortBy(field);
    setSortDirection("desc");
  };

  const loadComments = async (id: string) => {
    setCommentsLoadingId(id);
    try {
      const response = await getProblemComments(id);
      setCommentsById((current) => ({ ...current, [id]: response.data }));
    } finally {
      setCommentsLoadingId(null);
    }
  };

  const toggleExpanded = async (id: string) => {
    const next = expandedId === id ? null : id;
    setExpandedId(next);
    if (next && !commentsById[next]) {
      await loadComments(next);
    }
  };

  const handleStatusChange = async (id: string, status: string) => {
    setUpdatingStatusId(id);
    try {
      await updateStatus(id, status);
      setComplaints((current) =>
        current.map((item) =>
          item.id === id
            ? {
                ...item,
                status,
                resolved_at: status === "resolved" ? new Date().toISOString() : null,
              }
            : item,
        ),
      );
    } finally {
      setUpdatingStatusId(null);
    }
  };

  const handleDeleteComment = async (commentId: number) => {
    if (!session) return;
    setDeletingCommentId(commentId);
    try {
      await deleteProblemComment(expandedId!, commentId, session.department);
      setCommentsById((prev) => {
        const current = prev[expandedId!] || [];
        return { ...prev, [expandedId!]: current.filter((c) => c.id !== commentId) };
      });
    } finally {
      setDeletingCommentId(null);
    }
  };

  const handleOfficialComment = async (id: string) => {
    const content = (commentDrafts[id] || "").trim();
    if (!content) return;

    setCommentSubmittingId(id);
    try {
      const response = await createProblemComment(id, {
        author_name: `${session.department} Official`,
        content,
        is_official: true,
      });

      setCommentsById((current) => ({
        ...current,
        [id]: [...(current[id] || []), response.data],
      }));
      setCommentDrafts((current) => ({ ...current, [id]: "" }));
    } finally {
      setCommentSubmittingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-stone-100 pb-10 text-charcoal dark:bg-[#0f0f0f] dark:text-white">
      <div className="border-b border-stone-200 bg-white/95 backdrop-blur dark:border-white/10 dark:bg-[#121212]/95">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-stone-500 dark:text-gray-400">
              Government Portal
            </p>
            <div className="mt-1 flex items-center gap-3">
              <h1 className="text-2xl text-slate-800 dark:text-white">{session.department}</h1>
              <span className="rounded-full border border-stone-200 bg-stone-50 px-2.5 py-1 text-xs font-medium text-stone-600 dark:border-white/10 dark:bg-[#1f1f21] dark:text-gray-300">
                Logged in {formatDateLabel(session.loggedInAt)}
              </span>
            </div>
          </div>

          <Button
            type="button"
            variant="outline"
            onClick={() => {
              logoutDepartment();
              window.location.href = "/gov";
            }}
            className="rounded-xl border-stone-200 bg-white text-charcoal hover:bg-stone-50 dark:border-white/10 dark:bg-[#1a1a1a] dark:text-white dark:hover:bg-[#222]"
          >
            <LogOut className="mr-2 h-4 w-4" />
            Logout
          </Button>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <StatCard label="Open Cases" value={pendingCount} hint="Pending queue awaiting action" />
          <StatCard label="In Progress" value={inProgressCount} hint="Active field or desk handling" />
          <StatCard label="Resolved This Month" value={resolvedThisMonth} hint="Closed during current month" />
          <StatCard label="Avg Resolution Days" value={avgResolutionDays} hint="Across resolved department cases" />
        </div>

        <div className="mt-6 rounded-2xl border border-stone-200 bg-white shadow-sm dark:border-white/10 dark:bg-[#1a1a1a]">
          <div className="flex flex-col gap-4 border-b border-stone-200 px-4 py-4 dark:border-white/10 md:flex-row md:items-end md:justify-between">
            <div>
              <h2 className="text-xl text-slate-800 dark:text-white">Complaint Management</h2>
              <p className="mt-1 text-sm text-stone-500 dark:text-gray-400">
                Department-routed complaints sorted for quick action.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <div>
                <label className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.18em] text-stone-500 dark:text-gray-400">
                  Status
                </label>
                <select
                  value={statusFilter}
                  onChange={(event) => setStatusFilter(event.target.value)}
                  className="h-10 rounded-xl border border-stone-200 bg-cream px-3 text-sm outline-none dark:border-white/10 dark:bg-[#111827]"
                >
                  {STATUS_OPTIONS.map((option) => (
                    <option key={option} value={option}>
                      {option === "all" ? "All Statuses" : formatStatus(option)}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.18em] text-stone-500 dark:text-gray-400">
                  Ward
                </label>
                <select
                  value={wardFilter}
                  onChange={(event) => setWardFilter(event.target.value)}
                  className="h-10 rounded-xl border border-stone-200 bg-cream px-3 text-sm outline-none dark:border-white/10 dark:bg-[#111827]"
                >
                  <option value="all">All Wards</option>
                  {wards.map((ward) => (
                    <option key={ward} value={ward}>
                      {ward}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="flex min-h-72 items-center justify-center">
              <Loader2 className="h-7 w-7 animate-spin text-stone-500 dark:text-gray-400" />
            </div>
          ) : error ? (
            <div className="px-4 py-8">
              <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-200">
                {error}
              </div>
            </div>
          ) : filteredComplaints.length === 0 ? (
            <div className="px-4 py-12 text-center text-sm text-stone-500 dark:text-gray-400">
              No complaints match the active filters.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full border-collapse text-left">
                <thead>
                  <tr className="border-b border-stone-200 bg-stone-50 text-[11px] uppercase tracking-[0.18em] text-stone-500 dark:border-white/10 dark:bg-[#151517] dark:text-gray-400">
                    <th className="px-4 py-3 font-semibold">ID</th>
                    <th className="px-4 py-3 font-semibold">Title</th>
                    <th className="px-4 py-3 font-semibold">Ward</th>
                    <th className="px-4 py-3 font-semibold">Category</th>
                    <th className="px-4 py-3 font-semibold">
                      <button
                        type="button"
                        onClick={() => toggleSort("priorityScore")}
                        className="inline-flex items-center gap-1"
                      >
                        Priority Score
                        <ArrowUpDown className="h-3.5 w-3.5" />
                      </button>
                    </th>
                    <th className="px-4 py-3 font-semibold">Citizens Affected</th>
                    <th className="px-4 py-3 font-semibold">
                      <button
                        type="button"
                        onClick={() => toggleSort("days_open")}
                        className="inline-flex items-center gap-1"
                      >
                        Days Open
                        <ArrowUpDown className="h-3.5 w-3.5" />
                      </button>
                    </th>
                    <th className="px-4 py-3 font-semibold">Status</th>
                    <th className="px-4 py-3 font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 dark:divide-white/6">
                  {filteredComplaints.map((complaint) => {
                    const isExpanded = expandedId === complaint.id;
                    const isAgedPending = complaint.days_open > 7 && complaint.status === "pending";
                    const comments = commentsById[complaint.id] || [];

                    return (
                      <Fragment key={complaint.id}>
                        <tr
                          onClick={() => void toggleExpanded(complaint.id)}
                          className={`cursor-pointer align-top transition-colors hover:bg-stone-50 dark:hover:bg-[#202024] ${
                            isAgedPending
                              ? "border-l-4 border-amber-400 dark:border-amber-500"
                              : "border-l-4 border-transparent"
                          }`}
                        >
                          <td className="px-4 py-3 text-sm font-medium text-slate-800 dark:text-white">
                            {complaint.id}
                          </td>
                          <td className="px-4 py-3">
                            <div className="max-w-[22rem]">
                              <p className="text-sm font-medium text-slate-800 dark:text-white">
                                {complaint.title}
                              </p>
                              <p className="mt-1 line-clamp-2 text-xs leading-5 text-stone-500 dark:text-gray-400">
                                {complaint.summary || complaint.address || "No summary available"}
                              </p>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-sm text-stone-600 dark:text-gray-300">
                            {complaint.ward}
                          </td>
                          <td className="px-4 py-3 text-sm capitalize text-stone-600 dark:text-gray-300">
                            {complaint.category}
                          </td>
                          <td className="px-4 py-3 text-sm font-semibold text-slate-800 dark:text-white">
                            {complaint.priorityScore}
                          </td>
                          <td className="px-4 py-3 text-sm text-stone-600 dark:text-gray-300">
                            {complaint.upvoteCount}
                          </td>
                          <td className="px-4 py-3 text-sm text-stone-600 dark:text-gray-300">
                            {complaint.days_open}
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${STATUS_STYLES[complaint.status] || ""}`}
                            >
                              {formatStatus(complaint.status)}
                            </span>
                          </td>
                          <td className="px-4 py-3" onClick={(event) => event.stopPropagation()}>
                            <div className="flex items-center gap-2">
                              {updatingStatusId === complaint.id ? (
                                <Loader2 className="h-4 w-4 animate-spin text-stone-500 dark:text-gray-400" />
                              ) : (
                                <div className="relative">
                                  <select
                                    value={complaint.status}
                                    onChange={(event) =>
                                      void handleStatusChange(complaint.id, event.target.value)
                                    }
                                    className="h-9 appearance-none rounded-xl border border-stone-200 bg-white px-3 pr-9 text-sm outline-none dark:border-white/10 dark:bg-[#111827]"
                                  >
                                    <option value="pending">Pending</option>
                                    <option value="inProgress">In Progress</option>
                                    <option value="resolved">Resolved</option>
                                  </select>
                                  <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-500 dark:text-gray-400" />
                                </div>
                              )}
                              {!isExpanded && (
                                <button
                                  type="button"
                                  onClick={(event) => {
                                    event.stopPropagation();
                                    void toggleExpanded(complaint.id);
                                  }}
                                  className="text-xs font-medium text-stone-500 underline-offset-4 hover:underline dark:text-gray-400"
                                >
                                  Comments
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>

                        {isExpanded && (
                          <ExpandedPanel
                            complaintId={complaint.id}
                            comments={comments}
                            commentsLoading={commentsLoadingId === complaint.id}
                            commentDraft={commentDrafts[complaint.id] || ""}
                            commentSubmitting={commentSubmittingId === complaint.id}
                            onDraftChange={(value) =>
                              setCommentDrafts((current) => ({ ...current, [complaint.id]: value }))
                            }
                            onSubmitComment={() => void handleOfficialComment(complaint.id)}
                            onDeleteComment={handleDeleteComment}
                            deletingCommentId={deletingCommentId}
                          />
                        )}
                      </Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-sm font-medium text-stone-500 transition-colors hover:text-charcoal dark:text-gray-400 dark:hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to citizen site
          </Link>
        </div>
      </div>
    </div>
  );
}

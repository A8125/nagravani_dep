import { type ElementType, useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { createProblemComment, getComplaint, getFeed, getProblemComments, upvoteComplaint, type Complaint, type LinkedComplaint, type ProblemComment, type ProblemDetail } from '../lib/api';
import { MapPin, Users, Clock, Zap, Droplets, AlertTriangle, Wind, Filter, ArrowRight, ChevronLeft, ChevronRight, MessageSquare, Loader2, Share2, ShieldCheck } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { useApp } from '@/context/AppContext';
import { useIsMobile } from '@/hooks/use-mobile';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Drawer, DrawerContent, DrawerDescription, DrawerHeader, DrawerTitle } from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ToastPill } from '@/components/ui/toast-pill';

const CATEGORIES = ['All', 'road', 'water', 'streetlight', 'garbage', 'sewage', 'noise', 'encroachment'];
const STATUSES   = ['All', 'pending', 'inProgress', 'resolved'];
const DEPTS      = ['All', 'CMC', 'CESC', 'PWD', 'MUDA', 'DHO'];

const CAT_COLOR: Record<string, string> = {
  road: '#ef4444', water: '#3b82f6', streetlight: '#f59e0b',
  garbage: '#8b5cf6', sewage: '#06b6d4', noise: '#10b981', encroachment: '#f97316',
};
const CAT_ICON: Record<string, ElementType> = {
  road: AlertTriangle, water: Droplets, streetlight: Zap,
  garbage: Wind, sewage: Droplets, noise: AlertTriangle, encroachment: MapPin,
};
const STATUS_STYLE: Record<string, string> = {
  pending:'bg-amber-100 text-amber-800', inProgress:'bg-blue-100 text-blue-800',
  resolved:'bg-green-100 text-green-800', rejected:'bg-red-100 text-red-800',
};
const SEVERITY_STYLE: Record<string, string> = {
  Critical:'border-l-red-500', High:'border-l-orange-400', Medium:'border-l-yellow-400', Low:'border-l-green-400',
};

function timeAgo(dt: string) {
  const value = new Date(dt).getTime();
  if (Number.isNaN(value)) return '';

  const seconds = Math.floor((Date.now() - value) / 1000);
  if (seconds < 60) return 'just now';

  const intervals = [
    ['year', 31536000],
    ['month', 2592000],
    ['day', 86400],
    ['hour', 3600],
    ['minute', 60],
  ] as const;

  for (const [label, size] of intervals) {
    const count = Math.floor(seconds / size);
    if (count >= 1) {
      return `${count} ${label}${count === 1 ? '' : 's'} ago`;
    }
  }

  return 'just now';
}

type CommentSectionProps = {
  comments: ProblemComment[];
  problemId: string;
  onCommentAdded: (comment: ProblemComment) => void;
  shouldFocusInput: boolean;
  onInputFocused: () => void;
};

function CommentSection({
  comments,
  problemId,
  onCommentAdded,
  shouldFocusInput,
  onInputFocused,
}: CommentSectionProps) {
  const [authorName, setAuthorName] = useState('');
  const [content, setContent] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const commentInputRef = useRef<HTMLTextAreaElement | null>(null);

  const canSubmit =
    authorName.trim().length > 0 &&
    content.trim().length > 0 &&
    content.trim().length <= 500 &&
    !submitting;

  useEffect(() => {
    if (!shouldFocusInput || !commentInputRef.current) return;

    commentInputRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    commentInputRef.current.focus();
    onInputFocused();
  }, [shouldFocusInput, onInputFocused]);

  const submitComment = async () => {
    if (!canSubmit) return;

    setSubmitting(true);
    setError('');

    try {
      const res = await createProblemComment(problemId, {
        author_name: authorName.trim(),
        content: content.trim(),
      });

      onCommentAdded(res.data);
      setContent('');
    } catch {
      setError('Could not post your comment. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="border-t border-border pt-6">
      <div className="mb-4 flex items-center gap-3">
        <h3 className="text-lg font-semibold text-charcoal">Discussion</h3>
        <span className="inline-flex items-center rounded-full bg-cream px-2.5 py-1 text-xs font-semibold text-stone">
          {comments.length}
        </span>
      </div>

      <p className="mb-4 text-sm text-stone">Discuss updates, work progress, and on-ground status.</p>

      <div className="space-y-3">
        {comments.length === 0 && (
          <div className="rounded-xl border border-dashed border-border bg-white px-4 py-6 text-center text-sm text-stone">
            No comments yet. Start the thread.
          </div>
        )}

        {comments.map((comment) => (
          <div
            key={comment.id}
            className={
              comment.is_official
                ? 'rounded-xl border border-slate-800 bg-gray-900 px-4 py-4 text-white shadow-sm'
                : 'rounded-xl border border-gray-200 bg-white px-4 py-4'
            }
          >
            {comment.is_official && (
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-white/70">
                Official Response
              </p>
            )}

            <div className="mb-2 flex items-start justify-between gap-3">
              <div className="flex items-center gap-2">
                {comment.is_official && <ShieldCheck className="h-4 w-4 text-white/85" />}
                <span className={`text-sm font-semibold ${comment.is_official ? 'text-white' : 'text-charcoal'}`}>
                  {comment.author_name}
                </span>
              </div>
              <span className={`shrink-0 text-xs ${comment.is_official ? 'text-white/60' : 'text-stone'}`}>
                {timeAgo(comment.created_at)}
              </span>
            </div>

            <p className={`text-sm leading-6 ${comment.is_official ? 'text-white/92' : 'text-stone'}`}>
              {comment.content}
            </p>
          </div>
        ))}
      </div>

      <div className="mt-4 rounded-2xl border border-border bg-white p-4">
        <div className="space-y-4">
          <div>
            <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-stone">
              Name
            </label>
            <Input
              value={authorName}
              onChange={(event) => setAuthorName(event.target.value)}
              maxLength={100}
              placeholder="Your name"
              className="border-border bg-cream"
            />
          </div>

          <div>
            <div className="mb-1.5 flex items-center justify-between gap-3">
              <label className="block text-xs font-medium uppercase tracking-wide text-stone">
                Comment
              </label>
              <span className="text-xs text-stone">
                {content.length}/500
              </span>
            </div>
            <Textarea
              ref={commentInputRef}
              value={content}
              onChange={(event) => {
                setContent(event.target.value.slice(0, 500));
              }}
              maxLength={500}
              placeholder="Share an update or add context for this issue"
              className="min-h-28 border-border bg-cream"
            />
          </div>

          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </div>
          )}

          <div className="flex justify-end">
            <Button
              type="button"
              onClick={submitComment}
              disabled={!canSubmit}
              className="rounded-full bg-red-600 px-5 text-white hover:bg-red-700"
            >
              {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
              Post comment
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

type ProblemDetailContentProps = {
  detailLoading: boolean;
  detailError: string;
  selectedProblem: ProblemDetail | null;
  linkedComplaints: LinkedComplaint[];
  comments: ProblemComment[];
  onCommentAdded: (comment: ProblemComment) => void;
  setLightboxUrl: (url: string | null) => void;
  daysAgo: (dt: string) => string;
  shouldFocusCommentInput: boolean;
  onCommentInputFocused: () => void;
};

function ProblemDetailContent({
  detailLoading,
  detailError,
  selectedProblem,
  linkedComplaints,
  comments,
  onCommentAdded,
  setLightboxUrl,
  daysAgo,
  shouldFocusCommentInput,
  onCommentInputFocused,
}: ProblemDetailContentProps) {
  const allDetailPhotos = linkedComplaints
    .map((complaint) => complaint.photoPath)
    .filter((photo): photo is string => Boolean(photo));

  return (
    <div className="flex h-full flex-col overflow-hidden bg-white">
      <div className="flex-1 overflow-y-auto px-4 pb-6 sm:px-6">
        {detailLoading && (
          <div className="flex min-h-[280px] items-center justify-center">
            <Loader2 className="h-7 w-7 animate-spin text-charcoal" />
          </div>
        )}

        {!detailLoading && detailError && (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {detailError}
          </div>
        )}

        {!detailLoading && !detailError && selectedProblem && (
          <div className="space-y-6">
            <div className="rounded-3xl border border-border bg-cream/60 p-4 sm:p-5">
              <div className="mb-3 flex flex-wrap items-center gap-2">
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_STYLE[selectedProblem.status?.toLowerCase()] || ''}`}>
                  {selectedProblem.status}
                </span>
                <span className="rounded-full bg-white px-2 py-0.5 text-xs text-stone">
                  {selectedProblem.dept_short || 'Dept'}
                </span>
                <span className="rounded-full bg-white px-2 py-0.5 text-xs text-stone">
                  {selectedProblem.category}
                </span>
              </div>
              <h2 className="mb-2 font-serif text-2xl text-charcoal">{selectedProblem.title}</h2>
              <p className="text-sm leading-6 text-stone">
                {selectedProblem.summary || selectedProblem.description || 'No summary available yet.'}
              </p>
              <div className="mt-4 flex flex-wrap gap-4 text-xs text-stone">
                <span className="flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5" />
                  {selectedProblem.ward}{selectedProblem.address ? ` • ${selectedProblem.address}` : ''}
                </span>
                <span className="flex items-center gap-1">
                  <Users className="h-3.5 w-3.5" />
                  {selectedProblem.upvoteCount} affected
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5" />
                  {daysAgo(selectedProblem.createdAt)}
                </span>
              </div>
            </div>

            {allDetailPhotos.length > 0 && (
              <div className="border-t border-border pt-6">
                <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold uppercase tracking-wide text-stone">Photos</h3>
                  <span className="text-xs text-stone">{allDetailPhotos.length} image{allDetailPhotos.length === 1 ? '' : 's'}</span>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  {allDetailPhotos.map((photo, index) => (
                    <button
                      key={`${photo}-${index}`}
                      type="button"
                      onClick={() => setLightboxUrl(photo)}
                      className="overflow-hidden rounded-2xl border border-border bg-cream"
                    >
                      <img
                        src={photo}
                        alt={`Complaint photo ${index + 1}`}
                        className="h-56 w-full object-cover"
                      />
                    </button>
                  ))}
                </div>
                </div>
              </div>
            )}

            <div className="border-t border-border pt-6">
              <div className="mb-4 flex items-center gap-3">
                <h3 className="text-lg font-semibold text-charcoal">Citizen Reports</h3>
                <span className="inline-flex items-center rounded-full bg-cream px-2.5 py-1 text-xs font-semibold text-stone">
                  {linkedComplaints.length}
                </span>
              </div>

              <p className="mb-4 text-sm text-stone">All linked citizen submissions associated with this issue.</p>

              <div className="space-y-3">
                {linkedComplaints.map((complaint) => (
                  <div
                    key={complaint.id}
                    className="rounded-xl border border-gray-200 bg-gray-50 p-4"
                    style={{ borderLeftWidth: '3px', borderLeftColor: CAT_COLOR[complaint.category] || '#d6d3d1' }}
                  >
                    <div className="mb-2 flex items-start justify-between gap-3">
                      <p className="font-semibold text-charcoal">
                        {complaint.citizen_name || 'Citizen report'}
                      </p>
                      <span className="shrink-0 text-right text-xs text-stone">{timeAgo(complaint.createdAt)}</span>
                    </div>
                    <p className="mb-2 text-sm font-medium text-charcoal/90">{complaint.title}</p>
                    <p className="text-sm leading-6 text-stone">
                      {complaint.description || complaint.summary || 'No additional description provided.'}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <CommentSection
              comments={comments}
              problemId={selectedProblem.id}
              onCommentAdded={onCommentAdded}
              shouldFocusInput={shouldFocusCommentInput}
              onInputFocused={onCommentInputFocused}
            />
          </div>
        )}
      </div>
    </div>
  );
}

export default function CommunityFeed() {
  const { lang } = useApp();
  const isMobile = useIsMobile();
  const location = useLocation();
  const [all, setAll]         = useState<Complaint[]>([]);
  const [shown, setShown]     = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);
  const [cat, setCat]         = useState('All');
  const [status, setStatus]   = useState('All');
  const [dept, setDept]       = useState('All');
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);
  const [photoIndexes, setPhotoIndexes] = useState<Record<string, number>>({});
  const [selectedProblemId, setSelectedProblemId] = useState<string | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState('');
  const [selectedProblem, setSelectedProblem] = useState<ProblemDetail | null>(null);
  const [linkedComplaints, setLinkedComplaints] = useState<LinkedComplaint[]>([]);
  const [comments, setComments] = useState<ProblemComment[]>([]);
  const [shouldFocusCommentInput, setShouldFocusCommentInput] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [issueNotFound, setIssueNotFound] = useState('');
  const cardRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const initialIssueHandledRef = useRef(false);
  const toastTimeoutRef = useRef<number | null>(null);

  const showToast = (message: string) => {
    setToastMessage(message);
    if (toastTimeoutRef.current) window.clearTimeout(toastTimeoutRef.current);
    toastTimeoutRef.current = window.setTimeout(() => {
      setToastMessage(null);
      toastTimeoutRef.current = null;
    }, 2000);
  };

  const replaceIssueQuery = (issueId: string | null) => {
    const params = new URLSearchParams(window.location.search);

    if (issueId) params.set('issue', issueId);
    else params.delete('issue');

    const query = params.toString();
    const nextUrl = `${window.location.pathname}${query ? `?${query}` : ''}`;
    window.history.replaceState({}, '', nextUrl);
  };

  const scrollToCard = (problemId: string) => {
    window.requestAnimationFrame(() => {
      cardRefs.current[problemId]?.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
    });
  };

  const openIssueDetail = (
    problemId: string,
    options?: { focusCommentInput?: boolean; scrollCard?: boolean },
  ) => {
    setSelectedProblemId(problemId);
    setShouldFocusCommentInput(Boolean(options?.focusCommentInput));
    setDetailOpen(true);
    replaceIssueQuery(problemId);
    if (options?.scrollCard) scrollToCard(problemId);
  };

  useEffect(() => {
    getFeed().then(r => { setAll(r.data); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  useEffect(() => {
    return () => {
      if (toastTimeoutRef.current) window.clearTimeout(toastTimeoutRef.current);
    };
  }, []);

  useEffect(() => {
    if (!lightboxUrl) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setLightboxUrl(null);
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [lightboxUrl]);

  useEffect(() => {
    let r = all;
    if (cat    !== 'All') r = r.filter(p => p.category === cat);
    if (status !== 'All') r = r.filter(p => p.status.toLowerCase() === status.toLowerCase());
    if (dept   !== 'All') r = r.filter(p => p.dept_short === dept);
    setShown(r);
  }, [all, cat, status, dept]);

  const handleCardClick = (problemId: string) => {
    openIssueDetail(problemId);
  };

  const handleCommentButtonClick = (problemId: string) => {
    openIssueDetail(problemId, { focusCommentInput: true });
  };

  const daysAgo = (dt: string) => {
    if (!dt) return '?';
    const d = Math.floor((Date.now() - new Date(dt).getTime()) / 86400000);
    return d === 0 ? 'Today' : `${d}d ago`;
  };

  const getPhotos = (problem: Complaint) => {
    if (problem.photos && problem.photos.length > 0) return problem.photos;
    if (problem.photo_url) return [problem.photo_url];
    return [];
  };

  const cyclePhoto = (problemId: string, total: number, direction: 1 | -1) => {
    setPhotoIndexes((prev) => {
      const current = prev[problemId] ?? 0;
      return {
        ...prev,
        [problemId]: (current + direction + total) % total,
      };
    });
  };

  useEffect(() => {
    if (!detailOpen || !selectedProblemId) return;

    let cancelled = false;

    const loadProblemDetail = async () => {
      setDetailLoading(true);
      setDetailError('');

      try {
        const [detailRes, commentsRes] = await Promise.all([
          getComplaint(selectedProblemId),
          getProblemComments(selectedProblemId),
        ]);

        if (cancelled) return;

        setSelectedProblem(detailRes.problem);
        setLinkedComplaints(detailRes.complaints);
        setComments(commentsRes.data);
      } catch (error) {
        if (cancelled) return;
        setDetailError('Could not load this issue right now.');
      } finally {
        if (!cancelled) setDetailLoading(false);
      }
    };

    loadProblemDetail();

    return () => {
      cancelled = true;
    };
  }, [detailOpen, selectedProblemId]);

  useEffect(() => {
    if (loading || initialIssueHandledRef.current) return;

    const issueId = new URLSearchParams(location.search).get('issue');
    if (!issueId) {
      initialIssueHandledRef.current = true;
      return;
    }

    const issue = all.find((problem) => problem.id === issueId);
    initialIssueHandledRef.current = true;

    if (issue) {
      setIssueNotFound('');
      openIssueDetail(issue.id, { scrollCard: true });
      return;
    }

    setIssueNotFound('Issue not found');
    replaceIssueQuery(null);
  }, [all, loading, location.search]);

  const handleDetailOpenChange = (open: boolean) => {
    setDetailOpen(open);
    if (!open) {
      setSelectedProblemId(null);
      setSelectedProblem(null);
      setLinkedComplaints([]);
      setComments([]);
      setDetailError('');
      setShouldFocusCommentInput(false);
      replaceIssueQuery(null);
    }
  };

  const handleUpvote = async (id: string) => {
    try {
      const response = await upvoteComplaint(id);

      setAll((prev) =>
        prev.map((problem) =>
          problem.id === id
            ? { ...problem, upvoteCount: response.upvoteCount, priorityScore: response.priorityScore }
            : problem,
        ),
      );

      setSelectedProblem((prev) =>
        prev?.id === id
          ? { ...prev, upvoteCount: response.upvoteCount, priorityScore: response.priorityScore }
          : prev,
      );
    } catch {
      // Keep the current UI stable if the upvote request fails.
    }
  };

  const handleShare = async (problem: Complaint) => {
    const shareUrl = new URL(`/feed?issue=${encodeURIComponent(problem.id)}`, window.location.origin).toString();
    const shareData = {
      title: problem.title,
      text: `${problem.title} in ${problem.ward}`,
      url: shareUrl,
    };

    try {
      if (isMobile && navigator.share) {
        await navigator.share(shareData);
        return;
      }

      await navigator.clipboard.writeText(shareUrl);
      showToast('Link copied!');
    } catch {
      showToast('Could not share link');
    }
  };

  return (
    <div className="min-h-screen bg-cream pt-[72px]">
      <div className="max-w-5xl mx-auto px-4 py-10">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
          <div>
            <h1 className="font-serif text-3xl text-charcoal mb-1">{lang === 'kn' ? 'ಸಮುದಾಯ ಫೀಡ್' : 'Community Feed'}</h1>
            <p className="text-stone text-sm">{lang === 'kn' ? 'ಮಂಡ್ಯ ನಾಗರಿಕರು ವರದಿ ಮಾಡಿದ ನೇರ ಸಮಸ್ಯೆಗಳು' : 'Live civic issues reported by citizens of Mandya'}</p>
          </div>
          <Link to="/raise" className="inline-flex items-center gap-2 px-5 py-2.5 bg-charcoal text-white text-sm rounded-full hover:bg-charcoal/90 transition-colors">
            + {lang === 'kn' ? 'ದೂರು ನೀಡಿ' : 'Report Issue'} <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-2xl border border-border p-4 mb-6 space-y-3">
          <div className="flex items-center gap-2 text-xs text-stone font-medium uppercase tracking-wide">
            <Filter className="w-3.5 h-3.5" /> {lang === 'kn' ? 'ಫಿಲ್ಟರ್‌ಗಳು' : 'Filters'}
          </div>
          <div className="flex flex-wrap gap-1.5">
            <span className="text-xs text-stone w-16 self-center">{lang === 'kn' ? 'ವರ್ಗ' : 'Category'}</span>
            {CATEGORIES.map(c => (
              <button key={c} onClick={() => setCat(c)}
                className={`px-3 py-1 text-xs rounded-full border transition-all ${cat===c ? 'bg-charcoal text-white border-charcoal' : 'border-border text-stone hover:border-charcoal'}`}>
                {c === 'All' ? (lang === 'kn' ? 'ಎಲ್ಲಾ' : 'All') : c}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap gap-1.5">
            <span className="text-xs text-stone w-16 self-center">{lang === 'kn' ? 'ಸ್ಥಿತಿ' : 'Status'}</span>
            {STATUSES.map(s => (
              <button key={s} onClick={() => setStatus(s)}
                className={`px-3 py-1 text-xs rounded-full border transition-all ${status===s ? 'bg-charcoal text-white border-charcoal' : 'border-border text-stone hover:border-charcoal'}`}>
                {s === 'All' ? (lang === 'kn' ? 'ಎಲ್ಲಾ' : 'All') : s === 'inProgress' ? 'In Progress' : s}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap gap-1.5">
            <span className="text-xs text-stone w-16 self-center">{lang === 'kn' ? 'ಇಲಾಖೆ' : 'Dept.'}</span>
            {DEPTS.map(d => (
              <button key={d} onClick={() => setDept(d)}
                className={`px-3 py-1 text-xs rounded-full border transition-all ${dept===d ? 'bg-charcoal text-white border-charcoal' : 'border-border text-stone hover:border-charcoal'}`}>
                {d}
              </button>
            ))}
          </div>
        </div>

        {/* Summary bar */}
        <p className="text-xs text-stone mb-4">
          {lang === 'kn' ? 'ತೋರಿಸಲಾಗುತ್ತಿದೆ' : 'Showing'} <span className="font-semibold text-charcoal">{shown.length}</span> {lang === 'kn' ? 'ಸಮಸ್ಯೆಗಳು' : 'issues'}
        </p>

        {issueNotFound && (
          <div className="mb-4 inline-flex rounded-full border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-medium text-amber-800">
            {issueNotFound}
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin w-8 h-8 border-2 border-charcoal border-t-transparent rounded-full" />
          </div>
        )}

        {/* Empty state */}
        {!loading && shown.length === 0 && (
          <div className="text-center py-20 text-stone">
            <MapPin className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p>No issues match the selected filters.</p>
          </div>
        )}

        {/* Problem cards */}
        <div className="space-y-4">
          {shown.map((p, i) => {
            const IconComp = CAT_ICON[p.category] || MapPin;
            const photos = getPhotos(p);
            const activeIndex = photos.length > 0 ? (photoIndexes[p.id] ?? 0) % photos.length : 0;
            const activePhoto = photos[activeIndex] ?? null;
            return (
              <motion.div key={p.id}
                ref={(node) => {
                  cardRefs.current[p.id] = node;
                }}
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                onClick={() => handleCardClick(p.id)}
                className={`bg-white rounded-2xl border-l-4 border border-border p-5 hover:shadow-md transition-shadow cursor-pointer ${SEVERITY_STYLE[p.severity] || 'border-l-gray-300'}`}>
                <div className="flex items-start gap-4">
                  {/* Category icon */}
                  <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: CAT_COLOR[p.category] + '18' }}>
                    <IconComp className="w-5 h-5" style={{ color: CAT_COLOR[p.category] }} />
                  </div>

                  {/* Content */}
                    <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_STYLE[p.status?.toLowerCase()] || ''}`}>{p.status}</span>
                      <span className="text-xs bg-cream text-stone px-2 py-0.5 rounded-full">{p.dept_short}</span>
                      <span className="text-xs text-stone ml-auto flex items-center gap-1">
                        <Clock className="w-3 h-3" /> {daysAgo(p.createdAt)} active
                      </span>
                    </div>
                     <h3 className="font-medium text-charcoal text-base mb-1">{p.title}</h3>
                     <p className="mb-2 text-[14px] text-stone/85 line-clamp-2">
                      {p.summary || p.description || 'No summary available yet.'}
                     </p>
                     {photos.length === 1 && activePhoto && (
                       <button
                         type="button"
                         onClick={(event) => {
                           event.stopPropagation();
                           setLightboxUrl(activePhoto);
                         }}
                         className="mb-3 block w-full overflow-hidden rounded-2xl"
                       >
                         <img
                           src={activePhoto}
                           alt={p.title || 'Complaint photo'}
                           className="h-auto w-full object-contain"
                         />
                       </button>
                     )}
                     {photos.length > 1 && activePhoto && (
                       <div className="group relative mb-3 w-full overflow-hidden rounded-2xl">
                         <button
                           type="button"
                           onClick={(event) => {
                             event.stopPropagation();
                             setLightboxUrl(activePhoto);
                           }}
                           className="block w-full"
                         >
                           <img
                             src={activePhoto}
                             alt={p.title || 'Complaint photo'}
                             className="h-auto w-full object-contain"
                           />
                         </button>
                         <button
                           type="button"
                           onClick={(event) => {
                             event.stopPropagation();
                             cyclePhoto(p.id, photos.length, -1);
                           }}
                           className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-black/55 p-2 text-white opacity-0 transition-opacity group-hover:opacity-100"
                           aria-label="Previous photo"
                         >
                           <ChevronLeft className="h-4 w-4" />
                         </button>
                         <button
                           type="button"
                           onClick={(event) => {
                             event.stopPropagation();
                             cyclePhoto(p.id, photos.length, 1);
                           }}
                           className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-black/55 p-2 text-white opacity-0 transition-opacity group-hover:opacity-100"
                           aria-label="Next photo"
                         >
                           <ChevronRight className="h-4 w-4" />
                         </button>
                         <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 items-center gap-1.5 rounded-full bg-black/35 px-2 py-1">
                           {photos.map((photo, index) => (
                             <span
                               key={`${p.id}-${photo}-${index}`}
                               className={`h-2 w-2 rounded-full ${index === activeIndex ? 'bg-white' : 'bg-white/40'}`}
                             />
                           ))}
                         </div>
                       </div>
                     )}
                     <div className="flex items-center gap-1 text-xs text-stone mb-3">
                      <MapPin className="w-3 h-3" /> {p.ward}{p.address ? ` • ${p.address}` : ''}
                    </div>

                    {/* Stats row */}
                    <div className="mb-3 flex items-center gap-4 text-xs">
                      <span className="flex items-center gap-1 text-charcoal">
                        <Users className="w-3.5 h-3.5" />
                        <strong>{p.upvoteCount}</strong> {lang === 'kn' ? 'ನಾಗರಿಕರು' : 'citizens affected'}
                      </span>
                      <span className="text-stone">
                        Priority: <strong className="text-charcoal">{p.priorityScore}</strong>
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();
                          void handleUpvote(p.id);
                        }}
                        className="inline-flex items-center gap-1.5 rounded-full border border-border bg-cream px-3 py-1.5 text-xs font-medium text-stone transition-colors hover:border-charcoal hover:text-charcoal"
                      >
                        <Users className="h-3.5 w-3.5" />
                        Add Me Too
                      </button>

                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();
                          handleCommentButtonClick(p.id);
                        }}
                        className="inline-flex items-center gap-1.5 rounded-full border border-border bg-cream px-3 py-1.5 text-xs font-medium text-stone transition-colors hover:border-charcoal hover:text-charcoal"
                      >
                        <MessageSquare className="h-3.5 w-3.5" />
                        {p.comment_count ?? 0}
                      </button>

                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();
                          void handleShare(p);
                        }}
                        className="inline-flex items-center justify-center rounded-full border border-border bg-cream p-1.5 text-stone transition-colors hover:border-charcoal hover:text-charcoal"
                        aria-label={`Share ${p.id}`}
                      >
                        <Share2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {lightboxUrl && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4"
          onClick={() => setLightboxUrl(null)}
        >
          <img
            src={lightboxUrl}
            alt="Complaint full size"
            className="max-h-[85vh] max-w-[90vw] object-contain"
            onClick={(event) => event.stopPropagation()}
          />
        </div>
      )}

      {isMobile ? (
        <Drawer open={detailOpen} onOpenChange={handleDetailOpenChange}>
          <DrawerContent className="max-h-[90vh] border-border bg-white">
            <DrawerHeader className="px-4 pb-2 text-left">
              <DrawerTitle className="font-serif text-xl text-charcoal">
                {selectedProblem?.title || 'Issue details'}
              </DrawerTitle>
              <DrawerDescription className="text-stone">
                View complaint details and join the discussion thread.
              </DrawerDescription>
            </DrawerHeader>
            <ProblemDetailContent
              detailLoading={detailLoading}
              detailError={detailError}
              selectedProblem={selectedProblem}
              linkedComplaints={linkedComplaints}
              comments={comments}
              onCommentAdded={(comment) => {
                setComments((prev) => [...prev, comment]);
                setAll((prev) =>
                  prev.map((problem) =>
                    problem.id === comment.problem_id
                      ? { ...problem, comment_count: (problem.comment_count ?? 0) + 1 }
                      : problem,
                  ),
                );
              }}
              setLightboxUrl={setLightboxUrl}
              daysAgo={daysAgo}
              shouldFocusCommentInput={shouldFocusCommentInput}
              onCommentInputFocused={() => setShouldFocusCommentInput(false)}
            />
          </DrawerContent>
        </Drawer>
      ) : (
        <Dialog open={detailOpen} onOpenChange={handleDetailOpenChange}>
          <DialogContent className="h-[85vh] max-w-4xl overflow-hidden rounded-3xl border-border bg-white p-0">
            <DialogHeader className="border-b border-border px-6 py-5">
              <DialogTitle className="font-serif text-2xl text-charcoal">
                {selectedProblem?.title || 'Issue details'}
              </DialogTitle>
              <DialogDescription className="text-stone">
                View complaint details and join the discussion thread.
              </DialogDescription>
            </DialogHeader>
            <ProblemDetailContent
              detailLoading={detailLoading}
              detailError={detailError}
              selectedProblem={selectedProblem}
              linkedComplaints={linkedComplaints}
              comments={comments}
              onCommentAdded={(comment) => {
                setComments((prev) => [...prev, comment]);
                setAll((prev) =>
                  prev.map((problem) =>
                    problem.id === comment.problem_id
                      ? { ...problem, comment_count: (problem.comment_count ?? 0) + 1 }
                      : problem,
                  ),
                );
              }}
              setLightboxUrl={setLightboxUrl}
              daysAgo={daysAgo}
              shouldFocusCommentInput={shouldFocusCommentInput}
              onCommentInputFocused={() => setShouldFocusCommentInput(false)}
            />
          </DialogContent>
        </Dialog>
      )}

      <ToastPill message={toastMessage} />
    </div>
  );
}

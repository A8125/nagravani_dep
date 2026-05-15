import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowRight, Clock, MapPin, Users } from 'lucide-react';
import { getFeed, type Complaint } from '@/lib/api';
import { useApp } from '@/context/AppContext';

const CAT_COLOR: Record<string, string> = {
  road: 'bg-red-500',
  water: 'bg-blue-500',
  streetlight: 'bg-amber-500',
  garbage: 'bg-violet-500',
  sewage: 'bg-cyan-500',
  noise: 'bg-emerald-500',
  encroachment: 'bg-orange-500',
};

const STATUS_STYLE: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-800',
  inprogress: 'bg-blue-100 text-blue-800',
  resolved: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800',
};

function getPreviewPhoto(complaint: Complaint) {
  if (complaint.photos && complaint.photos.length > 0) return complaint.photos[0];
  if (complaint.photo_url) return complaint.photo_url;
  return null;
}

function daysAgo(dt: string) {
  if (!dt) return '?';
  const d = Math.floor((Date.now() - new Date(dt).getTime()) / 86400000);
  return d === 0 ? 'Today' : `${d}d ago`;
}

function SkeletonCard() {
  return (
    <div className="overflow-hidden rounded-[28px] border border-border bg-white shadow-sm">
      <div className="h-48 animate-pulse bg-stone-200/80" />
      <div className="space-y-4 p-5">
        <div className="flex items-center justify-between gap-3">
          <div className="h-5 w-28 animate-pulse rounded-full bg-stone-200/80" />
          <div className="h-5 w-20 animate-pulse rounded-full bg-stone-200/80" />
        </div>
        <div className="h-6 w-3/4 animate-pulse rounded bg-stone-200/80" />
        <div className="h-4 w-1/2 animate-pulse rounded bg-stone-200/80" />
        <div className="space-y-2">
          <div className="h-4 w-full animate-pulse rounded bg-stone-200/80" />
          <div className="h-4 w-5/6 animate-pulse rounded bg-stone-200/80" />
        </div>
        <div className="h-4 w-2/5 animate-pulse rounded bg-stone-200/80" />
      </div>
    </div>
  );
}

export function LiveComplaintsPreviewSection() {
  const { lang } = useApp();
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    getFeed({ limit: 3 })
      .then((res) => {
        if (!cancelled) setComplaints(res.data);
      })
      .catch(() => {
        if (!cancelled) setComplaints([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <section className="bg-transparent py-18 lg:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.6 }}
          className="mb-10 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between"
        >
          <div>
            <div className="mb-3 inline-flex items-center gap-3 rounded-full border border-red-200 bg-white/90 px-4 py-1.5 text-xs font-medium uppercase tracking-[0.24em] text-red-600 shadow-sm">
              <span className="relative flex h-2.5 w-2.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-500 opacity-70" />
                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-red-500" />
              </span>
              Live now
            </div>
            <h2 className="font-serif text-3xl text-charcoal sm:text-4xl lg:text-[42px] lg:leading-tight">
              {lang === 'kn' ? 'ಈಗ ಮಂಡ್ಯದಲ್ಲಿ ಏನು ನಡೆಯುತ್ತಿದೆ' : "What's happening in Mandya right now"}
            </h2>
          </div>
          <p className="max-w-xl text-sm leading-6 text-stone sm:text-right">
            {lang === 'kn'
              ? 'ಸಮುದಾಯ ಈಗ ವರದಿ ಮಾಡುತ್ತಿರುವ ತುರ್ತು ನಗರ ಸಮಸ್ಯೆಗಳ ತ್ವರಿತ ನೋಟ.'
              : 'A quick live look at the civic issues residents are actively reporting across the city.'}
          </p>
        </motion.div>

        <div className="grid gap-6 md:grid-cols-3">
          {loading && Array.from({ length: 3 }).map((_, index) => (
            <SkeletonCard key={index} />
          ))}

          {!loading && complaints.map((complaint, index) => {
            const previewPhoto = getPreviewPhoto(complaint);
            const statusKey = complaint.status?.toLowerCase().replace(/\s+/g, '');

            return (
              <motion.article
                key={complaint.id}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-100px' }}
                transition={{ duration: 0.45, delay: index * 0.06 }}
                className="overflow-hidden rounded-[28px] border border-border bg-white shadow-sm transition-transform duration-200 hover:-translate-y-1"
              >
                {previewPhoto ? (
                  <img
                    src={previewPhoto}
                    alt={complaint.title || 'Complaint photo'}
                    className="h-48 w-full object-cover"
                  />
                ) : (
                  <div className="flex h-48 items-end bg-gradient-to-br from-stone-100 via-cream to-stone-200 px-5 py-4">
                    <div className="rounded-full border border-white/80 bg-white/85 px-3 py-1 text-xs font-medium text-stone shadow-sm">
                      {complaint.category}
                    </div>
                  </div>
                )}

                <div className="space-y-4 p-5">
                  <div className="flex items-center justify-between gap-3">
                    <div className="inline-flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-stone">
                      <span className={`h-2.5 w-2.5 rounded-full ${CAT_COLOR[complaint.category] || 'bg-stone-400'}`} />
                      {complaint.category}
                    </div>
                    <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${STATUS_STYLE[statusKey] || 'bg-stone-100 text-stone-700'}`}>
                      {complaint.status === 'inProgress' ? 'In Progress' : complaint.status}
                    </span>
                  </div>

                  <div>
                    <h3 className="mb-2 text-xl font-medium text-charcoal">
                      {complaint.title}
                    </h3>
                    <div className="flex items-center gap-1.5 text-sm text-stone">
                      <MapPin className="h-3.5 w-3.5" />
                      {complaint.ward}
                    </div>
                  </div>

                  <p className="line-clamp-2 min-h-[3rem] text-sm leading-6 text-stone">
                    {complaint.summary || complaint.description || 'No summary available yet.'}
                  </p>

                  <div className="flex items-center justify-between gap-3 border-t border-border pt-3 text-xs text-stone">
                    <span className="flex items-center gap-1.5">
                      <Users className="h-3.5 w-3.5 text-charcoal" />
                      <strong className="text-charcoal">{complaint.upvoteCount}</strong> citizens affected
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5" />
                      {daysAgo(complaint.createdAt)}
                    </span>
                  </div>
                </div>
              </motion.article>
            );
          })}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.45, delay: 0.1 }}
          className="mt-8"
        >
          <Link
            to="/feed"
            className="inline-flex items-center gap-2 rounded-full border border-border bg-white px-5 py-2.5 text-sm font-medium text-charcoal transition-colors hover:border-charcoal hover:bg-cream"
          >
            {lang === 'kn' ? 'ಎಲ್ಲಾ ಸಮಸ್ಯೆಗಳು ನೋಡಿ' : 'View all issues'}
            <ArrowRight className="h-4 w-4" />
          </Link>
        </motion.div>
      </div>
    </section>
  );
}

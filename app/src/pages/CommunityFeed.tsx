import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { getFeed, type Complaint } from '../lib/api';
import { MapPin, Users, Clock, Zap, Droplets, AlertTriangle, Wind, Filter, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useApp } from '@/context/AppContext';

const CATEGORIES = ['All', 'road', 'water', 'streetlight', 'garbage', 'sewage', 'noise', 'encroachment'];
const STATUSES   = ['All', 'pending', 'inProgress', 'resolved'];
const DEPTS      = ['All', 'CMC', 'CESC', 'PWD', 'MUDA', 'DHO'];

const CAT_COLOR: Record<string, string> = {
  road: '#ef4444', water: '#3b82f6', streetlight: '#f59e0b',
  garbage: '#8b5cf6', sewage: '#06b6d4', noise: '#10b981', encroachment: '#f97316',
};
const CAT_ICON: Record<string, React.ElementType> = {
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

export default function CommunityFeed() {
  const { lang } = useApp();
  const [all, setAll]         = useState<Complaint[]>([]);
  const [shown, setShown]     = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);
  const [cat, setCat]         = useState('All');
  const [status, setStatus]   = useState('All');
  const [dept, setDept]       = useState('All');

  useEffect(() => {
    getFeed().then(r => { setAll(r.data); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  useEffect(() => {
    let r = all;
    if (cat    !== 'All') r = r.filter(p => p.category === cat);
    if (status !== 'All') r = r.filter(p => p.status.toLowerCase() === status.toLowerCase());
    if (dept   !== 'All') r = r.filter(p => p.dept_short === dept);
    setShown(r);
  }, [all, cat, status, dept]);

  const handleCardClick = (problemId: string) => {
    // If problem detail page doesn't exist yet, just log the id
    console.log('Clicked problem:', problemId);
    // TODO: navigate to /feed/${problemId} when detail page exists
  };

  const daysAgo = (dt: string) => {
    if (!dt) return '?';
    const d = Math.floor((Date.now() - new Date(dt).getTime()) / 86400000);
    return d === 0 ? 'Today' : `${d}d ago`;
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
            return (
              <motion.div key={p.id}
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
                     <p className="text-sm text-stone line-clamp-2 mb-2">{p.summary || p.description || 'No description available'}</p>
                     <div className="flex items-center gap-1 text-xs text-stone mb-3">
                      <MapPin className="w-3 h-3" /> {p.ward}{p.address ? ` • ${p.address}` : ''}
                    </div>

                    {/* Stats row */}
                    <div className="flex items-center gap-4 text-xs">
                      <span className="flex items-center gap-1 text-charcoal">
                        <Users className="w-3.5 h-3.5" />
                        <strong>{p.upvoteCount}</strong> {lang === 'kn' ? 'ನಾಗರಿಕರು' : 'citizens affected'}
                      </span>
                      <span className="text-stone">
                        Priority: <strong className="text-charcoal">{p.priorityScore}</strong>
                      </span>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

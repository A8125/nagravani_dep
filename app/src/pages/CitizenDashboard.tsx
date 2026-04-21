import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { getDashboard, getNotifications } from '../lib/api';
import { Star, CheckCircle, Clock, AlertCircle, Bell, TrendingUp, Shield, Award } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

const USER_ID = 'user-seed'; // In production: comes from auth context

import { Heart, Zap } from 'lucide-react';

const BADGE_ICONS: Record<string, React.ElementType> = {
  'City Hero': Zap, 'City Guardian': Shield, 'Active Citizen': Star, 'Contributor': CheckCircle, 'Newcomer': Heart,
};

const STATUS_STYLE: Record<string, string> = {
  Pending: 'bg-amber-100 dark:bg-amber-500/15 text-amber-800 dark:text-amber-400',
  InProgress: 'bg-blue-100 dark:bg-blue-500/15 text-blue-800 dark:text-blue-400',
  Resolved: 'bg-green-100 dark:bg-green-500/15 text-green-800 dark:text-green-400',
  Rejected: 'bg-red-100 dark:bg-red-500/15 text-red-800 dark:text-red-400',
};

export default function CitizenDashboard() {
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const initialTab = queryParams.get('tab') === 'notifications' ? 'notifs' : 'my';

  const [data, setData] = useState<any>(null);
  const [notifs, setNotifs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'my' | 'notifs'>(initialTab);

  useEffect(() => {
    Promise.all([
      getDashboard(USER_ID),
      getNotifications(USER_ID),
    ]).then(([d, n]) => {
      setData(d.data);
      setNotifs(n.data);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="min-h-screen bg-cream dark:bg-[#0f0f0f] pt-[72px] flex items-center justify-center">
      <div className="animate-spin w-8 h-8 border-2 border-charcoal dark:border-white border-t-transparent rounded-full" />
    </div>
  );

  if (!data) return (
    <div className="min-h-screen bg-cream dark:bg-[#0f0f0f] pt-[72px] flex items-center justify-center">
      <div className="text-center">
        <p className="text-stone dark:text-gray-400 mb-4">Could not load dashboard. Is the backend running?</p>
        <Link to="/" className="text-sm text-charcoal dark:text-white underline">Go back home</Link>
      </div>
    </div>
  );

  const { profile, my_complaints, status_breakdown, contributions } = data;
  const nextBadgePoints = profile.points < 20 ? 20 : profile.points < 75 ? 75 : profile.points < 200 ? 200 : 500;
  const progressPct = Math.min((profile.points / nextBadgePoints) * 100, 100);

  return (
    <div className="min-h-screen bg-cream dark:bg-[#0f0f0f] pt-[72px]">
      <div className="max-w-5xl mx-auto px-4 py-10">
        {/* Profile hero card */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-[#1a1a1a] rounded-2xl border border-border dark:border-white/8 p-6 mb-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-48 h-48 bg-charcoal/5 dark:bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="flex flex-col sm:flex-row sm:items-center gap-5">
            <div className="w-16 h-16 bg-charcoal dark:bg-white rounded-2xl flex items-center justify-center flex-shrink-0 text-white dark:text-[#0f0f0f]">
              {BADGE_ICONS[profile.badge] ? (
                (() => {
                  const Icon = BADGE_ICONS[profile.badge];
                  return <Icon className="w-8 h-8" />;
                })()
              ) : (
                <Shield className="w-8 h-8" />
              )}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-0.5">
                <h2 className="font-serif text-xl text-charcoal dark:text-white">{profile.name}</h2>
                <span className="text-xs bg-cream dark:bg-[#2c2c2e] text-stone dark:text-gray-400 px-2 py-0.5 rounded-full">{profile.badge}</span>
              </div>
              <p className="text-sm text-stone dark:text-gray-400 mb-3">{contributions} total civic contributions</p>
              {/* Points progress */}
              <div>
                <div className="flex justify-between text-xs text-stone dark:text-gray-400 mb-1">
                  <span>{profile.points} points</span>
                  <span>{nextBadgePoints} for next badge</span>
                </div>
                <div className="h-2 bg-cream dark:bg-[#2c2c2e] rounded-full overflow-hidden">
                  <motion.div initial={{ width: 0 }} animate={{ width: `${progressPct}%` }}
                    transition={{ duration: 1, ease: 'easeOut' }}
                    className="h-full bg-charcoal dark:bg-white rounded-full" />
                </div>
              </div>
            </div>
            {/* Stats */}
            <div className="flex sm:flex-col gap-4 sm:text-right">
              <div>
                <div className="text-2xl font-bold text-charcoal dark:text-white">{profile.points}</div>
                <div className="text-xs text-stone dark:text-gray-400">Points</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-charcoal dark:text-white">{my_complaints.length}</div>
                <div className="text-xs text-stone dark:text-gray-400">Complaints</div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Status breakdown */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          {[
            { label: 'Pending',     count: status_breakdown.Pending,    icon: AlertCircle, color: '#f59e0b' },
            { label: 'In Progress', count: status_breakdown.InProgress,  icon: Clock,       color: '#3b82f6' },
            { label: 'Resolved',    count: status_breakdown.Resolved,   icon: CheckCircle,  color: '#10b981' },
          ].map(s => (
            <motion.div key={s.label} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
              className="bg-white dark:bg-[#1a1a1a] rounded-2xl border border-border dark:border-white/8 p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center dark:bg-opacity-15" style={{ background: s.color + '18' }}>
                <s.icon className="w-5 h-5" style={{ color: s.color }} />
              </div>
              <div>
                <div className="text-xl font-bold text-charcoal dark:text-white">{s.count}</div>
                <div className="text-xs text-stone dark:text-gray-400">{s.label}</div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-4 bg-white dark:bg-[#1a1a1a] rounded-xl p-1 border border-border dark:border-white/8 w-fit">
          <button onClick={() => setTab('my')}
            className={`px-4 py-1.5 text-sm rounded-lg transition-all ${tab==='my' ? 'bg-charcoal dark:bg-white text-white dark:text-[#0f0f0f]' : 'text-stone dark:text-gray-400 hover:text-charcoal dark:hover:text-white'}`}>
            My Complaints
          </button>
          <button onClick={() => setTab('notifs')}
            className={`px-4 py-1.5 text-sm rounded-lg transition-all flex items-center gap-1.5 ${tab==='notifs' ? 'bg-charcoal dark:bg-white text-white dark:text-[#0f0f0f]' : 'text-stone dark:text-gray-400 hover:text-charcoal dark:hover:text-white'}`}>
            <Bell className="w-3.5 h-3.5" />
            Notifications
            {notifs.filter(n => !n.read).length > 0 && (
              <span className="bg-red-500 text-white text-xs w-4 h-4 rounded-full flex items-center justify-center">
                {notifs.filter(n => !n.read).length}
              </span>
            )}
          </button>
        </div>

        {/* My Complaints list */}
        {tab === 'my' && (
          <div className="space-y-3">
            {my_complaints.length === 0 && (
              <div className="text-center py-12 bg-white dark:bg-[#1a1a1a] rounded-2xl border border-border dark:border-white/8">
                <TrendingUp className="w-8 h-8 mx-auto mb-2 text-stone/30 dark:text-white/30" />
                <p className="text-stone dark:text-gray-400 text-sm">No complaints yet.</p>
                <Link to="/raise" className="text-xs text-charcoal dark:text-white underline mt-1 block">Report your first issue →</Link>
              </div>
            )}
            {my_complaints.map((c: any, i: number) => (
              <motion.div key={c.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className="bg-white dark:bg-[#1a1a1a] rounded-2xl border border-border dark:border-white/8 p-4 flex items-center gap-4 hover:shadow-md dark:hover:shadow-lg dark:hover:shadow-black/20 transition-shadow">
                <div className="w-10 h-10 rounded-xl bg-cream dark:bg-[#2c2c2e] flex items-center justify-center">
                  <Shield className="w-5 h-5 text-stone dark:text-gray-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-charcoal dark:text-white text-sm line-clamp-1">{c.title}</p>
                  <p className="text-xs text-stone dark:text-gray-400 mt-0.5">{c.dept_short} · {c.category}</p>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${STATUS_STYLE[c.status] || ''}`}>
                  {c.status}
                </span>
              </motion.div>
            ))}
          </div>
        )}

        {/* Notifications */}
        {tab === 'notifs' && (
          <div className="space-y-3">
            {notifs.length === 0 && (
              <div className="text-center py-12 bg-white dark:bg-[#1a1a1a] rounded-2xl border border-border dark:border-white/8">
                <Bell className="w-8 h-8 mx-auto mb-2 text-stone/30 dark:text-white/30" />
                <p className="text-stone dark:text-gray-400 text-sm">No notifications yet.</p>
              </div>
            )}
            {notifs.map((n: any, i: number) => (
              <motion.div key={n.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                className={`bg-white dark:bg-[#1a1a1a] rounded-2xl border p-4 flex items-start gap-3 ${n.read ? 'border-border dark:border-white/8' : 'border-charcoal/30 dark:border-white/20'}`}>
                <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${n.read ? 'bg-stone/30 dark:bg-gray-600' : 'bg-charcoal dark:bg-white'}`} />
                <div>
                  <p className="text-sm text-charcoal dark:text-white">{n.message}</p>
                  {n.created_at && (
                    <p className="text-xs text-stone dark:text-gray-400 mt-0.5">{new Date(n.created_at).toLocaleString()}</p>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Rewards section */}
        <div className="mt-8 bg-white dark:bg-[#1a1a1a] rounded-2xl border border-border dark:border-white/8 p-6">
          <div className="flex items-center gap-2 mb-4">
            <Award className="w-5 h-5 text-charcoal dark:text-white" />
            <h3 className="font-medium text-charcoal dark:text-white">City Guardian Rewards</h3>
          </div>
          <div className="grid sm:grid-cols-3 gap-3">
            {[
              { badge: 'Contributor', icon: CheckCircle, req: '20 pts', reward: 'Profile badge', achieved: profile.points >= 20 },
              { badge: 'Active Citizen', icon: Star, req: '75 pts', reward: '5% local utility voucher', achieved: profile.points >= 75 },
              { badge: 'City Guardian', icon: Shield, req: '200 pts', reward: '₹100 BESCOM credit', achieved: profile.points >= 200 },
            ].map((r, idx) => (
              <div key={idx} className={`rounded-xl p-4 border transition-colors ${r.achieved ? 'border-charcoal dark:border-white bg-cream dark:bg-[#2c2c2e]' : 'border-border dark:border-white/8 opacity-60'}`}>
                <div className="text-base font-medium text-charcoal dark:text-white mb-0.5 flex items-center gap-1.5"><r.icon className="w-4 h-4" /> {r.badge}</div>
                <div className="text-xs text-stone dark:text-gray-400 mb-1">{r.req}</div>
                <div className="text-xs font-medium text-charcoal dark:text-gray-300">{r.reward}</div>
                {r.achieved && <div className="text-xs text-green-600 dark:text-green-400 mt-1 flex items-center gap-1"><CheckCircle className="w-3 h-3" /> Achieved!</div>}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
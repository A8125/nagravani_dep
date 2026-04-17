import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { getDepartments, type Department } from '../lib/api';
import { Phone, MapPin, Briefcase, ExternalLink, Landmark, Zap, HardHat, Map, Stethoscope, Building2 } from 'lucide-react';

const DEPT_COLORS: Record<string, string> = {
  CMC: '#0f172a',    // slate-900
  CESC: '#b45309',   // amber-700
  PWD: '#334155',    // slate-700
  MUDA: '#0284c7',   // sky-600
  DHO: '#059669',    // emerald-600
};

const getDeptIcon = (short: string) => {
  switch (short) {
    case 'CMC': return <Landmark className="w-6 h-6" />;
    case 'CESC': return <Zap className="w-6 h-6" />;
    case 'PWD': return <HardHat className="w-6 h-6" />;
    case 'MUDA': return <Map className="w-6 h-6" />;
    case 'DHO': return <Stethoscope className="w-6 h-6" />;
    default: return <Building2 className="w-6 h-6" />;
  }
};

export default function DepartmentDirectory() {
  const [depts, setDepts] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Department | null>(null);

  useEffect(() => {
    getDepartments().then(r => { setDepts(r.data); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-stone-50 pt-[72px]">
      <div className="max-w-6xl mx-auto px-4 py-10">
        <div className="mb-10">
          <h1 className="text-3xl font-medium text-slate-800 tracking-tight mb-2">Government Agencies</h1>
          <p className="text-stone-500 text-sm">Official Mandya District administrative bodies and load tracking</p>
        </div>

        {loading && (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin w-8 h-8 border-2 border-slate-800 border-t-transparent rounded-full" />
          </div>
        )}

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {depts.map((dept, i) => {
            const color = DEPT_COLORS[dept.short] || '#475569';
            return (
              <motion.div key={dept.id}
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                onClick={() => setSelected(dept)}
                className="bg-white rounded-xl border border-stone-200 p-6 cursor-pointer hover:shadow-md transition-all group">
                <div className="flex items-start justify-between mb-5">
                  <div className="w-12 h-12 rounded-lg flex items-center justify-center text-slate-700 bg-stone-100 group-hover:bg-stone-200 transition-colors">
                    {getDeptIcon(dept.short)}
                  </div>
                  <div className="text-right">
                    <div className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">Active Cases</div>
                    <div className="text-2xl font-bold text-slate-800">{dept.active_complaints}</div>
                  </div>
                </div>
                
                <h3 className="font-semibold text-slate-800 mb-1 line-clamp-1">{dept.name}</h3>
                <p className="text-xs text-stone-500 mb-5 line-clamp-2 min-h-[32px]">{dept.scope}</p>

                <div className="space-y-2.5 border-t border-stone-100 pt-4">
                  <div className="flex items-center gap-2.5 text-xs text-stone-600 font-medium">
                    <Briefcase className="w-4 h-4 text-stone-400 flex-shrink-0" />
                    <span className="truncate">{dept.officer_name}</span>
                  </div>
                  <div className="flex items-center gap-2.5 text-xs text-stone-600">
                    <Phone className="w-4 h-4 text-stone-400 flex-shrink-0" />
                    <a href={`tel:${dept.officer_phone}`} onClick={e => e.stopPropagation()} className="hover:text-slate-800 transition-colors">
                      {dept.officer_phone}
                    </a>
                  </div>
                </div>

                <div className="mt-5 flex items-center justify-between">
                  <span className="text-[10px] font-bold px-2.5 py-1 rounded-md text-white tracking-wide" style={{ background: color }}>
                    {dept.short}
                  </span>
                  <span className="text-xs text-stone-400 font-medium flex items-center gap-1 group-hover:text-slate-800 transition-colors">
                    Details <ExternalLink className="w-3.5 h-3.5" />
                  </span>
                </div>
              </motion.div>
            );
          })}
        </div>

        {selected && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setSelected(null)}>
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
              onClick={e => e.stopPropagation()}
              className="bg-white rounded-xl p-8 max-w-lg w-full shadow-2xl border border-stone-200">
              <div className="flex items-start gap-5 mb-6">
                <div className="w-16 h-16 rounded-xl flex items-center justify-center text-slate-700 bg-stone-100">
                  {getDeptIcon(selected.short)}
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-slate-800 leading-tight mb-1">{selected.name}</h2>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded text-white inline-block"
                    style={{ background: DEPT_COLORS[selected.short] || '#475569' }}>
                    {selected.short}
                  </span>
                </div>
              </div>

              <div className="space-y-4 mb-8">
                <div className="bg-stone-50 rounded-lg border border-stone-100 p-4">
                  <div className="text-[10px] font-bold text-stone-400 uppercase tracking-wider mb-1">Scope of Operations</div>
                  <p className="text-sm text-slate-700">{selected.scope}</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-stone-50 rounded-lg border border-stone-100 p-4">
                    <div className="text-[10px] font-bold text-stone-400 uppercase tracking-wider mb-1">Key Official</div>
                    <div className="text-sm font-medium text-slate-800">{selected.officer_name}</div>
                  </div>
                  <div className="bg-stone-50 rounded-lg border border-stone-100 p-4">
                    <div className="text-[10px] font-bold text-stone-400 uppercase tracking-wider mb-1">Open Cases</div>
                    <div className="text-xl font-bold text-slate-800">
                      {selected.active_complaints}
                    </div>
                  </div>
                </div>
                <div className="bg-stone-50 rounded-lg border border-stone-100 p-4 space-y-3">
                  <div className="flex items-center gap-3 text-sm font-medium text-slate-700">
                    <Phone className="w-4 h-4 text-stone-400" />
                    <a href={`tel:${selected.officer_phone}`} className="hover:underline">{selected.officer_phone}</a>
                  </div>
                  <div className="flex items-start gap-3 text-sm text-slate-600">
                    <MapPin className="w-4 h-4 text-stone-400 flex-shrink-0" />
                    <span>{selected.office_address}</span>
                  </div>
                </div>
              </div>

              <button onClick={() => setSelected(null)}
                className="w-full py-2.5 bg-slate-800 text-white rounded-lg text-sm font-medium hover:bg-slate-700 transition-colors">
                Dismiss
              </button>
            </motion.div>
          </div>
        )}
      </div>
    </div>
  );
}

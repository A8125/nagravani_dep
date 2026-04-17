import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { useEffect, useState } from 'react';
import { getFeed, upvoteComplaint, type Complaint } from '../lib/api';
import { AlertTriangle, Zap, Droplets, Wind, Heart, MapPin, Users, ArrowRight, CheckCircle2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

// Fix default leaflet icon
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const CATEGORY_COLOR: Record<string, string> = {
  Roads: '#ef4444', Water: '#3b82f6', Power: '#f59e0b',
  Drainage: '#8b5cf6', Health: '#10b981', Other: '#6b7280',
};
const CATEGORY_ICON_COMP: Record<string, React.ElementType> = {
  Roads: AlertTriangle, Water: Droplets, Power: Zap,
  Drainage: Wind, Health: Heart, Other: MapPin,
};

function coloredIcon(category: string) {
  const color = CATEGORY_COLOR[category] || '#6b7280';
  return L.divIcon({
    className: '',
    html: `<div style="
      background:${color};width:28px;height:28px;border-radius:50% 50% 50% 0;
      transform:rotate(-45deg);border:3px solid white;
      box-shadow:0 2px 8px rgba(0,0,0,0.3);">
    </div>`,
    iconAnchor: [14, 28],
  });
}

function FitBounds({ complaints }: { complaints: Complaint[] }) {
  const map = useMap();
  useEffect(() => {
    // Filter out complaints with invalid coordinates
    const validComplaints = complaints.filter(c => 
      typeof c.lat === 'number' && 
      typeof c.lng === 'number' && 
      !isNaN(c.lat) && 
      !isNaN(c.lng)
    );
    if (validComplaints.length > 0) {
      const bounds = L.latLngBounds(validComplaints.map(c => [c.lat, c.lng]));
      map.fitBounds(bounds, { padding: [40, 40] });
    }
  }, [complaints, map]);
  return null;
}

const CATEGORIES = ['All', 'Roads', 'Water', 'Power', 'Drainage', 'Health'];
const STATUSES   = ['All', 'pending', 'inProgress', 'resolved'];

export default function MapPage() {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [filtered, setFiltered]     = useState<Complaint[]>([]);
  const [loading, setLoading]       = useState(true);
  const [activeCategory, setActiveCategory] = useState('All');
  const [activeStatus, setActiveStatus]     = useState('All');
  const [selected, setSelected]     = useState<Complaint | null>(null);
  const [mapReady, setMapReady]     = useState(false);

  useEffect(() => {
    // Ensure map container has dimensions before rendering map
    const timer = setTimeout(() => setMapReady(true), 100);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    getFeed().then(r => {
      setComplaints(r.data);
      setFiltered(r.data);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  useEffect(() => {
    let result = complaints;
    if (activeCategory !== 'All') result = result.filter(c => c.category === activeCategory);
    if (activeStatus   !== 'All') result = result.filter(c => c.status.toLowerCase()   === activeStatus.toLowerCase());
    setFiltered(result);
  }, [activeCategory, activeStatus, complaints]);

  const handleUpvote = async (id: string) => {
    const r = await upvoteComplaint(id);
    setComplaints(prev => prev.map(c => c.id === id ? { ...c, upvoteCount: r.upvoteCount, priorityScore: r.priorityScore } : c));
  };

  const statusColor: Record<string, string> = {
    pending: 'bg-amber-100 text-amber-800',
    inprogress: 'bg-blue-100 text-blue-800',
    resolved: 'bg-green-100 text-green-800',
    rejected: 'bg-red-100 text-red-800',
  };

  return (
    <div className="min-h-screen bg-cream pt-[72px]">
      {/* Header */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        <h1 className="font-serif text-3xl text-charcoal mb-1">Live City Map</h1>
        <p className="text-stone text-sm mb-4">Real-time civic issues across Mandya, Karnataka</p>

        {/* Filters */}
        <div className="flex flex-wrap gap-2 mb-4">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-medium text-stone uppercase tracking-wide">Category:</span>
            {CATEGORIES.map(cat => (
              <button key={cat} onClick={() => setActiveCategory(cat)}
                className={`px-3 py-1 text-xs rounded-full border transition-all ${
                  activeCategory === cat
                    ? 'bg-charcoal text-white border-charcoal'
                    : 'bg-white text-stone border-border hover:border-charcoal'
                }`}>
                {cat}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-medium text-stone uppercase tracking-wide ml-2">Status:</span>
            {STATUSES.map(s => (
              <button key={s} onClick={() => setActiveStatus(s)}
                className={`px-3 py-1 text-xs rounded-full border transition-all ${
                  activeStatus === s
                    ? 'bg-charcoal text-white border-charcoal'
                    : 'bg-white text-stone border-border hover:border-charcoal'
                }`}>
                {s === 'All' ? 'All' : s === 'inProgress' ? 'In Progress' : s.charAt(0).toUpperCase() + s.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Map + Sidebar */}
      <div className="max-w-7xl mx-auto px-4 pb-10 grid lg:grid-cols-3 gap-6">
        {/* Map */}
        <div className="lg:col-span-2 rounded-2xl overflow-hidden shadow-lg border border-border bg-stone-100" style={{ height: 520 }}>
          {!mapReady ? (
            <div className="flex items-center justify-center h-full bg-cream">
              <div className="animate-spin w-8 h-8 border-2 border-charcoal border-t-transparent rounded-full" />
            </div>
          ) : (
            <MapContainer center={[12.5218, 76.8951]} zoom={14} style={{ height: '100%', width: '100%' }}>
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; <a href="https://openstreetmap.org">OpenStreetMap</a>'
              />
              <FitBounds complaints={filtered} />
              {filtered
                .filter(c => typeof c.lat === 'number' && typeof c.lng === 'number' && !isNaN(c.lat) && !isNaN(c.lng))
                .map(c => (
                <Marker key={c.id} position={[c.lat, c.lng]} icon={coloredIcon(c.category)}
                  eventHandlers={{ click: () => setSelected(c) }}>
                  <Popup>
                    <div className="min-w-[180px]">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColor[c.status] || ''}`}>
                        {c.status}
                      </span>
                      <p className="font-semibold mt-1 text-sm">{c.title}</p>
                      <p className="text-xs text-gray-500">{c.dept_short} · {c.upvoteCount} affected</p>
                      <button onClick={() => handleUpvote(c.id)}
                        className="mt-2 text-xs bg-charcoal text-white px-3 py-1 rounded-full hover:bg-charcoal/80 transition-colors">
                        + Add Me Too
                      </button>
                    </div>
                  </Popup>
                </Marker>
              ))}
            </MapContainer>
          )}
        </div>

        {/* Sidebar: issue list */}
        <div className="space-y-3 overflow-y-auto" style={{ maxHeight: 520 }}>
          {filtered.length === 0 && !loading && (
            <div className="text-center text-stone py-10">No issues match these filters.</div>
          )}
          {filtered.map((c, i) => {
            const IconComp = CATEGORY_ICON_COMP[c.category] || MapPin;
            return (
              <motion.div key={c.id} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                onClick={() => setSelected(c)}
                className={`p-4 rounded-xl border cursor-pointer transition-all hover:shadow-md ${
                  selected?.id === c.id ? 'border-charcoal bg-white' : 'border-border bg-white'
                }`}>
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{ background: CATEGORY_COLOR[c.category] + '20' }}>
                    <IconComp className="w-4 h-4" style={{ color: CATEGORY_COLOR[c.category] }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-charcoal line-clamp-1">{c.title}</p>
                    <p className="text-xs text-stone mt-0.5 line-clamp-1">{c.address}</p>
                    <div className="flex items-center gap-3 mt-2">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColor[c.status.toLowerCase()] || ''}`}>{c.status}</span>
                      <span className="flex items-center gap-1 text-xs text-stone">
                        <Users className="w-3 h-3" />{c.upvoteCount}
                      </span>
                      <span className="text-xs font-medium" style={{ color: CATEGORY_COLOR[c.category] }}>{c.dept_short}</span>
                    </div>
                  </div>
                </div>
                <button onClick={e => { e.stopPropagation(); handleUpvote(c.id); }}
                  className="mt-2 w-full text-xs border border-border rounded-full py-1 hover:bg-cream transition-colors text-stone flex items-center justify-center gap-1">
                  <Users className="w-3 h-3" /> Add Me Too
                </button>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Legend */}
      <div className="max-w-7xl mx-auto px-4 pb-6 flex flex-wrap gap-4">
        {Object.entries(CATEGORY_COLOR).filter(([k]) => k !== 'Other').map(([cat, color]) => (
          <div key={cat} className="flex items-center gap-2 text-xs text-stone">
            <div className="w-3 h-3 rounded-full" style={{ background: color }} />
            {cat}
          </div>
        ))}
        <Link to="/raise" className="ml-auto inline-flex items-center gap-1 text-xs bg-charcoal text-white px-4 py-2 rounded-full hover:bg-charcoal/90 transition-colors">
          Report an Issue <ArrowRight className="w-3 h-3" />
        </Link>
      </div>

      {/* Twitter-style News Feed */}
      <div className="max-w-7xl mx-auto px-4 pb-12 mt-6">
        <div className="bg-white rounded-2xl border border-border overflow-hidden shadow-sm">
          <div className="bg-stone-50 border-b border-border p-4 flex items-center justify-between">
            <h2 className="font-serif text-lg text-charcoal flex items-center gap-2">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-500"></span>
              </span>
              Civic Updates Live
            </h2>
            <span className="text-xs text-stone font-medium uppercase tracking-wider">Mandya Feed</span>
          </div>
          
          <div className="divide-y divide-border max-h-[350px] overflow-y-auto">
            {complaints.length === 0 ? (
               <div className="p-8 text-center text-stone text-sm">No updates yet.</div>
            ) : (
              complaints.map((c, i) => (
                <motion.div
                  key={'news-'+c.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1, type: "spring", stiffness: 100 }}
                  className="p-5 hover:bg-stone-50 transition-colors flex gap-4"
                >
                  <div className="w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center mt-1"
                       style={{ background: CATEGORY_COLOR[c.category] + '20' }}>
                    <AlertTriangle className="w-5 h-5" style={{ color: CATEGORY_COLOR[c.category] }} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-bold text-sm text-charcoal">{c.dept_short || 'NagaraVaani'}</span>
                      <span className="text-xs text-stone font-medium">@mandya_{c.dept_short?.toLowerCase() || 'civic'}</span>
                      <span className="text-stone-300 mx-1">·</span>
                      <span className="text-xs text-stone">{new Date(c.createdAt).toLocaleDateString()}</span>
                    </div>
                    <div className="flex gap-2">
                      {c.status.toLowerCase() === 'resolved' && <CheckCircle2 className="w-5 h-5 flex-shrink-0 text-green-600 mt-0.5" />}
                      {c.status.toLowerCase() === 'inprogress' && <Zap className="w-5 h-5 flex-shrink-0 text-blue-600 mt-0.5" />}
                      {c.status.toLowerCase() !== 'resolved' && c.status.toLowerCase() !== 'inprogress' && <AlertTriangle className="w-5 h-5 flex-shrink-0 text-orange-600 mt-0.5" />}
                      <p className="text-sm text-slate-700 leading-relaxed">
                        {c.status.toLowerCase() === 'resolved' ? (
                          <><span className="font-medium text-green-700">Resolved:</span> The {c.category.toLowerCase()} issue "{c.title}" reported by a citizen has been successfully fixed by our team. Thanks for keeping Mandya safe!</>
                        ) : c.status.toLowerCase() === 'inprogress' ? (
                          <><span className="font-medium text-blue-700">Update:</span> Our team is currently working on the {c.category.toLowerCase()} issue "{c.title}" at {c.address ? c.address.split(',')[0] : 'the pinned location'}.</>
                        ) : (
                          <><span className="font-medium text-orange-700">Alert:</span> A new {c.severity.toLowerCase()} severity {c.category.toLowerCase()} issue "{c.title}" was just reported at {c.address ? c.address.split(',')[0] : 'the pinned location'}. Routing to nearest officers now.</>
                        )}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-4 mt-3 text-xs text-stone font-medium">
                      <span className="flex items-center gap-1.5 hover:text-blue-500 cursor-pointer transition-colors">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
                         Discuss
                      </span>
                      <span className="flex items-center gap-1.5 hover:text-green-500 cursor-pointer transition-colors">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                        {c.upvoteCount} Reposts
                      </span>
                      <span className="flex items-center gap-1.5 hover:text-red-500 cursor-pointer transition-colors" onClick={() => handleUpvote(c.id)}>
                        <Heart className="w-4 h-4" />
                        Like
                      </span>
                    </div>
                  </div>
                </motion.div>
              ))
            )}
          </div>
          <div className="bg-stone-50 border-t border-border p-3 text-center">
            <button className="text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors">
              Show more updates
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

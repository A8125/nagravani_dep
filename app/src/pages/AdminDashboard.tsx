import { useEffect, useState } from 'react';
import { getFeed, updateStatus, type Complaint } from '../lib/api';
import { AlertCircle, Clock, CheckCircle, TrendingUp, Filter, MapPin, Loader2, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';

// Fix default leaflet icon
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

function FitBounds({ complaints }: { complaints: Complaint[] }) {
  const map = useMap();
  useEffect(() => {
    if (complaints.length > 0) {
      const bounds = L.latLngBounds(complaints.map(c => [c.lat, c.lng]));
      map.fitBounds(bounds, { padding: [40, 40] });
    }
  }, [complaints, map]);
  return null;
}

export default function AdminDashboard() {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const [activeDept, setActiveDept] = useState('All');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const { data } = await getFeed();
      setComplaints(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (id: string, newStatus: string) => {
    setUpdating(id);
    try {
      await updateStatus(id, newStatus);
      setComplaints(prev => prev.map(c => c.id === id ? { ...c, status: newStatus } : c));
    } catch (e) {
      console.error(e);
      alert('Failed to update status');
    } finally {
      setUpdating(null);
    }
  };

  const stats = {
    total: complaints.length,
    pending: complaints.filter(c => c.status.toLowerCase() === 'pending').length,
    inProgress: complaints.filter(c => c.status.toLowerCase() === 'inprogress').length,
    resolved: complaints.filter(c => c.status.toLowerCase() === 'resolved').length,
  };

  const visibleComplaints = activeDept === 'All' ? complaints : complaints.filter(c => c.dept_short === activeDept);

  return (
    <div className="min-h-screen bg-stone-100 dark:bg-[#0f0f0f] pt-[72px]">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-serif text-slate-800 dark:text-white mb-2">Government Admin Dashboard</h1>
          <p className="text-stone-500 dark:text-gray-400">Manage, track, and resolve civic complaints across Mandya.</p>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white dark:bg-[#1a1a1a] rounded-xl p-6 shadow-sm border border-stone-200 dark:border-white/8">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-stone-100 dark:bg-[#2c2c2e] rounded-lg"><TrendingUp className="w-5 h-5 text-stone-600 dark:text-gray-400" /></div>
              <div className="text-stone-500 dark:text-gray-400 font-medium">Total Issues</div>
            </div>
            <div className="text-3xl font-bold text-slate-800 dark:text-white">{stats.total}</div>
          </div>
          <div className="bg-white dark:bg-[#1a1a1a] rounded-xl p-6 shadow-sm border border-orange-200 dark:border-amber-500/30">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-orange-100 dark:bg-amber-500/15 rounded-lg"><AlertCircle className="w-5 h-5 text-orange-600 dark:text-amber-400" /></div>
              <div className="text-orange-600 dark:text-amber-400 font-medium">Pending</div>
            </div>
            <div className="text-3xl font-bold text-slate-800 dark:text-white">{stats.pending}</div>
          </div>
          <div className="bg-white dark:bg-[#1a1a1a] rounded-xl p-6 shadow-sm border border-blue-200 dark:border-blue-500/30">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-blue-100 dark:bg-blue-500/15 rounded-lg"><Clock className="w-5 h-5 text-blue-600 dark:text-blue-400" /></div>
              <div className="text-blue-600 dark:text-blue-400 font-medium">In Progress</div>
            </div>
            <div className="text-3xl font-bold text-slate-800 dark:text-white">{stats.inProgress}</div>
          </div>
          <div className="bg-white dark:bg-[#1a1a1a] rounded-xl p-6 shadow-sm border border-green-200 dark:border-green-500/30">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-green-100 dark:bg-green-500/15 rounded-lg"><CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" /></div>
              <div className="text-green-600 dark:text-green-400 font-medium">Resolved</div>
            </div>
            <div className="text-3xl font-bold text-slate-800 dark:text-white">{stats.resolved}</div>
          </div>
        </div>

        {/* Live Action Map */}
        <div className="bg-white dark:bg-[#1a1a1a] rounded-2xl shadow-sm border border-stone-200 dark:border-white/8 overflow-hidden mb-8">
          <div className="p-6 border-b border-stone-200 dark:border-white/8 flex justify-between items-center bg-stone-50 dark:bg-[#1c1c1e]">
            <h2 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
              <MapPin className="w-5 h-5 text-stone-500 dark:text-gray-400" />
              Spatial Heatmap & Routing
            </h2>
          </div>
          <div className="w-full h-[400px] bg-stone-100 dark:bg-[#1c1c1e] relative">
            {!loading && (
              <MapContainer center={[12.5218, 76.8951]} zoom={14} style={{ height: '100%', width: '100%', zIndex: 0 }}>
                <TileLayer
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  attribution='&copy; <a href="https://openstreetmap.org">OpenStreetMap</a>'
                />
                <FitBounds complaints={visibleComplaints} />
                {visibleComplaints.map(c => (
                  <Marker key={c.id} position={[c.lat, c.lng]}>
                    <Popup>
                      <div className="min-w-[200px] dark:bg-[#1a1a1a] dark:text-white">
                        <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded ${
                          c.status.toLowerCase() === 'resolved' ? 'bg-green-100 dark:bg-green-500/15 text-green-700 dark:text-green-400' :
                          c.status.toLowerCase() === 'inprogress' ? 'bg-blue-100 dark:bg-blue-500/15 text-blue-700 dark:text-blue-400' :
                          'bg-orange-100 dark:bg-amber-500/15 text-orange-700 dark:text-amber-400'
                        }`}>
                          {c.status}
                        </span>
                        <div className="text-xs text-stone-500 dark:text-gray-400 font-medium float-right">{c.dept_short}</div>
                        <h4 className="font-bold text-slate-800 dark:text-white mt-2 mb-1">{c.title}</h4>
                        <p className="text-xs text-stone-600 dark:text-gray-400 line-clamp-2 mb-2">{c.description}</p>
                        <div className="text-xs font-semibold text-slate-800 dark:text-white border-t border-stone-100 dark:border-white/10 pt-2 flex justify-between items-center">
                          <span>{c.severity} Severity</span>
                          <span>👥 {c.upvoteCount}</span>
                        </div>
                      </div>
                    </Popup>
                  </Marker>
                ))}
              </MapContainer>
            )}
            {loading && (
              <div className="absolute inset-0 flex items-center justify-center bg-white/50 dark:bg-black/50 backdrop-blur-sm z-10">
                <Loader2 className="w-8 h-8 animate-spin text-stone-400 dark:text-gray-500" />
              </div>
            )}
          </div>
        </div>

        {/* Live Action Table */}
        <div className="bg-white dark:bg-[#1a1a1a] rounded-2xl shadow-sm border border-stone-200 dark:border-white/8 overflow-hidden">
          <div className="p-6 border-b border-stone-200 dark:border-white/8 flex justify-between items-center bg-stone-50 dark:bg-[#1c1c1e]">
            <h2 className="text-lg font-bold text-slate-800 dark:text-white">Live Action Queue</h2>
            <div className="relative">
              <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                <Filter className="w-4 h-4 text-stone-500 dark:text-gray-400" />
              </div>
              <select
                value={activeDept}
                onChange={(e) => setActiveDept(e.target.value)}
                className="pl-9 pr-8 py-2 text-sm bg-white dark:bg-[#1c1c1e] border border-stone-300 dark:border-white/10 rounded-lg text-stone-700 dark:text-gray-300 font-medium outline-none cursor-pointer appearance-none hover:bg-stone-50 dark:hover:bg-[#2c2c2e] transition-colors"
                style={{ backgroundImage: `url("data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%23444%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8c0-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 0.7rem top 50%', backgroundSize: '0.55rem auto' }}
              >
                <option value="All" className="dark:bg-[#1c1c1e] dark:text-gray-300">All Departments</option>
                <option value="CMC" className="dark:bg-[#1c1c1e] dark:text-gray-300">CMC (Municipal)</option>
                <option value="CESC" className="dark:bg-[#1c1c1e] dark:text-gray-300">CESC (Power)</option>
                <option value="PWD" className="dark:bg-[#1c1c1e] dark:text-gray-300">PWD (Roads)</option>
                <option value="MUDA" className="dark:bg-[#1c1c1e] dark:text-gray-300">MUDA (Zoning)</option>
                <option value="DHO" className="dark:bg-[#1c1c1e] dark:text-gray-300">DHO (Health)</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            {loading ? (
              <div className="p-12 flex justify-center bg-white dark:bg-[#1a1a1a]"><Loader2 className="w-8 h-8 animate-spin text-stone-400 dark:text-gray-500" /></div>
            ) : visibleComplaints.length === 0 ? (
              <div className="p-12 text-center text-stone-500 dark:text-gray-400 bg-white dark:bg-[#1a1a1a]">No complaints found.</div>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-stone-50 dark:bg-[#1c1c1e] text-stone-500 dark:text-gray-400 text-xs uppercase tracking-wider border-b border-stone-200 dark:border-white/8">
                    <th className="p-4 font-medium min-w-[250px]">Issue</th>
                    <th className="p-4 font-medium">Location</th>
                    <th className="p-4 font-medium">Department</th>
                    <th className="p-4 font-medium">Severity</th>
                    <th className="p-4 font-medium flexjustify-center">Citizens Affected</th>
                    <th className="p-4 font-medium text-right">Action / Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 dark:divide-white/6">
                  {visibleComplaints.map((c, i) => (
                    <motion.tr key={c.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.05 }} className="bg-white dark:bg-[#1a1a1a] hover:bg-stone-50/50 dark:hover:bg-[#2c2c2e]/50 transition-colors">
                      <td className="p-4">
                        <div className="flex gap-3 items-start">
                          {c.photoPath && (
                            <motion.div 
                              layoutId={`image-admin-${c.id}`}
                              className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0 cursor-pointer border border-stone-200 dark:border-white/10"
                              onClick={() => setSelectedImage(`${import.meta.env.VITE_API_URL}${c.photoPath}`)}
                            >
                              <motion.img 
                                src={`${import.meta.env.VITE_API_URL}${c.photoPath}`} 
                                alt="Issue thumbnail"
                                className="w-full h-full object-cover hover:scale-110 transition-transform duration-300"
                              />
                            </motion.div>
                          )}
                          <div>
                            <div className="font-semibold text-slate-800 dark:text-white text-sm">{c.title}</div>
                            <div className="text-xs text-stone-500 dark:text-gray-400 truncate max-w-[200px]">{c.description}</div>
                          </div>
                        </div>
                      </td>
                      <td className="p-4 text-xs text-stone-600 dark:text-gray-400">
                        <div className="flex items-center gap-1"><MapPin className="w-3 h-3 text-stone-400 dark:text-gray-500" /> {c.address ? c.address.split(',')[0] : 'GPS pinned'}</div>
                      </td>
                      <td className="p-4">
                        <span className="inline-block px-2.5 py-1 bg-stone-100 dark:bg-[#2c2c2e] text-stone-700 dark:text-gray-300 text-xs font-bold rounded">
                          {c.dept_short || 'PWD'}
                        </span>
                      </td>
                      <td className="p-4">
                        <span className={`text-xs font-medium ${c.severity === 'Critical' ? 'text-red-600 dark:text-red-400' : c.severity === 'High' ? 'text-orange-600 dark:text-amber-400' : 'text-stone-600 dark:text-gray-400'}`}>
                          {c.severity}
                        </span>
                      </td>
                      <td className="p-4 text-center">
                        <span className="font-bold text-slate-700 dark:text-white">{c.upvoteCount}</span>
                      </td>
                      <td className="p-4 text-right">
                        {updating === c.id ? (
                          <div className="flex justify-end"><Loader2 className="w-5 h-5 animate-spin text-stone-400 dark:text-gray-500" /></div>
                        ) : (
                          <select
                            value={c.status}
                            onChange={(e) => handleStatusChange(c.id, e.target.value)}
                            className={`text-sm font-medium rounded-lg px-3 py-1.5 border outline-none cursor-pointer bg-white dark:bg-[#1c1c1e] ${
                              c.status.toLowerCase() === 'resolved' ? 'bg-green-50 dark:bg-green-500/10 border-green-200 dark:border-green-500/30 text-green-700 dark:text-green-400' :
                              c.status.toLowerCase() === 'inprogress' ? 'bg-blue-50 dark:bg-blue-500/10 border-blue-200 dark:border-blue-500/30 text-blue-700 dark:text-blue-400' :
                              'bg-orange-50 dark:bg-amber-500/10 border-orange-200 dark:border-amber-500/30 text-orange-700 dark:text-amber-400'
                            }`}
                          >
                            <option value="Pending" className="dark:bg-[#1c1c1e] dark:text-gray-300">Pending</option>
                            <option value="InProgress" className="dark:bg-[#1c1c1e] dark:text-gray-300">In Progress</option>
                            <option value="Resolved" className="dark:bg-[#1c1c1e] dark:text-gray-300">Resolved</option>
                            <option value="Rejected" className="dark:bg-[#1c1c1e] dark:text-gray-300">Rejected</option>
                          </select>
                        )}
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      {/* Lightbox Overlay */}
      <AnimatePresence>
        {selectedImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 dark:bg-black/90 backdrop-blur-sm"
            onClick={() => setSelectedImage(null)}
          >
            <button 
              className="absolute top-6 right-6 p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors"
              onClick={() => setSelectedImage(null)}
            >
              <X className="w-6 h-6" />
            </button>
            <motion.div 
              className="relative max-w-5xl w-full max-h-[90vh] flex items-center justify-center rounded-2xl overflow-hidden shadow-2xl"
              onClick={e => e.stopPropagation()}
            >
              <motion.img 
                src={selectedImage} 
                alt="Enlarged issue" 
                layoutId={`image-admin-${complaints.find(c => `${import.meta.env.VITE_API_URL}${c.photoPath}` === selectedImage)?.id}`}
                className="w-full h-full object-contain max-h-[90vh]"
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
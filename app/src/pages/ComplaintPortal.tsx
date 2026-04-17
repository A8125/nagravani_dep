import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Camera, CheckCircle, Loader2, Upload, X, ThumbsUp, Link as LinkIcon } from 'lucide-react';
import { raiseComplaint } from '../lib/api';
import { useApp } from '../context/AppContext';

// Ward options for Mandya
const WARDS = [
  'Gandhi Nagar',
  'Vinobanagar',
  'KR Market',
  'Bus Stand Area',
  'Mandya North',
  'Mandya South',
  'Netaji Nagar',
  'Kasturba Nagar',
];

const WARD_KANNADA: Record<string, string> = {
  'Gandhi Nagar': 'ಗಾಂಧಿ ನಗರ',
  'Vinobanagar': 'ವಿನೋಬಾನಗರ',
  'KR Market': 'ಕೆ.ಆರ್. ಮಾರ್ಕೆಟ್',
  'Bus Stand Area': 'ಬಸ್ ಸ್ಟ್ಯಾಂಡ್ ಪ್ರದೇಶ',
  'Mandya North': 'ಮಂಡ್ಯ ಉತ್ತರ',
  'Mandya South': 'ಮಂಡ್ಯ ದಕ್ಷಿಣ',
  'Netaji Nagar': 'ನೇತಾಜಿ ನಗರ',
  'Kasturba Nagar': 'ಕಸ್ತೂರ್ಬಾ ನಗರ',
};

// Categories with emojis
const CATEGORIES = [
  { value: 'road', emoji: '', label: 'Road', labelKn: 'ರಸ್ತೆ' },
  { value: 'water', emoji: '', label: 'Water', labelKn: 'ನೀರು' },
  { value: 'streetlight', emoji: '', label: 'Street Light', labelKn: 'ವಿದ್ಯುತ್ ದೀಪ' },
  { value: 'garbage', emoji: '', label: 'Garbage', labelKn: 'ಕಸ' },
  { value: 'sewage', emoji: '', label: 'Sewage', labelKn: ' sewage' },
  { value: 'noise', emoji: '', label: 'Noise', labelKn: 'ಘೋಷ' },
  { value: 'encroachment', emoji: '', label: 'Encroachment', labelKn: 'ಅತಿಕ್ರಮಣ' },
];

// Severity options
const SEVERITIES = [
  { value: 'Low', label: 'Low', labelKn: 'ಕಡಿಮೆ', desc: 'Minor inconvenience', descKn: 'ಸಣ್ಣ ತೊಂದರೆ' },
  { value: 'Medium', label: 'Medium', labelKn: 'ಮಧ್ಯಮ', desc: 'Affects daily routine', descKn: 'ದೈನಂದಿನ ಕೆಲಸಕ್ಕೆ ತೊಂದರೆ' },
  { value: 'High', label: 'High', labelKn: 'ಹೆಚ್ಚು', desc: 'Safety risk / major issue', descKn: 'ಸುರಕ್ಷತಾ ಅಪಾಯ / ದೊಡ್ಡ ಸಮಸ್ಯೆ' },
  { value: 'Critical', label: 'Critical', labelKn: 'ಗಂಭೀರ', desc: 'Emergency / risk to life', descKn: 'ತುರ್ತು / ಜೀವನಕ್ಕೆ ಅಪಾಯ' },
];

export default function ComplaintPortal() {
  const { lang } = useApp();
  const isKannada = lang === 'kn';

  const [step, setStep] = useState(0);
  const [lat, setLat] = useState<number | null>(null);
  const [lng, setLng] = useState<number | null>(null);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [photo, setPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  const [form, setForm] = useState({
    title: '',
    description: '',
    category: '',
    ward: '',
    severity: 'Medium',
  });

  const [citizenName, setCitizenName] = useState('');
  const [aadhaarRaw, setAadhaarRaw] = useState('');

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  const handleGPS = () => {
    setGpsLoading(true);
    navigator.geolocation.getCurrentPosition(
      (p) => {
        setLat(p.coords.latitude);
        setLng(p.coords.longitude);
        setGpsLoading(false);
      },
      () => {
        setGpsLoading(false);
        setError(isKannada ? 'ಸ್ಥಳ ಪಡೆಯಲು ಸಾಧ್ಯವಾಗಲಿಲ್ಲ' : 'Could not get location');
      }
    );
  };

  const handlePhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError(isKannada ? 'ಚಿತ್ರದ ಗಾತ್ರ 5MB ಗಿಂತ ಹೆಚ್ಚಿರಬಾರದು' : 'Photo must be under 5MB');
        return;
      }
      setPhoto(file);
      setPhotoPreview(URL.createObjectURL(file));
    }
  };

  const removePhoto = () => {
    setPhoto(null);
    setPhotoPreview(null);
    if (fileRef.current) fileRef.current.value = '';
  };

  const getSeverityColor = (severity: string) => {
    const colors: Record<string, string> = {
      Critical: 'text-red-600 bg-red-50 border-red-200',
      High: 'text-orange-600 bg-orange-50 border-orange-200',
      Medium: 'text-yellow-600 bg-yellow-50 border-yellow-200',
      Low: 'text-green-600 bg-green-50 border-green-200',
    };
    return colors[severity] || 'text-stone bg-cream border-border';
  };

  const submit = async () => {
    if (!form.title || !form.description || !form.category || !form.ward) {
      setError(isKannada ? 'ದಯವಿಟ್ಟು ಎಲ್ಲ ಕಡ್ಡಾಯ ಕ್ಷೇತ್ರಗಳನ್ನು ಭರ್ತಿ ಮಾಡಿ' : 'Please fill all required fields');
      return;
    }

    setLoading(true);
    setError('');

    // Validate citizen name
    if (!citizenName.trim()) {
      setError(isKannada ? 'ಹೆಸರು ಕಡ್ಡಾಯವಾಗಿದೆ' : 'Name is required');
      setLoading(false);
      return;
    }

    // Validate Aadhaar
    if (!aadhaarRaw || !/^[0-9]{12}$/.test(aadhaarRaw)) {
      setError(isKannada ? '12 ಅಂಕಿಗಳ ಆಧಾರ್ ಸಂಖ್ಯೆ ಅಗತ್ಯ' : '12-digit Aadhaar number required');
      setLoading(false);
      return;
    }

    try {
      const fd = new FormData();
      fd.append('title', form.title);
      fd.append('description', form.description);
      fd.append('category', form.category);
      fd.append('ward', form.ward);
      fd.append('severity', form.severity);
      if (lat)       fd.append('lat', String(lat));
      if (lng) fd.append('lng', String(lng));
      if (photo) fd.append('photo', photo);
      fd.append('citizen_name', citizenName);
      fd.append('aadhaar', aadhaarRaw);

      const res = await raiseComplaint(fd);
      setResult(res);
      setStep(3); // Show confirmation
    } catch (err: any) {
      setError(err.message || (isKannada ? 'ಸಲ್ಲಿಸಲು ವಿಫಲವಾಗಿದೆ' : 'Failed to submit'));
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setStep(0);
    setLat(null);
    setLng(null);
    setPhoto(null);
    setPhotoPreview(null);
    setForm({ title: '', description: '', category: '', ward: '', severity: 'Medium' });
    setCitizenName('');
    setAadhaarRaw('');
    setResult(null);
    setError('');
  };

  return (
    <div className="min-h-screen bg-cream pt-[72px]">
      <div className="max-w-2xl mx-auto px-4 py-10">
        {/* Header */}
        <h1 className="font-serif text-3xl text-charcoal mb-1">
          {isKannada ? 'ದೂರು ಪೋರ್ಟಲ್' : 'Complaint Portal'}
        </h1>
        <p className="text-stone text-sm mb-8">
          {isKannada ? 'ಮಂಡ್ಯದಲ್ಲಿ ನಾಗರಿಕ ಸಮಸ್ಯೆ ವರದಿ ಮಾಡಿ — 2 ನಿಮಿಷಗಳಿಗಿಂತ ಕಡಿಮೆ ಸಮಯ ತೆಗೆದುಕೊಳ್ಳುತ್ತದೆ' : 'Report a civic issue in Mandya — takes less than 2 minutes'}
        </p>

        <AnimatePresence mode="wait">
          {/* STEP 0: Basic Details (Title, Category, Ward, Description) */}
          {step === 0 && (
            <motion.div
              key="details"
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
            >
              <div className="bg-white rounded-2xl border border-border p-6 space-y-6">
                {/* Title */}
                <div>
                  <label className="block text-xs font-medium text-stone uppercase tracking-wide mb-1.5">
                    {isKannada ? 'ಶೀರ್ಷಿಕೆ' : 'Title'} <span className="text-red-400">*</span>
                  </label>
                  <input
                    value={form.title}
                    onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                    placeholder={isKannada ? 'ಉದಾ: ಬಸ್ ನಿಲ್ದಾಣದ ಹತ್ತಿರ ಗುಂಡಿ' : 'e.g. Pothole near bus stand'}
                    className="w-full border border-border rounded-xl px-4 py-2.5 text-sm text-charcoal outline-none focus:border-charcoal transition-colors bg-cream"
                  />
                </div>

                {/* Category - Pill selector */}
                <div>
                  <label className="block text-xs font-medium text-stone uppercase tracking-wide mb-2">
                    {isKannada ? 'ವರ್ಗ' : 'Category'} <span className="text-red-400">*</span>
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {CATEGORIES.map((cat) => (
                      <button
                        key={cat.value}
                        onClick={() => setForm((f) => ({ ...f, category: cat.value }))}
                        className={`px-3 py-1.5 text-sm rounded-full border transition-all ${
                          form.category === cat.value
                            ? 'bg-charcoal text-white border-charcoal'
                            : 'border-border text-stone hover:border-charcoal'
                        }`}
                      >
                        {cat.emoji} {isKannada ? cat.labelKn : cat.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Ward - Dropdown */}
                <div>
                  <label className="block text-xs font-medium text-stone uppercase tracking-wide mb-1.5">
                    {isKannada ? 'ವಾರ್ಡ್' : 'Ward'} <span className="text-red-400">*</span>
                  </label>
                  <select
                    value={form.ward}
                    onChange={(e) => setForm((f) => ({ ...f, ward: e.target.value }))}
                    className="w-full border border-border rounded-xl px-4 py-2.5 text-sm text-charcoal outline-none focus:border-charcoal transition-colors bg-cream"
                  >
                    <option value="">{isKannada ? 'ವಾರ್ಡ್ ಆಯ್ಕೆ ಮಾಡಿ' : 'Select a ward'}</option>
                    {WARDS.map((ward) => (
                      <option key={ward} value={ward}>
                        {isKannada ? WARD_KANNADA[ward] : ward}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Description */}
                <div>
                  <label className="block text-xs font-medium text-stone uppercase tracking-wide mb-1.5">
                    {isKannada ? 'ವಿವರಣೆ' : 'Description'} <span className="text-red-400">*</span>
                  </label>
                  <textarea
                    value={form.description}
                    onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                    rows={4}
                    placeholder={
                      isKannada
                        ? 'ಸಮಸ್ಯೆಯನ್ನು ವಿವರಿಸಿ...'
                        : 'Describe the issue in detail...'
                    }
                    className="w-full border border-border rounded-xl px-4 py-2.5 text-sm text-charcoal outline-none focus:border-charcoal transition-colors bg-cream resize-none"
                  />
                </div>

                 {/* Severity - 4-option grid */}
                 <div>
                   <label className="block text-xs font-medium text-stone uppercase tracking-wide mb-2">
                     {isKannada ? 'ತೀವ್ರತೆ' : 'Severity'} <span className="text-stone/60">({isKannada ? 'ಐಚ್ಛಿಕ' : 'optional'})</span>
                   </label>

                 {/* Citizen Name */}
                 <div>
                   <label className="block text-xs font-medium text-stone uppercase tracking-wide mb-1.5">
                     {isKannada ? 'ಹೆಸರು' : 'Full Name'} <span className="text-red-400">*</span>
                   </label>
                   <input
                     value={citizenName}
                     onChange={(e) => setCitizenName(e.target.value)}
                     placeholder={isKannada ? 'ನಿಮ್ಮ ಹೆಸರು ನಮೂದಿಸಿ' : 'Enter your full name'}
                     maxLength={100}
                     required
                     className="w-full border border-border rounded-xl px-4 py-2.5 text-sm text-charcoal outline-none focus:border-charcoal transition-colors bg-cream"
                   />
                 </div>

                 {/* Aadhaar Number */}
                 <div>
                   <label className="block text-xs font-medium text-stone uppercase tracking-wide mb-1.5">
                     {isKannada ? 'ಆಧಾರ್ ಸಂಖ್ಯೆ' : 'Aadhaar Number'} <span className="text-red-400">*</span>
                   </label>
                    <input
                      value={aadhaarRaw}
                      onChange={(e) => {
                        const digits = e.target.value.replace(/\D/g, '').slice(0, 12);
                        setAadhaarRaw(digits);
                      }}
                      placeholder="12-digit Aadhaar number"
                      inputMode="numeric"
                      required
                      className="w-full border border-border rounded-xl px-4 py-2.5 text-sm text-charcoal outline-none focus:border-charcoal transition-colors bg-cream"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {SEVERITIES.map((s) => (
                      <button
                        key={s.value}
                        onClick={() => setForm((f) => ({ ...f, severity: s.value }))}
                        className={`p-3 rounded-xl border text-left transition-all ${
                          form.severity === s.value
                            ? 'border-charcoal bg-cream'
                            : 'border-border'
                        }`}
                      >
                        <div className={`text-sm font-medium ${
                          s.value === 'Critical' ? 'text-red-600' :
                          s.value === 'High' ? 'text-orange-600' :
                          s.value === 'Medium' ? 'text-yellow-600' : 'text-green-600'
                        }`}>
                          {isKannada ? s.labelKn : s.label}
                        </div>
                        <div className="text-xs text-stone">
                          {isKannada ? s.descKn : s.desc}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {error && <p className="text-sm text-red-500 mt-4 text-center">{error}</p>}

              <div className="flex justify-end mt-6">
                <button
                  onClick={() => setStep(1)}
                  disabled={!form.title || !form.description || !form.category || !form.ward}
                  className="inline-flex items-center gap-2 px-6 py-2.5 bg-charcoal text-white text-sm rounded-full disabled:opacity-40 hover:bg-charcoal/90 transition-colors"
                >
                  {isKannada ? 'ಮುಂದುವರಿಸಿ' : 'Continue'}
                </button>
              </div>
            </motion.div>
          )}

          {/* STEP 1: Location & Photo */}
          {step === 1 && (
            <motion.div
              key="location-photo"
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
            >
              <div className="bg-white rounded-2xl border border-border p-6 space-y-6">
                {/* Location */}
                <div>
                  <label className="block text-xs font-medium text-stone uppercase tracking-wide mb-3">
                    <MapPin className="w-4 h-4 inline mr-1" />
                    {isKannada ? 'ಸ್ಥಳ' : 'Location'} <span className="text-stone/60">({isKannada ? 'ಐಚ್ಛಿಕ' : 'optional'})</span>
                  </label>

                  <div className="flex flex-col gap-3">
                    <button
                      onClick={handleGPS}
                      disabled={gpsLoading}
                      className="flex items-center justify-center gap-2 px-4 py-3 border border-border rounded-xl text-sm text-stone hover:border-charcoal transition-colors bg-cream"
                    >
                      {gpsLoading ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <MapPin className="w-4 h-4" />
                      )}
                      {isKannada ? 'GPS ಬಳಸಿ' : 'Use GPS'}
                    </button>

                    {lat && lng && (
                      <div className="text-xs text-stone bg-cream px-3 py-2 rounded-xl">
                        📍 {lat.toFixed(6)}, {lng.toFixed(6)}
                      </div>
                    )}
                  </div>
                </div>

                {/* Photo Upload */}
                <div>
                  <label className="block text-xs font-medium text-stone uppercase tracking-wide mb-3">
                    <Camera className="w-4 h-4 inline mr-1" />
                    {isKannada ? 'ಫೋಟೋ' : 'Photo'} <span className="text-stone/60">({isKannada ? 'ಐಚ್ಛಿಕ, ಗರಿಷ್ಠ 5MB' : 'optional, max 5MB'})</span>
                  </label>

                  {photoPreview ? (
                    <div className="relative">
                      <img
                        src={photoPreview}
                        alt="Preview"
                        className="w-full h-48 object-cover rounded-xl"
                      />
                      <button
                        onClick={removePhoto}
                        className="absolute top-2 right-2 bg-white rounded-full p-1 shadow hover:shadow-md transition-shadow"
                      >
                        <X className="w-4 h-4 text-charcoal" />
                      </button>
                    </div>
                  ) : (
                    <div
                      onClick={() => fileRef.current?.click()}
                      className="border-2 border-dashed border-border rounded-xl p-8 flex flex-col items-center justify-center cursor-pointer hover:border-charcoal transition-colors bg-cream"
                    >
                      <Upload className="w-8 h-8 text-stone/40 mb-2" />
                      <span className="text-sm text-stone">
                        {isKannada ? 'ಫೋಟೋ ಅಪ್‌ಲೋಡ್ ಮಾಡಿ' : 'Upload a photo'}
                      </span>
                    </div>
                  )}
                  <input
                    ref={fileRef}
                    type="file"
                    accept="image/*"
                    hidden
                    onChange={handlePhoto}
                  />
                </div>
              </div>

              {error && <p className="text-sm text-red-500 mt-4 text-center">{error}</p>}

              <div className="flex justify-between mt-6">
                <button
                  onClick={() => setStep(0)}
                  className="flex items-center gap-2 px-6 py-2.5 border border-border rounded-full text-sm text-stone hover:border-charcoal transition-colors"
                >
                  {isKannada ? 'ಹಿಂದೆ' : 'Back'}
                </button>
                <button
                  onClick={submit}
                  disabled={loading}
                  className="inline-flex items-center gap-2 px-6 py-2.5 bg-charcoal text-white text-sm rounded-full disabled:opacity-40 hover:bg-charcoal/90 transition-colors"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      {isKannada ? 'ಸಲ್ಲಿಸಲಾಗುತ್ತಿದೆ...' : 'Submitting...'}
                    </>
                  ) : (
                    <>
                      {isKannada ? 'ದೂರು ಸಲ್ಲಿಸಿ' : 'Submit Complaint'}
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          )}

          {/* STEP 3: Confirmation - Success with merged status */}
          {step === 3 && result && (
            <motion.div
              key="confirm"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
            >
              {result.merged ? (
                /* Complaint merged into existing problem */
                <div className="bg-amber-50 rounded-2xl border border-amber-200 p-8 text-center">
                  <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <LinkIcon className="w-8 h-8 text-amber-600" />
                  </div>
                  <h2 className="font-serif text-2xl text-charcoal mb-2">
                    {isKannada ? 'ನಿಮ್ಮ ದೂರು ಇತರರೊಂದಿಗೆ ಸೇರಿಸಲಾಗಿದೆ!' : 'Your complaint was added to an existing problem!'}
                  </h2>
                  <p className="text-stone text-sm mb-6">
                    {isKannada
                      ? `ಈ ಸಮಸ್ಯೆಯನ್ನು ${result.problem?.upvoteCount || 0} ನಾಗರಿಕರು ವರದಿ ಮಾಡಿದ್ದಾರೆ.`
                      : `${result.problem?.upvoteCount || 0} citizens have reported this issue.`}
                  </p>

                  <div className="bg-white rounded-xl p-4 text-left space-y-3 mb-6 border border-amber-100">
                    <div className="flex justify-between text-sm">
                      <span className="text-stone">
                        {isKannada ? 'ದೂರು ID' : 'Complaint ID'}
                      </span>
                      <span className="font-mono text-charcoal font-medium">
                        {result.complaint?.id?.slice(0, 8).toUpperCase()}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-stone">
                        {isKannada ? 'ಸಮಸ್ಯೆ ID' : 'Problem ID'}
                      </span>
                      <span className="font-mono text-charcoal font-medium">
                        {result.problem?.id?.slice(0, 8).toUpperCase()}
                      </span>
                    </div>
                   <div className="flex justify-between text-sm">
                       <span className="text-stone">
                         {isKannada ? 'ದೂರು ID' : 'Complaint ID'}
                       </span>
                       <span className="font-mono text-charcoal font-medium">
                         {result.complaint?.id}
                       </span>
                     </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-stone">
                        {isKannada ? 'ಸ್ಥಿತಿ' : 'Status'}
                      </span>
                      <span className="font-medium text-char capitalize">
                        {result.problem?.status}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-sm pt-2 border-t border-amber-100">
                      <span className="text-stone flex items-center gap-1">
                        <ThumbsUp className="w-4 h-4" />
                        {isKannada ? 'ನಾಗರಿಕರ ಸಂಖ್ಯೆ' : 'Citizens Affected'}
                      </span>
                      <span className="font-bold text-amber-600 text-lg">
                        {result.problem?.upvoteCount || 0}
                      </span>
                    </div>
                  </div>

                  <div className="flex gap-3 justify-center">
                    <button
                      onClick={reset}
                      className="px-5 py-2 bg-charcoal text-white text-sm rounded-full hover:bg-charcoal/90 transition-colors"
                    >
                      {isKannada ? 'ಹೊಸ ದೂರು ನೀಡಿ' : 'Report Another'}
                    </button>
                  </div>
                </div>
              ) : (
                /* New problem created */
                <div className="bg-white rounded-2xl border border-border p-8 text-center">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle className="w-8 h-8 text-green-600" />
                  </div>
                  <h2 className="font-serif text-2xl text-charcoal mb-2">
                    {isKannada ? 'ದೂರು ಸಲ್ಲಿಸಲಾಗಿದೆ!' : 'Complaint submitted!'}
                  </h2>
                  <p className="text-stone text-sm mb-6">
                    {isKannada
                      ? 'ನೀವು ಈ ಸಮಸ್ಯೆಯನ್ನು ವರದಿ ಮಾಡುವ ಮೊದಲ ವ್ಯಕ್ತಿ!'
                      : "You're the first to report this issue!"}
                  </p>

                  <div className="bg-cream rounded-xl p-4 text-left space-y-3 mb-6">
                    <div className="flex justify-between text-sm">
                      <span className="text-stone">
                        {isKannada ? 'ದೂರು ID' : 'Complaint ID'}
                      </span>
                      <span className="font-mono text-charcoal font-medium">
                        {result.complaint?.id?.slice(0, 8).toUpperCase()}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-stone">
                        {isKannada ? 'ಸಮಸ್ಯೆ ID' : 'Problem ID'}
                      </span>
                      <span className="font-mono text-charcoal font-medium">
                        {result.problem?.id?.slice(0, 8).toUpperCase()}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-stone">
                        {isKannada ? 'ವರ್ಗ' : 'Category'}
                      </span>
                      <span className="font-medium text-charcoal capitalize">
                        {result.complaint?.category}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-stone">
                        {isKannada ? 'ವಾರ್ಡ್' : 'Ward'}
                      </span>
                      <span className="font-medium text-charcoal">
                        {isKannada ? WARD_KANNADA[result.complaint?.ward] || result.complaint?.ward : result.complaint?.ward}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-stone">
                        {isKannada ? 'ತೀವ್ರತೆ' : 'Severity'}
                      </span>
                      <span className={`font-medium ${getSeverityColor(result.complaint?.severity)}`}>
                        {result.complaint?.severity}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-stone">
                        {isKannada ? 'ಸ್ಥಿತಿ' : 'Status'}
                      </span>
                      <span className="font-medium text-amber-600 capitalize">
                        {result.complaint?.status}
                      </span>
                    </div>
                  </div>

                  <div className="flex gap-3 justify-center">
                    <button
                      onClick={reset}
                      className="px-5 py-2 bg-charcoal text-white text-sm rounded-full hover:bg-charcoal/90 transition-colors"
                    >
                      {isKannada ? 'ಹೊಸ ದೂರು ನೀಡಿ' : 'Report Another'}
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

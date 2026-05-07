import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { AlertTriangle, CalendarDays, Clock3, Loader2, Truck } from "lucide-react";
import { useApp } from "@/context/AppContext";
import {
  getGarbageMissedCount,
  getGarbageSchedules,
  reportGarbageMissed,
  type GarbageSchedule,
} from "@/lib/api";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const DAY_ORDER = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
] as const;

const DAY_SHORT: Record<string, string> = {
  Sunday: "Sun",
  Monday: "Mon",
  Tuesday: "Tue",
  Wednesday: "Wed",
  Thursday: "Thu",
  Friday: "Fri",
  Saturday: "Sat",
};

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

function normalizeDay(day: string) {
  return day.trim();
}

function getTodayName() {
  return DAY_ORDER[new Date().getDay()];
}

function getNextCollectionDay(days: string[]) {
  const todayIndex = new Date().getDay();
  const scheduledIndexes = days
    .map((day) => DAY_ORDER.indexOf(normalizeDay(day) as (typeof DAY_ORDER)[number]))
    .filter((value) => value >= 0);

  for (let offset = 1; offset <= 7; offset += 1) {
    const nextIndex = (todayIndex + offset) % 7;
    if (scheduledIndexes.includes(nextIndex)) {
      return DAY_ORDER[nextIndex];
    }
  }

  return null;
}

export default function GarbageTracker() {
  const { lang } = useApp();
  const isKannada = lang === "kn";
  const [schedules, setSchedules] = useState<GarbageSchedule[]>([]);
  const [selectedWard, setSelectedWard] = useState("");
  const [missedCount, setMissedCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [countLoading, setCountLoading] = useState(false);
  const [error, setError] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [aadhaarNumber, setAadhaarNumber] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [autoComplaintRaised, setAutoComplaintRaised] = useState(false);

  useEffect(() => {
    let active = true;

    async function loadSchedules() {
      try {
        const res = await getGarbageSchedules();
        if (!active) return;
        setSchedules(res.data);
        setSelectedWard((current) => current || res.data[0]?.ward || "");
      } catch (err: unknown) {
        if (!active) return;
        setError(getErrorMessage(err, "Failed to load garbage schedules"));
      } finally {
        if (active) setLoading(false);
      }
    }

    loadSchedules();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!selectedWard) return;

    let active = true;

    async function loadCount() {
      setCountLoading(true);
      try {
        const res = await getGarbageMissedCount(selectedWard);
        if (!active) return;
        setMissedCount(res.count);
        setAutoComplaintRaised(res.count >= 5);
        setHasSubmitted(false);
      } catch (err: unknown) {
        if (!active) return;
        setError(getErrorMessage(err, "Failed to load missed report count"));
      } finally {
        if (active) setCountLoading(false);
      }
    }

    loadCount();
    return () => {
      active = false;
    };
  }, [selectedWard]);

  const schedule = useMemo(
    () => schedules.find((item) => item.ward === selectedWard) ?? null,
    [schedules, selectedWard],
  );

  const todayName = getTodayName();
  const isCollectionDay = !!schedule?.collection_days.some(
    (day) => normalizeDay(day) === todayName,
  );
  const nextCollectionDay = schedule ? getNextCollectionDay(schedule.collection_days) : null;
  const isAadhaarValid = /^\d{12}$/.test(aadhaarNumber);

  const countLabel = useMemo(() => {
    if (hasSubmitted) {
      const others = Math.max(missedCount - 1, 0);
      return others === 0
        ? (isKannada ? "ನೀವು ಇಂದು ಮೊದಲ ವರದಿ ನೀಡಿದ್ದೀರಿ" : "You are the first to report this today")
        : (isKannada
            ? `ಇನ್ನೂ ${others} ಜನರು ಇದನ್ನು ಇಂದು ವರದಿ ಮಾಡಿದ್ದಾರೆ`
            : `${others} others also reported this today`);
    }

    if (missedCount === 0) {
      return isKannada ? "ಇಂದು ಯಾವುದೇ ಮಿಸ್ ವರದಿ ಇಲ್ಲ" : "No missed reports logged today";
    }

    return isKannada
      ? `ಇಂದು ${missedCount} ಮಿಸ್ ವರದಿಗಳು ದಾಖಲಾಗಿವೆ`
      : `${missedCount} citizens reported this today`;
  }, [hasSubmitted, isKannada, missedCount]);

  async function submitMissedReport() {
    if (!schedule) return;
    if (!isAadhaarValid) {
      setError(
        isKannada
          ? "12 ಅಂಕೆಗಳ ಆಧಾರ್ ಸಂಖ್ಯೆ ಅಗತ್ಯ"
          : "Enter a valid 12-digit Aadhaar number",
      );
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      const res = await reportGarbageMissed({
        ward: schedule.ward,
        aadhaar_last4: aadhaarNumber.slice(-4),
      });
      setMissedCount(res.count);
      setAutoComplaintRaised(res.auto_complaint_raised || res.count >= 5);
      setHasSubmitted(true);
      setDialogOpen(false);
      setAadhaarNumber("");
    } catch (err: unknown) {
      setError(getErrorMessage(err, "Failed to submit missed report"));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-cream pt-[72px]">
      <div className="mx-auto max-w-5xl px-4 py-10">
        <div className="mb-8">
          <h1 className="mb-1 font-serif text-3xl text-charcoal">
            {isKannada ? "ಕಸ ಸಂಗ್ರಹಣೆ ಟ್ರ್ಯಾಕರ್" : "Garbage Collection Tracker"}
          </h1>
          <p className="text-sm text-stone">
            {isKannada
              ? "ನಿಮ್ಮ ವಾರ್ಡ್‌ಗೆ ಕಸ ವಾಹನ ಯಾವಾಗ ಬರುತ್ತದೆ ಮತ್ತು ಮಿಸ್ ಆದರೆ ತಕ್ಷಣ ವರದಿ ಮಾಡಿ"
              : "Check your ward schedule and flag a missed garbage collection run."}
          </p>
        </div>

        {loading && (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-charcoal" />
          </div>
        )}

        {!loading && schedule && (
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div className="rounded-3xl border border-border bg-white p-6 shadow-sm">
              <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
                <div>
                  <p className="mb-1 text-xs font-semibold uppercase tracking-[0.2em] text-stone">
                    {isKannada ? "ವಾರ್ಡ್ ಆಯ್ಕೆ" : "Ward"}
                  </p>
                  <h2 className="text-2xl font-semibold text-charcoal">{schedule.ward}</h2>
                </div>
                <Select value={selectedWard} onValueChange={setSelectedWard}>
                  <SelectTrigger className="w-full rounded-xl border-border bg-cream md:w-[280px]">
                    <SelectValue placeholder={isKannada ? "ವಾರ್ಡ್ ಆಯ್ಕೆಮಾಡಿ" : "Select ward"} />
                  </SelectTrigger>
                  <SelectContent>
                    {schedules.map((item) => (
                      <SelectItem key={item.ward} value={item.ward}>
                        {item.ward}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-6 lg:grid-cols-[1.3fr_0.9fr]">
                <div className="rounded-2xl border border-border bg-cream/70 p-5">
                  <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-charcoal">
                    <CalendarDays className="h-4 w-4 text-red-600" />
                    {isKannada ? "ವಾರದ ಸಂಗ್ರಹ ದಿನಗಳು" : "Weekly Collection Days"}
                  </div>
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 xl:grid-cols-7">
                    {DAY_ORDER.map((day) => {
                      const isScheduled = schedule.collection_days.some(
                        (item) => normalizeDay(item) === day,
                      );
                      const isToday = day === todayName;
                      return (
                        <div
                          key={day}
                          className={`rounded-2xl border px-3 py-4 text-center transition-colors ${
                            isScheduled
                              ? isToday
                                ? "border-red-600 bg-red-600 text-white"
                                : "border-red-200 bg-red-50 text-red-700"
                              : isToday
                                ? "border-charcoal bg-charcoal text-white"
                                : "border-border bg-white text-stone"
                          }`}
                        >
                          <div className="text-sm font-semibold">{DAY_SHORT[day]}</div>
                          <div className="mt-1 text-[11px] uppercase tracking-wide opacity-80">
                            {isToday ? (isKannada ? "ಇಂದು" : "Today") : isScheduled ? "Run" : "Off"}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="rounded-2xl border border-border bg-charcoal p-5 text-white">
                  <div className="mb-4 flex items-center gap-2 text-sm font-semibold">
                    <Truck className="h-4 w-4 text-red-300" />
                    {isKannada ? "ಸಂಗ್ರಹ ವಿವರಗಳು" : "Collection Details"}
                  </div>
                  <div className="space-y-4">
                    <div>
                      <p className="text-xs uppercase tracking-wide text-white/60">
                        {isKannada ? "ಸಮಯ" : "Time Slot"}
                      </p>
                      <p className="mt-1 text-lg font-semibold">{schedule.time_slot}</p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-wide text-white/60">
                        {isKannada ? "ವಾಹನ ಸಂಖ್ಯೆ" : "Vehicle Number"}
                      </p>
                      <p className="mt-1 text-lg font-semibold">{schedule.vehicle_number}</p>
                    </div>
                    <div className="rounded-2xl bg-white/10 p-4">
                      <div className="mb-2 flex items-center gap-2 text-sm font-semibold">
                        <Clock3 className="h-4 w-4 text-red-300" />
                        {isKannada ? "ಇಂದಿನ ಸ್ಥಿತಿ" : "Today's Status"}
                      </div>
                      <p className="text-sm text-white/90">
                        {isCollectionDay
                          ? (isKannada ? "ಇಂದು ಕಸ ಸಂಗ್ರಹಣೆ ನಿರೀಕ್ಷಿಸಲಾಗಿದೆ" : "Collection expected today")
                          : nextCollectionDay
                            ? (isKannada
                                ? `ಮುಂದಿನ ಸಂಗ್ರಹಣೆ: ${nextCollectionDay}`
                                : `Next collection: ${nextCollectionDay}`)
                            : (isKannada ? "ವೇಳಾಪಟ್ಟಿ ಲಭ್ಯವಿಲ್ಲ" : "Schedule unavailable")}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-border bg-white p-6 shadow-sm">
              <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                <div className="max-w-2xl">
                  <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-stone">
                    {isKannada ? "ಇಂದಿನ ಪ್ರತಿಕ್ರಿಯೆ" : "Today's Response"}
                  </p>
                  <h3 className="text-2xl font-semibold text-charcoal">
                    {isCollectionDay
                      ? (isKannada ? "ವಾಹನ ಬಂದಿಲ್ಲವೇ?" : "Did the truck miss your area today?")
                      : (isKannada ? "ಇಂದು ಸಂಗ್ರಹಣೆಯ ದಿನವಲ್ಲ" : "No collection is scheduled today")}
                  </h3>
                  <p className="mt-2 text-sm text-stone">
                    {isCollectionDay
                      ? countLabel
                      : nextCollectionDay
                        ? (isKannada
                            ? `ಮುಂದಿನ ಸಂಗ್ರಹಣೆ ${nextCollectionDay} ರಂದು`
                            : `Next collection: ${nextCollectionDay}`)
                        : (isKannada ? "ದಯವಿಟ್ಟು ನಂತರ ಮರುಪ್ರಯತ್ನಿಸಿ" : "Please check back later")}
                  </p>
                </div>

                {isCollectionDay ? (
                  <button
                    type="button"
                    onClick={() => {
                      setError("");
                      setDialogOpen(true);
                    }}
                    className="inline-flex min-h-16 items-center justify-center rounded-2xl bg-red-600 px-8 py-4 text-lg font-semibold text-white transition-colors hover:bg-red-700"
                  >
                    {isKannada ? "ಇಂದು ವಾಹನ ಬಂದಿಲ್ಲ" : "Truck Missed Today"}
                  </button>
                ) : (
                  <div className="rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm font-medium text-amber-900">
                    {isKannada
                      ? `ಮುಂದಿನ ಸಂಗ್ರಹಣೆ: ${nextCollectionDay ?? "-"}`
                      : `Next collection: ${nextCollectionDay ?? "-"}`}
                  </div>
                )}
              </div>

              {countLoading && (
                <div className="mt-4 text-sm text-stone">
                  {isKannada ? "ಇಂದಿನ ವರದಿಗಳನ್ನು ಲೋಡ್ ಮಾಡಲಾಗುತ್ತಿದೆ..." : "Loading today's reports..."}
                </div>
              )}

              {!countLoading && autoComplaintRaised && (
                <div className="mt-5 flex items-start gap-3 rounded-2xl border border-amber-300 bg-amber-50 px-4 py-3 text-amber-900">
                  <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
                  <p className="text-sm font-medium">
                    ⚠️ {isKannada ? "CMC ಗೆ ಸ್ವಯಂ ದೂರು ಕಳುಹಿಸಲಾಗಿದೆ" : "Auto-complaint raised with CMC"}
                  </p>
                </div>
              )}

              {error && (
                <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {error}
                </div>
              )}
            </div>
          </motion.div>
        )}

        {!loading && !schedule && (
          <div className="rounded-3xl border border-border bg-white p-8 text-center text-stone">
            {isKannada ? "ಯಾವುದೇ ಕಸ ವೇಳಾಪಟ್ಟಿ ಲಭ್ಯವಿಲ್ಲ" : "No garbage schedule data available."}
          </div>
        )}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="rounded-3xl border-border bg-white sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {isKannada ? "ವರದಿಯನ್ನು ದೃಢೀಕರಿಸಿ" : "Confirm missed collection"}
            </DialogTitle>
            <DialogDescription>
              {isKannada
                ? "ಸ್ಪ್ಯಾಮ್ ತಡೆಯಲು 12 ಅಂಕೆಗಳ ಆಧಾರ್ ಸಂಖ್ಯೆ ನೀಡಿ. ಸಿಸ್ಟಂ ಕೊನೆಯ 4 ಅಂಕೆಗಳನ್ನೇ ಬಳಕೆ ಮಾಡುತ್ತದೆ."
                : "Enter your 12-digit Aadhaar number. Only the last 4 digits are sent for deduplication."}
            </DialogDescription>
          </DialogHeader>

          <div>
            <label className="mb-2 block text-sm font-medium text-charcoal" htmlFor="aadhaar-number">
              {isKannada ? "ಆಧಾರ್ ಸಂಖ್ಯೆ" : "Aadhaar Number"}
            </label>
            <input
              id="aadhaar-number"
              inputMode="numeric"
              maxLength={12}
              value={aadhaarNumber}
              onChange={(event) => {
                const digitsOnly = event.target.value.replace(/\D/g, "").slice(0, 12);
                setAadhaarNumber(digitsOnly);
                if (error) setError("");
              }}
              className="w-full rounded-xl border border-border bg-cream px-4 py-3 text-base text-charcoal outline-none transition-colors focus:border-red-500"
              placeholder="123456789012"
            />
            <p className="mt-2 text-xs text-stone">
              {isKannada
                ? "ಖಚಿತವಾಗಿ 12 ಅಂಕೆಗಳು ಇರಬೇಕು"
                : "Must be exactly 12 digits"}
            </p>
          </div>

          <DialogFooter>
            <button
              type="button"
              onClick={() => setDialogOpen(false)}
              className="rounded-xl border border-border px-4 py-2 text-sm font-medium text-stone transition-colors hover:bg-cream"
            >
              {isKannada ? "ರದ್ದುಮಾಡಿ" : "Cancel"}
            </button>
            <button
              type="button"
              onClick={submitMissedReport}
              disabled={submitting || !isAadhaarValid}
              className="inline-flex items-center justify-center rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isKannada ? "ವರದಿ ಕಳುಹಿಸಿ" : "Submit Report"}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

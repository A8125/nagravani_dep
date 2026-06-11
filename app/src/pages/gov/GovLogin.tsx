import { useEffect, useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Landmark } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { GOV_DEPARTMENTS, getGovSession, loginDepartment } from "@/lib/govAuth";

export default function GovLogin() {
  const navigate = useNavigate();
  const [department, setDepartment] = useState(GOV_DEPARTMENTS[0]);
  const [employeeKey, setEmployeeKey] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (getGovSession()) {
      navigate("/gov/dashboard", { replace: true });
    }
  }, [navigate]);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const ok = loginDepartment(department, employeeKey.trim());
    if (!ok) {
      setError("Invalid credentials");
      return;
    }

    navigate("/gov/dashboard", { replace: true });
  };

  return (
    <div className="min-h-screen bg-cream px-4 py-12 text-charcoal dark:bg-[#0f0f0f] dark:text-white">
      <div className="mx-auto flex min-h-[calc(100vh-6rem)] max-w-5xl items-center justify-center">
        <div className="grid w-full overflow-hidden rounded-[2rem] border border-stone-200 bg-white shadow-sm dark:border-white/10 dark:bg-[#1a1a1a] lg:grid-cols-[1.1fr_0.9fr]">
          <div className="hidden bg-[linear-gradient(160deg,rgba(22,34,52,0.96),rgba(45,66,92,0.9))] p-10 text-white lg:flex lg:flex-col lg:justify-between">
            <div>
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-white/85">
                <Landmark className="h-3.5 w-3.5" />
                NagaraVaani
              </div>
              <h1 className="max-w-sm text-4xl leading-tight text-white">
                Government Portal
              </h1>
              <p className="mt-4 max-w-md text-sm leading-7 text-white/72">
                Review routed complaints, update field status, and publish official responses for citizens.
              </p>
            </div>

            <div className="rounded-3xl border border-white/10 bg-white/10 p-5 backdrop-blur-sm">
              <p className="text-xs uppercase tracking-[0.2em] text-white/55">Official Access</p>
              <p className="mt-2 text-sm leading-6 text-white/75">
                Department credentials are temporary for internal rollout. Replace with real auth before production use.
              </p>
            </div>
          </div>

          <div className="p-6 sm:p-8 lg:p-10">
            <div className="mb-8 flex items-center justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-stone-500 dark:text-gray-400">
                  NagaraVaani
                </p>
                <h2 className="mt-2 text-2xl text-slate-800 dark:text-white">
                  Government Portal
                </h2>
              </div>
              <Link
                to="/"
                className="inline-flex items-center gap-2 text-sm font-medium text-stone-500 transition-colors hover:text-charcoal dark:text-gray-400 dark:hover:text-white"
              >
                <ArrowLeft className="h-4 w-4" />
                Citizen site
              </Link>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold uppercase tracking-[0.18em] text-stone-500 dark:text-gray-400">
                  Department
                </label>
                <select
                  value={department}
                  onChange={(event) => setDepartment(event.target.value)}
                  className="h-11 w-full rounded-xl border border-stone-200 bg-cream px-3 text-sm text-charcoal outline-none transition focus:border-stone-400 dark:border-white/10 dark:bg-[#111827] dark:text-white"
                >
                  {GOV_DEPARTMENTS.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold uppercase tracking-[0.18em] text-stone-500 dark:text-gray-400">
                  Employee Key
                </label>
                <Input
                  type="password"
                  value={employeeKey}
                  onChange={(event) => {
                    setEmployeeKey(event.target.value);
                    if (error) setError("");
                  }}
                  placeholder="Enter department access key"
                  className="h-11 rounded-xl border-stone-200 bg-cream dark:border-white/10 dark:bg-[#111827]"
                />
              </div>

              {error && (
                <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-200">
                  {error}
                </div>
              )}

              <Button
                type="submit"
                className="h-11 w-full rounded-xl bg-charcoal text-white hover:bg-charcoal/90 dark:bg-white dark:text-[#0f0f0f] dark:hover:bg-white/90"
              >
                Access Portal
              </Button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

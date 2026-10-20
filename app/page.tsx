import Link from "next/link";
import { ArrowRight, Terminal, ShieldAlert, Clock, Cpu } from "lucide-react";
import { publicIncident } from "@/data/incidents/duplicate-payment";

export default function LibraryPage() {
  return (
    <div className="min-h-screen bg-[#0B0D10] text-[#E8EAED] flex flex-col justify-between">
      {/* Top Console Navigation Bar */}
      <header className="border-b border-[#262B33] bg-[#12151A]/80 backdrop-blur-sm sticky top-0 z-20">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-[6px] bg-[#181C22] border border-[#262B33] flex items-center justify-center text-[#F5A524]">
              <Terminal className="w-4 h-4" />
            </div>
            <span className="font-semibold text-lg tracking-tight text-[#E8EAED]">
              Trace
            </span>
            <span className="text-xs px-2 py-0.5 rounded border border-[#262B33] bg-[#181C22] text-[#9AA3AE] font-mono">
              v1.0.0
            </span>
          </div>

          <div className="text-xs text-[#9AA3AE] font-mono flex items-center space-x-2">
            <span className="inline-block w-2 h-2 rounded-full bg-[#3FB950]" aria-hidden="true"></span>
            <span>SYSTEM READY</span>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-6 py-12 md:py-20 flex flex-col justify-center">
        <div className="max-w-2xl">
          <div className="inline-flex items-center space-x-2 px-2.5 py-1 rounded-[6px] bg-[#181C22] border border-[#262B33] text-xs font-mono text-[#F5A524] mb-6">
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>Incident Practice Platform</span>
          </div>

          <h1 className="text-3xl md:text-4xl font-semibold tracking-tight text-[#E8EAED] mb-4">
            Practise real engineering incidents. Find the fault, stop the damage, defend your fix.
          </h1>

          <p className="text-base text-[#9AA3AE] leading-relaxed mb-10">
            Real software failures aren&apos;t leetcode algorithms. Trace challenges you to triage live alerts, inspect production diffs, prevent damage under pressure, and defend your engineering decisions.
          </p>
        </div>

        {/* Incidents Section */}
        <section aria-labelledby="available-incidents-heading" className="w-full">
          <div className="flex items-center justify-between mb-4">
            <h2 id="available-incidents-heading" className="text-xs font-mono uppercase tracking-wider text-[#9AA3AE]">
              Active Incident Challenge
            </h2>
            <span className="text-xs font-mono text-[#9AA3AE]">
              1 available
            </span>
          </div>

          {/* Incident Card */}
          <div className="bg-[#12151A] border border-[#262B33] rounded-[12px] p-6 md:p-8 hover:border-[#F5A524]/40 transition-calm relative group">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="space-y-3 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center space-x-1.5 px-2 py-0.5 rounded-[6px] bg-[#181C22] border border-[#262B33] text-xs font-mono text-[#E8EAED]">
                    <Cpu className="w-3 h-3 text-[#9AA3AE]" />
                    <span>{publicIncident.role}</span>
                  </span>
                  <span className="inline-flex items-center px-2 py-0.5 rounded-[6px] bg-[#181C22] border border-[#262B33] text-xs font-mono text-[#E8EAED]">
                    <span>{publicIncident.type}</span>
                  </span>
                  <span className="inline-flex items-center space-x-1.5 px-2 py-0.5 rounded-[6px] bg-[#181C22] border border-[#262B33] text-xs font-mono text-[#9AA3AE]">
                    <Clock className="w-3 h-3" />
                    <span>~{publicIncident.estimatedMinutes} min</span>
                  </span>
                </div>

                <h3 className="text-xl font-semibold text-[#E8EAED] group-hover:text-[#F5A524] transition-calm">
                  {publicIncident.title}
                </h3>

                <p className="text-sm text-[#9AA3AE] leading-relaxed max-w-xl">
                  {publicIncident.summary}
                </p>
              </div>

              <div className="flex items-center">
                <Link
                  href={`/challenge/${publicIncident.id}`}
                  className="w-full md:w-auto inline-flex items-center justify-center space-x-2 bg-[#F5A524] hover:bg-[#e09419] text-[#0B0D10] font-semibold text-sm px-5 py-2.5 rounded-[8px] transition-calm focus-visible:outline-2 focus-visible:outline-[#F5A524]"
                >
                  <span>Start incident</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </div>

          {/* Understated Notice — No Fake Cards */}
          <div className="mt-8 pt-6 border-t border-[#262B33]/60 flex items-center justify-between text-xs text-[#9AA3AE]">
            <p className="font-mono">
              More incidents are in progress.
            </p>
            <span className="font-mono text-[#9AA3AE]/80">
              Deterministic verification · Constrained evaluation
            </span>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-[#262B33] bg-[#12151A]/40 py-6">
        <div className="max-w-5xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#9AA3AE]">
          <div className="flex items-center space-x-2">
            <span className="font-semibold text-[#E8EAED]">Trace</span>
            <span>—</span>
            <span>Real engineering problems. Better engineering judgment.</span>
          </div>
          <div className="font-mono text-[11px] text-[#9AA3AE]">
            Talent Nation AI Rebuild Challenge
          </div>
        </div>
      </footer>
    </div>
  );
}

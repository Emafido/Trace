import Link from 'next/link';
import { ArrowRight, Terminal, Clock, Cpu, ShieldAlert } from 'lucide-react';
import { getAllPublicIncidents } from '@/data/incidents';

export default function LibraryPage() {
  const incidents = getAllPublicIncidents();

  return (
    <div className="min-h-screen bg-[#0B0D10] text-[#E8EAED] flex flex-col justify-between">
      {/* Header */}
      <header className="border-b border-[#262B33] bg-[#12151A]/80 backdrop-blur-sm sticky top-0 z-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 h-14 sm:h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-[6px] bg-[#181C22] border border-[#262B33] flex items-center justify-center text-[#F5A524]">
              <Terminal className="w-4 h-4" />
            </div>
            <span className="font-semibold text-base sm:text-lg tracking-tight text-[#E8EAED]">
              Trace
            </span>
          </div>
        </div>
      </header>

      {/* Main Hero & Challenges */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 py-10 sm:py-16 flex flex-col justify-center">
        <div className="max-w-2xl mb-10 sm:mb-12">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-semibold tracking-tight text-[#E8EAED] mb-3 sm:mb-4">
            Real engineering problems. Better engineering judgment.
          </h1>
          <p className="text-sm sm:text-base text-[#9AA3AE] leading-relaxed">
            Practise debugging, investigating failures, and making engineering decisions through realistic, interactive challenges.
          </p>
        </div>

        {/* Challenges List */}
        <section aria-label="Available Practice Incidents" className="w-full space-y-4">
          {incidents.map((incident) => (
            <article
              key={incident.id}
              className="bg-[#12151A] border border-[#262B33] rounded-[12px] p-5 sm:p-6 md:p-7 hover:border-[#F5A524]/50 transition-calm relative group"
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
                <div className="space-y-2.5 flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
                    <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-[4px] bg-[#181C22] border border-[#262B33] text-[#E8EAED]">
                      <Cpu className="w-3 h-3 text-[#9AA3AE]" />
                      <span>{incident.role}</span>
                    </span>
                    <span className="inline-flex items-center px-2 py-0.5 rounded-[4px] bg-[#181C22] border border-[#262B33] text-[#9AA3AE]">
                      <span>{incident.type}</span>
                    </span>
                    <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-[4px] bg-[#181C22] border border-[#262B33] text-[#9AA3AE]">
                      <Clock className="w-3 h-3" />
                      <span>~{incident.estimatedMinutes} min</span>
                    </span>
                  </div>

                  <h2 className="text-lg sm:text-xl font-semibold text-[#E8EAED] group-hover:text-[#F5A524] transition-calm">
                    <Link href={`/challenge/${incident.id}`} className="focus:outline-none">
                      {incident.title}
                    </Link>
                  </h2>

                  <p className="text-xs sm:text-sm text-[#9AA3AE] leading-relaxed max-w-xl">
                    {incident.summary}
                  </p>
                </div>

                <div className="flex items-center shrink-0 pt-2 md:pt-0">
                  <Link
                    href={`/challenge/${incident.id}`}
                    className="w-full md:w-auto inline-flex items-center justify-center space-x-2 bg-[#F5A524] hover:bg-[#e09419] text-[#0B0D10] font-semibold text-xs sm:text-sm px-4 sm:px-5 py-2.5 rounded-[8px] transition-calm focus-visible:outline-2 focus-visible:outline-[#F5A524]"
                  >
                    <span>Start challenge</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            </article>
          ))}
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-[#262B33] bg-[#12151A]/40 py-5 sm:py-6">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[#9AA3AE]">
          <div className="flex items-center space-x-2">
            <span className="font-semibold text-[#E8EAED]">Trace</span>
            <span>—</span>
            <span>Realistic engineering practice</span>
          </div>
          <div className="font-mono text-[11px] text-[#9AA3AE]/80">
            Deterministic code checks · Evidence-backed evaluation
          </div>
        </div>
      </footer>
    </div>
  );
}

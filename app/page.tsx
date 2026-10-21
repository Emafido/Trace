import React from 'react';
import Link from 'next/link';
import {
  Terminal,
  ArrowRight,
  Search,
  ShieldCheck,
  Sparkles,
  ArrowDown,
  Activity,
} from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#0B0D10] text-[#E8EAED] flex flex-col justify-between selection:bg-[#F5A524]/20 selection:text-[#F5A524]">
      {/* Navigation */}
      <header className="border-b border-[#262B33] bg-[#12151A]/80 backdrop-blur-sm sticky top-0 z-20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 sm:h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center space-x-2.5 group">
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-[6px] bg-[#181C22] border border-[#262B33] flex items-center justify-center text-[#F5A524]">
              <Terminal className="w-4 h-4" />
            </div>
            <span className="font-semibold text-base sm:text-lg tracking-tight text-[#E8EAED] group-hover:text-[#F5A524] transition-calm">
              Trace
            </span>
          </Link>

          <nav aria-label="Main Navigation" className="flex items-center space-x-2 sm:space-x-4">
            <Link
              href="/#how-it-works"
              className="text-xs sm:text-sm text-[#9AA3AE] hover:text-[#E8EAED] transition-calm px-2.5 py-1.5 rounded-[6px] hover:bg-[#181C22]"
            >
              How it works
            </Link>

            <Link
              href="/practice"
              className="text-xs sm:text-sm text-[#9AA3AE] hover:text-[#E8EAED] transition-calm px-2.5 py-1.5 rounded-[6px] hover:bg-[#181C22]"
            >
              Practice
            </Link>

            <Link
              href="/practice"
              className="inline-flex items-center justify-center space-x-1.5 bg-[#F5A524] hover:bg-[#e09419] text-[#0B0D10] font-semibold text-xs sm:text-sm px-3.5 sm:px-4 py-1.5 sm:py-2 rounded-[6px] sm:rounded-[8px] transition-calm focus-visible:outline-2 focus-visible:outline-[#F5A524]"
            >
              <span>Start practising</span>
              <ArrowRight className="w-3.5 h-3.5 hidden xs:inline" />
            </Link>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 w-full flex flex-col items-center">
        {/* Hero Section */}
        <section className="w-full max-w-5xl px-4 sm:px-6 pt-12 sm:pt-20 pb-12 sm:pb-16 flex flex-col items-center text-center">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-[6px] bg-[#181C22] border border-[#262B33] text-xs font-mono text-[#F5A524] mb-6">
            <span>Interactive Engineering Practice</span>
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-semibold tracking-tight text-[#E8EAED] max-w-3xl leading-[1.15] mb-5 sm:mb-6">
            Real engineering problems. Better engineering judgment.
          </h1>

          <p className="text-base sm:text-lg md:text-xl text-[#9AA3AE] leading-relaxed max-w-2xl mb-8 sm:mb-10">
            Practise investigating broken deployments, reading logs, finding faulty code, and defending your engineering decisions.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 w-full sm:w-auto mb-14 sm:mb-20">
            <Link
              href="/practice"
              className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 bg-[#F5A524] hover:bg-[#e09419] text-[#0B0D10] font-semibold text-sm sm:text-base px-6 py-3 rounded-[8px] transition-calm focus-visible:outline-2 focus-visible:outline-[#F5A524]"
            >
              <span>Explore challenges</span>
              <ArrowRight className="w-4 h-4" />
            </Link>

            <Link
              href="/#how-it-works"
              className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 bg-[#12151A] hover:bg-[#181C22] text-[#E8EAED] border border-[#262B33] hover:border-[#3A424E] text-sm sm:text-base px-5 py-3 rounded-[8px] transition-calm"
            >
              <span>How Trace works</span>
              <ArrowDown className="w-4 h-4 text-[#9AA3AE]" />
            </Link>
          </div>

          {/* Hero Visual: Restrained, code-based preview of real Profile API incident */}
          <div className="w-full max-w-3xl text-left bg-[#12151A] border border-[#262B33] rounded-[12px] shadow-2xl overflow-hidden">
            {/* Window Top Bar */}
            <div className="px-4 py-3 bg-[#181C22] border-b border-[#262B33] flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#262B33]" />
                <span className="w-2.5 h-2.5 rounded-full bg-[#262B33]" />
                <span className="w-2.5 h-2.5 rounded-full bg-[#262B33]" />
                <span className="ml-2 font-mono text-xs text-[#9AA3AE]">
                  src/routes/profile.ts
                </span>
              </div>

              <div className="font-mono text-xs text-[#F5A524] flex items-center space-x-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#F5A524]" />
                <span>The Profile Page That Stopped Working</span>
              </div>
            </div>

            {/* Code Diff Preview */}
            <div className="p-4 sm:p-5 font-mono text-xs sm:text-sm bg-[#0B0D10]/80 overflow-x-auto border-b border-[#262B33]">
              <div className="text-[#9AA3AE]/60 mb-2">
                {'// PR #248: Refactor profile routes to RESTful conventions'}
              </div>
              <div className="text-[#9AA3AE]/60 mb-1">
                {'@@ -6,4 +6,4 @@ router setup'}
              </div>
              <div className="bg-[#F85149]/10 text-[#F85149] px-2 py-0.5 rounded -mx-2 flex items-center">
                <span className="select-none w-5 text-[#F85149]/70 shrink-0">-</span>
                <span className="truncate">router.get(&quot;/api/profile&quot;, authenticate, getProfile);</span>
              </div>
              <div className="bg-[#3FB950]/10 text-[#3FB950] px-2 py-0.5 rounded -mx-2 flex items-center">
                <span className="select-none w-5 text-[#3FB950]/70 shrink-0">+</span>
                <span className="truncate">router.get(&quot;/api/users/me&quot;, authenticate, getProfile);</span>
              </div>
            </div>

            {/* Runtime Telemetry Evidence Preview */}
            <div className="p-4 sm:p-5 bg-[#12151A] font-mono text-xs sm:text-sm space-y-2">
              <div className="text-xs font-semibold uppercase tracking-wider text-[#9AA3AE] flex items-center space-x-1.5 mb-2">
                <Activity className="w-3.5 h-3.5 text-[#F5A524]" />
                <span>Runtime API Telemetry</span>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between py-1 border-b border-[#262B33]/60 gap-1">
                <div className="flex items-center space-x-2">
                  <span className="text-[#F85149] font-semibold">GET /api/profile</span>
                  <span className="text-[#9AA3AE]">→</span>
                  <span className="px-1.5 py-0.2 rounded bg-[#F85149]/20 text-[#F85149] font-semibold text-[11px]">
                    404 Not Found
                  </span>
                </div>
                <span className="text-[#9AA3AE] text-[11px]">iOS App v2.4 (Unmodified Client)</span>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between py-1 gap-1">
                <div className="flex items-center space-x-2">
                  <span className="text-[#3FB950] font-semibold">GET /api/users/me</span>
                  <span className="text-[#9AA3AE]">→</span>
                  <span className="px-1.5 py-0.2 rounded bg-[#3FB950]/20 text-[#3FB950] font-semibold text-[11px]">
                    200 OK
                  </span>
                </div>
                <span className="text-[#9AA3AE] text-[11px]">Web App v3.1 (Updated Client)</span>
              </div>

              <div className="mt-3 pt-2 text-[11px] sm:text-xs text-[#9AA3AE] border-t border-[#262B33] flex items-center justify-between">
                <span>Deployment broke backward compatibility for existing distributed clients.</span>
                <span className="text-[#F5A524] font-semibold hidden sm:inline">5-step interactive triage</span>
              </div>
            </div>
          </div>
        </section>

        {/* How Trace Works Section */}
        <section
          id="how-it-works"
          aria-label="How Trace Works"
          className="w-full max-w-5xl px-4 sm:px-6 py-16 sm:py-24 border-t border-[#262B33]"
        >
          <div className="text-center max-w-2xl mx-auto mb-12 sm:mb-16">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-semibold tracking-tight text-[#E8EAED] mb-3 sm:mb-4">
              How Trace works
            </h2>
            <p className="text-sm sm:text-base text-[#9AA3AE] leading-relaxed">
              Trace replaces synthetic interview puzzles with real production failure modes.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
            {/* Step 1: Investigate */}
            <div className="bg-[#12151A] border border-[#262B33] rounded-[12px] p-6 sm:p-7 flex flex-col justify-between hover:border-[#F5A524]/40 transition-calm">
              <div className="space-y-4">
                <div className="w-10 h-10 rounded-[8px] bg-[#181C22] border border-[#262B33] flex items-center justify-center text-[#F5A524]">
                  <Search className="w-5 h-5" />
                </div>
                <div className="space-y-1.5">
                  <div className="text-xs font-mono text-[#F5A524] font-medium">STEP 1 & 2</div>
                  <h3 className="text-lg sm:text-xl font-semibold text-[#E8EAED]">
                    Investigate
                  </h3>
                  <p className="text-xs sm:text-sm font-medium text-[#E8EAED]/90">
                    Examine code changes, logs, and system context.
                  </p>
                </div>
                <p className="text-xs sm:text-sm text-[#9AA3AE] leading-relaxed">
                  Inspect realistic code diffs, server logs, and user reports without artificial clues. Click directly on diff lines to test your hypothesis against deterministic checks against curated incident answer keys.
                </p>
              </div>
            </div>

            {/* Step 2: Decide and defend */}
            <div className="bg-[#12151A] border border-[#262B33] rounded-[12px] p-6 sm:p-7 flex flex-col justify-between hover:border-[#F5A524]/40 transition-calm">
              <div className="space-y-4">
                <div className="w-10 h-10 rounded-[8px] bg-[#181C22] border border-[#262B33] flex items-center justify-center text-[#F5A524]">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div className="space-y-1.5">
                  <div className="text-xs font-mono text-[#F5A524] font-medium">STEP 3, 4 & 5</div>
                  <h3 className="text-lg sm:text-xl font-semibold text-[#E8EAED]">
                    Decide and defend
                  </h3>
                  <p className="text-xs sm:text-sm font-medium text-[#E8EAED]/90">
                    Choose how to contain a failure, identify a fault, and explain a permanent fix.
                  </p>
                </div>
                <p className="text-xs sm:text-sm text-[#9AA3AE] leading-relaxed">
                  Lock in immediate mitigation, write your permanent fix, and answer tailored trade-off questions challenging concurrency, caching, or backward-compatibility.
                </p>
              </div>
            </div>

            {/* Step 3: Learn */}
            <div className="bg-[#12151A] border border-[#262B33] rounded-[12px] p-6 sm:p-7 flex flex-col justify-between hover:border-[#F5A524]/40 transition-calm">
              <div className="space-y-4">
                <div className="w-10 h-10 rounded-[8px] bg-[#181C22] border border-[#262B33] flex items-center justify-center text-[#F5A524]">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div className="space-y-1.5">
                  <div className="text-xs font-mono text-[#F5A524] font-medium">REVIEW</div>
                  <h3 className="text-lg sm:text-xl font-semibold text-[#E8EAED]">
                    Review — Learn
                  </h3>
                  <p className="text-xs sm:text-sm font-medium text-[#E8EAED]/90">
                    See what code verified, what AI interpreted, and how your reasoning compares with a curated reference.
                  </p>
                </div>
                <p className="text-xs sm:text-sm text-[#9AA3AE] leading-relaxed">
                  Visibly separate deterministic code truth from AI evaluation. Rubric criteria cite your exact words verbatim, backed by production-ready reference solutions.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Final CTA Section */}
        <section className="w-full max-w-5xl px-4 sm:px-6 py-16 sm:py-20 border-t border-[#262B33] text-center">
          <div className="max-w-2xl mx-auto space-y-6">
            <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight text-[#E8EAED]">
              Ready to investigate your first incident?
            </h2>
            <p className="text-sm sm:text-base text-[#9AA3AE] leading-relaxed">
              Start with a beginner-friendly API breakage or dive into a distributed concurrency race condition.
            </p>
            <div className="pt-2">
              <Link
                href="/practice"
                className="inline-flex items-center justify-center space-x-2 bg-[#F5A524] hover:bg-[#e09419] text-[#0B0D10] font-semibold text-sm sm:text-base px-6 py-3 rounded-[8px] transition-calm focus-visible:outline-2 focus-visible:outline-[#F5A524]"
              >
                <span>Browse practice challenges</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-[#262B33] bg-[#12151A]/40 py-6 sm:py-8">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#9AA3AE]">
          <div className="flex items-center space-x-2">
            <span className="font-semibold text-[#E8EAED]">Trace</span>
            <span>—</span>
            <span>Realistic engineering practice</span>
          </div>

          <div className="flex items-center space-x-4">
            <Link href="/practice" className="hover:text-[#E8EAED] transition-calm">
              Practice Challenges
            </Link>
            <Link href="/#how-it-works" className="hover:text-[#E8EAED] transition-calm">
              How it works
            </Link>
          </div>

          <div className="font-mono text-[11px] text-[#9AA3AE]/80">
            Deterministic code checks · Evidence-backed evaluation
          </div>
        </div>
      </footer>
    </div>
  );
}

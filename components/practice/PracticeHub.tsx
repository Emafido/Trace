'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Terminal,
  Cpu,
  Clock,
  ArrowRight,
  Sparkles,
  ArrowLeft,
  RotateCcw,
  CheckCircle2,
} from 'lucide-react';
import { PublicIncident } from '@/data/incidents';
import { getIncidentSessionInfo, IncidentSessionInfo } from '@/lib/storage';

interface PracticeHubProps {
  incidents: PublicIncident[];
}

type FilterCategory = 'All' | 'Full-stack' | 'Backend';

export function PracticeHub({ incidents }: PracticeHubProps) {
  const [activeFilter, setActiveFilter] = useState<FilterCategory>('All');
  const [sessions, setSessions] = useState<Record<string, IncidentSessionInfo | null>>({});
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    const loadedSessions: Record<string, IncidentSessionInfo | null> = {};
    incidents.forEach((incident) => {
      loadedSessions[incident.id] = getIncidentSessionInfo(incident.id);
    });
    setSessions(loadedSessions);
  }, [incidents]);

  const filteredIncidents = incidents.filter((incident) => {
    if (activeFilter === 'All') return true;
    return incident.role.toLowerCase() === activeFilter.toLowerCase();
  });

  // Check if there is any active in-progress incident to offer a top quick-resume callout
  const activeIncident = incidents.find(
    (inc) => sessions[inc.id]?.inProgress && !sessions[inc.id]?.isCompleted
  );

  return (
    <div className="min-h-screen bg-[#0B0D10] text-[#E8EAED] flex flex-col justify-between">
      {/* Top Navigation */}
      <header className="border-b border-[#262B33] bg-[#12151A]/80 backdrop-blur-sm sticky top-0 z-20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 sm:h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3 sm:space-x-4">
            <Link
              href="/"
              className="flex items-center space-x-2 text-xs font-mono text-[#9AA3AE] hover:text-[#E8EAED] transition-calm p-1.5 -ml-1.5 rounded-[6px] hover:bg-[#181C22]"
              aria-label="Back to home"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Overview</span>
            </Link>

            <div className="h-4 w-px bg-[#262B33]" />

            <Link href="/" className="flex items-center space-x-2.5 group">
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-[6px] bg-[#181C22] border border-[#262B33] flex items-center justify-center text-[#F5A524]">
                <Terminal className="w-4 h-4" />
              </div>
              <span className="font-semibold text-base sm:text-lg tracking-tight text-[#E8EAED] group-hover:text-[#F5A524] transition-calm">
                Trace
              </span>
            </Link>

            <nav aria-label="Breadcrumb" className="hidden md:flex items-center space-x-2 text-xs font-mono">
              <span className="text-[#9AA3AE]/40">/</span>
              <span className="text-[#E8EAED] font-medium">Practice Hub</span>
            </nav>
          </div>

          <div className="flex items-center space-x-3 text-xs sm:text-sm">
            <Link
              href="/#how-it-works"
              className="text-[#9AA3AE] hover:text-[#E8EAED] transition-calm px-2.5 py-1.5 rounded-[6px] hover:bg-[#181C22] font-medium"
            >
              How it works
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 py-8 sm:py-12 flex flex-col">
        {/* Practice Hub Header */}
        <div className="mb-8 sm:mb-10">
          <div className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-[6px] bg-[#181C22] border border-[#262B33] text-xs font-mono text-[#F5A524] mb-3">
            <span>Engineering Practice</span>
          </div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-semibold tracking-tight text-[#E8EAED] mb-3">
            Practise real engineering scenarios
          </h1>
          <p className="text-sm sm:text-base text-[#9AA3AE] leading-relaxed max-w-2xl">
            Choose an incident, investigate the evidence, and work through the decisions developers make when real systems fail.
          </p>
        </div>

        {/* Continuity Callout: Active Investigation Resume Banner */}
        {isMounted && activeIncident && (
          <div className="mb-8 p-4 sm:p-5 rounded-[12px] bg-[#12151A] border border-[#F5A524]/40 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start sm:items-center space-x-3 min-w-0">
              <div className="w-8 h-8 rounded-[8px] bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-[#F5A524] shrink-0 mt-0.5 sm:mt-0">
                <RotateCcw className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center space-x-2 text-xs font-mono text-[#F5A524] font-medium">
                  <span>RESUME INVESTIGATION</span>
                  <span>·</span>
                  <span className="text-[#E8EAED]">
                    {sessions[activeIncident.id]?.stepLabel}
                  </span>
                </div>
                <div className="text-sm sm:text-base font-semibold text-[#E8EAED] truncate">
                  {activeIncident.title}
                </div>
              </div>
            </div>

            <Link
              href={`/challenge/${activeIncident.id}`}
              className="inline-flex items-center justify-center space-x-2 bg-[#F5A524] hover:bg-[#e09419] text-[#0B0D10] font-semibold text-xs sm:text-sm px-4 py-2.5 rounded-[8px] transition-calm shrink-0 focus-visible:outline-2 focus-visible:outline-[#F5A524]"
            >
              <span>Continue investigation</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        )}

        {/* Lightweight Filter Bar */}
        <div className="flex items-center justify-between gap-4 border-b border-[#262B33] pb-4 mb-6">
          <div className="flex items-center space-x-1.5 sm:space-x-2">
            {(['All', 'Full-stack', 'Backend'] as FilterCategory[]).map((filter) => {
              const count =
                filter === 'All'
                  ? incidents.length
                  : incidents.filter((i) => i.role.toLowerCase() === filter.toLowerCase()).length;

              const isSelected = activeFilter === filter;

              return (
                <button
                  key={filter}
                  type="button"
                  onClick={() => setActiveFilter(filter)}
                  className={`px-3 py-1.5 rounded-[6px] text-xs font-medium transition-calm flex items-center space-x-1.5 ${
                    isSelected
                      ? 'bg-[#181C22] text-[#F5A524] border border-[#F5A524]/60 font-semibold shadow-sm'
                      : 'bg-[#12151A] text-[#9AA3AE] hover:text-[#E8EAED] border border-[#262B33] hover:border-[#3A424E]'
                  }`}
                  aria-pressed={isSelected}
                >
                  <span>{filter}</span>
                  <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-[#0B0D10] text-[#9AA3AE]">
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="text-xs font-mono text-[#9AA3AE] hidden sm:block">
            {filteredIncidents.length} {filteredIncidents.length === 1 ? 'incident' : 'incidents'}
          </div>
        </div>

        {/* Challenges List */}
        <section aria-label="Available Practice Challenges" className="space-y-4">
          {filteredIncidents.map((incident) => {
            const session = isMounted ? sessions[incident.id] : null;
            const hasProgress = session?.inProgress;
            const isCompleted = session?.isCompleted;

            return (
              <article
                key={incident.id}
                className="bg-[#12151A] border border-[#262B33] rounded-[12px] p-5 sm:p-6 md:p-7 hover:border-[#F5A524]/50 transition-calm relative group"
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
                  <div className="space-y-3 flex-1 min-w-0">
                    {/* Tags row: Role, Type, Difficulty, Duration, Recommended */}
                    <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
                      {incident.isRecommended && (
                        <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-[4px] bg-amber-500/10 border border-amber-500/30 text-amber-300 font-medium">
                          <Sparkles className="w-3 h-3" />
                          <span>Recommended start</span>
                        </span>
                      )}

                      <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-[4px] bg-[#181C22] border border-[#262B33] text-[#E8EAED]">
                        <Cpu className="w-3 h-3 text-[#9AA3AE]" />
                        <span>{incident.role}</span>
                      </span>

                      <span className="inline-flex items-center px-2 py-0.5 rounded-[4px] bg-[#181C22] border border-[#262B33] text-[#9AA3AE]">
                        <span>{incident.type}</span>
                      </span>

                      {incident.difficulty && (
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-[4px] border ${
                            incident.difficulty === 'Beginner'
                              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                              : 'bg-amber-500/10 border-amber-500/30 text-amber-300'
                          }`}
                        >
                          <span>{incident.difficulty}</span>
                        </span>
                      )}

                      <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-[4px] bg-[#181C22] border border-[#262B33] text-[#9AA3AE]">
                        <Clock className="w-3 h-3" />
                        <span>~{incident.estimatedMinutes} min</span>
                      </span>

                      {hasProgress && (
                        <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-[4px] bg-blue-500/10 border border-blue-500/30 text-blue-300">
                          {isCompleted ? (
                            <>
                              <CheckCircle2 className="w-3 h-3" />
                              <span>Completed</span>
                            </>
                          ) : (
                            <>
                              <RotateCcw className="w-3 h-3" />
                              <span>{session?.stepLabel}</span>
                            </>
                          )}
                        </span>
                      )}
                    </div>

                    {/* Title */}
                    <h2 className="text-lg sm:text-xl font-semibold text-[#E8EAED] group-hover:text-[#F5A524] transition-calm">
                      <Link href={`/challenge/${incident.id}`} className="focus:outline-none">
                        {incident.title}
                      </Link>
                    </h2>

                    {/* Summary */}
                    <p className="text-xs sm:text-sm text-[#9AA3AE] leading-relaxed max-w-2xl">
                      {incident.summary}
                    </p>

                    {/* Skills tags */}
                    {incident.skills && incident.skills.length > 0 && (
                      <div className="flex flex-wrap items-center gap-1.5 pt-1">
                        <span className="text-[11px] font-mono text-[#9AA3AE]/70 mr-1">Skills:</span>
                        {incident.skills.map((skill) => (
                          <span
                            key={skill}
                            className="text-[11px] font-mono px-2 py-0.5 rounded-[4px] bg-[#0B0D10] border border-[#262B33] text-[#9AA3AE]"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Action Button */}
                  <div className="flex flex-col items-stretch md:items-end justify-center shrink-0 pt-2 md:pt-0">
                    <Link
                      href={`/challenge/${incident.id}`}
                      className={`inline-flex items-center justify-center space-x-2 font-semibold text-xs sm:text-sm px-4 sm:px-5 py-2.5 rounded-[8px] transition-calm focus-visible:outline-2 focus-visible:outline-[#F5A524] ${
                        hasProgress
                          ? 'bg-[#181C22] hover:bg-[#20252D] text-[#E8EAED] border border-[#262B33] hover:border-[#F5A524]/60'
                          : 'bg-[#F5A524] hover:bg-[#e09419] text-[#0B0D10]'
                      }`}
                    >
                      <span>
                        {hasProgress
                          ? isCompleted
                            ? 'Review investigation'
                            : 'Continue investigation'
                          : 'Start challenge'}
                      </span>
                      <ArrowRight className="w-4 h-4" />
                    </Link>

                    {hasProgress && !isCompleted && (
                      <span className="text-[11px] font-mono text-[#9AA3AE] text-center md:text-right mt-1.5">
                        Progress saved in browser
                      </span>
                    )}
                  </div>
                </div>
              </article>
            );
          })}
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-[#262B33] bg-[#12151A]/40 py-5 sm:py-6 mt-12">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[#9AA3AE]">
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

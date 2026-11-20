import React, { useState } from 'react';
import { SimulatedCrew } from '../types';
import { ShieldAlert, AlertTriangle, CheckCircle2, Clock, Users, Plane, Filter } from 'lucide-react';

interface CrewDutyMonitoringProps {
  crews: SimulatedCrew[];
}

export const CrewDutyMonitoring: React.FC<CrewDutyMonitoringProps> = ({ crews }) => {
  const [filter, setFilter] = useState<'ALL' | 'ALERTS_ONLY'>('ALL');

  const filteredCrews = crews.filter((c) => {
    if (filter === 'ALERTS_ONLY') {
      return c.status === 'VIOLATION' || c.status === 'WARNING';
    }
    return true;
  });

  const totalViolations = crews.filter((c) => c.status === 'VIOLATION').length;
  const totalWarnings = crews.filter((c) => c.status === 'WARNING').length;

  return (
    <div className="bg-[#0b152d]/90 border border-cyan-900/40 rounded-xl p-5 shadow-xl shadow-cyan-950/20 backdrop-blur-md">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 mb-4 border-b border-cyan-900/40">
        <div>
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-cyan-400" />
            <h3 className="text-sm font-semibold tracking-wide text-white uppercase font-mono">
              Flight Crew Duty Monitoring (16 Cockpit & Cabin Rosters)
            </h3>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Real-time compliance tracking against the Directorate General of Civil Aviation (DGCA) 600m (10h) maximum Flight Duty Period (FDP)
          </p>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-[#070e1e] border border-cyan-800/60 rounded-lg p-0.5 text-xs font-mono">
            <button
              onClick={() => setFilter('ALL')}
              className={`px-3 py-1 rounded transition-colors ${
                filter === 'ALL'
                  ? 'bg-cyan-600 text-white font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              All Rosters (16)
            </button>
            <button
              onClick={() => setFilter('ALERTS_ONLY')}
              className={`px-3 py-1 rounded transition-colors flex items-center gap-1.5 ${
                filter === 'ALERTS_ONLY'
                  ? 'bg-amber-600 text-white font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <AlertTriangle className="w-3 h-3" />
              Alerts ({totalViolations + totalWarnings})
            </button>
          </div>
        </div>
      </div>

      {/* Critical Alert Warning Bar */}
      {totalViolations > 0 ? (
        <div className="bg-red-950/40 border border-red-700/60 rounded-lg p-3 mb-4 flex items-center justify-between text-xs glow-red">
          <div className="flex items-center gap-2 text-red-300">
            <ShieldAlert className="w-4 h-4 text-red-400 flex-shrink-0 animate-bounce" />
            <span>
              <strong>CRITICAL CREW DUTY VIOLATION DETECTED:</strong> {totalViolations} crew(s) exceed the 600-minute legal limit. Immediate replacement or schedule relief mandatory.
            </span>
          </div>
          <span className="font-mono text-red-400 font-bold ml-4 whitespace-nowrap">
            {totalViolations} ILLEGAL ROSTERS
          </span>
        </div>
      ) : totalWarnings > 0 ? (
        <div className="bg-amber-950/30 border border-amber-700/50 rounded-lg p-3 mb-4 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 text-amber-300">
            <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0" />
            <span>
              <strong>DUTY BUFFER WARNING:</strong> {totalWarnings} crew(s) are within 45 minutes of the 600-minute maximum duty limit. Standby reserve crew callout advised.
            </span>
          </div>
          <span className="font-mono text-amber-400 font-bold ml-4 whitespace-nowrap">
            {totalWarnings} NEAR LIMIT
          </span>
        </div>
      ) : null}

      {/* Grid of Crew Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3.5 max-h-[460px] overflow-y-auto pr-1">
        {filteredCrews.map((cr) => {
          const isViolation = cr.status === 'VIOLATION';
          const isWarning = cr.status === 'WARNING';

          return (
            <div
              key={cr.crew_id}
              className={`rounded-xl p-3.5 border transition-all ${
                isViolation
                  ? 'bg-red-950/30 border-red-600/70 shadow-md shadow-red-950/40 glow-red'
                  : isWarning
                  ? 'bg-amber-950/20 border-amber-600/50'
                  : 'bg-[#081226]/80 border-cyan-900/30'
              }`}
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-mono font-bold text-white px-2 py-0.5 rounded bg-slate-800 border border-slate-700">
                    {cr.crew_id}
                  </span>
                  <span className="text-xs font-mono text-cyan-300">
                    Base: {cr.base}
                  </span>
                </div>
                <span
                  className={`text-[10px] font-mono font-semibold px-2 py-0.5 rounded flex items-center gap-1 ${
                    isViolation
                      ? 'bg-red-950 text-red-300 border border-red-700'
                      : isWarning
                      ? 'bg-amber-950 text-amber-300 border border-amber-700'
                      : 'bg-emerald-950 text-emerald-300 border border-emerald-700'
                  }`}
                >
                  {isViolation ? 'VIOLATION' : isWarning ? 'WARNING' : 'COMPLIANT'}
                </span>
              </div>

              {/* Aircraft and Legs */}
              <div className="text-[11px] font-mono text-slate-300 mb-2 flex items-center justify-between bg-[#060c1b] px-2.5 py-1.5 rounded border border-cyan-950">
                <span className="flex items-center gap-1">
                  <Plane className="w-3 h-3 text-cyan-400" />
                  Tail: <strong className="text-white">{cr.tail_id}</strong>
                </span>
                <span className="text-slate-400">
                  {cr.flight_ids.length} legs
                </span>
              </div>

              {/* Timing metrics */}
              <div className="text-[11px] font-mono text-slate-400 space-y-1 mb-3">
                <div className="flex items-center justify-between">
                  <span>Duty Start:</span>
                  <span className="text-slate-200">{cr.duty_start}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Last Arr (Actual):</span>
                  <span className={isViolation ? 'text-red-400 font-bold' : 'text-slate-200'}>
                    {cr.actual_duty_end}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Total Duty Time:</span>
                  <span
                    className={`font-bold ${
                      isViolation
                        ? 'text-red-400'
                        : isWarning
                        ? 'text-amber-400'
                        : 'text-emerald-400'
                    }`}
                  >
                    {cr.actual_duty_mins}m / {cr.max_duty_mins}m
                  </span>
                </div>
              </div>

              {/* Duty Progress Bar */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
                  <span>FDP Utilization</span>
                  <span
                    className={
                      isViolation
                        ? 'text-red-400 font-bold'
                        : isWarning
                        ? 'text-amber-400 font-bold'
                        : 'text-slate-300'
                    }
                  >
                    {cr.duty_utilization_pct}%
                  </span>
                </div>
                <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${
                      isViolation
                        ? 'bg-red-500'
                        : isWarning
                        ? 'bg-amber-400'
                        : 'bg-cyan-500'
                    }`}
                    style={{ width: `${Math.min(cr.duty_utilization_pct, 100)}%` }}
                  />
                </div>
              </div>

              {/* Overage note */}
              {isViolation && (
                <p className="text-[10px] font-mono text-red-300 font-semibold mt-2 text-center bg-red-950/80 py-1 rounded border border-red-800">
                  Exceeded legal FDP by +{cr.overage_mins} minutes
                </p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

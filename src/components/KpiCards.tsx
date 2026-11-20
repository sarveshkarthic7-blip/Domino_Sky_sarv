import React from 'react';
import {
  Plane,
  Clock,
  Timer,
  Ban,
  GitBranch,
  Users,
  ShieldAlert,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';
import { SimulationKPIs, ComparisonDelta } from '../types';

interface KpiCardsProps {
  kpis: SimulationKPIs;
  delta?: ComparisonDelta | null;
  isRecoveryActive: boolean;
}

export const KpiCards: React.FC<KpiCardsProps> = ({ kpis, delta, isRecoveryActive }) => {
  const delayedPct = Math.round((kpis.delayed_flights / kpis.total_flights) * 100);

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
      {/* 1. Total Flights */}
      <div className="bg-[#0b142b]/80 border border-cyan-900/40 rounded-xl p-3.5 backdrop-blur-sm relative overflow-hidden group hover:border-cyan-500/40 transition-all">
        <div className="flex items-center justify-between text-slate-400 mb-2">
          <span className="text-[11px] font-medium uppercase tracking-wider">Total Flights</span>
          <Plane className="w-4 h-4 text-cyan-400" />
        </div>
        <div className="flex items-baseline gap-1.5">
          <span className="text-2xl font-bold font-mono text-white">{kpis.total_flights}</span>
          <span className="text-xs text-slate-400">legs</span>
        </div>
        <div className="mt-1.5 flex items-center justify-between text-[11px] text-slate-400">
          <span>Schedule Base</span>
          <span className="text-cyan-300 font-mono">16 Aircraft</span>
        </div>
      </div>

      {/* 2. Delayed Flights */}
      <div
        className={`border rounded-xl p-3.5 backdrop-blur-sm relative overflow-hidden transition-all ${
          kpis.delayed_flights > 0
            ? 'bg-amber-950/20 border-amber-600/40 hover:border-amber-500/60'
            : 'bg-[#0b142b]/80 border-cyan-900/40'
        }`}
      >
        <div className="flex items-center justify-between text-slate-400 mb-2">
          <span className="text-[11px] font-medium uppercase tracking-wider">Delayed Flights</span>
          <Clock className={`w-4 h-4 ${kpis.delayed_flights > 0 ? 'text-amber-400' : 'text-slate-500'}`} />
        </div>
        <div className="flex items-baseline justify-between">
          <div className="flex items-baseline gap-1.5">
            <span
              className={`text-2xl font-bold font-mono ${
                kpis.delayed_flights > 0 ? 'text-amber-400' : 'text-slate-300'
              }`}
            >
              {kpis.delayed_flights}
            </span>
            <span className="text-xs text-slate-400">({delayedPct}%)</span>
          </div>
          {isRecoveryActive && delta && delta.delayed_flights_diff !== 0 && (
            <span
              className={`text-[10px] font-mono px-1.5 py-0.5 rounded flex items-center gap-0.5 ${
                delta.delayed_flights_diff < 0
                  ? 'bg-emerald-950 text-emerald-300 border border-emerald-600/60'
                  : 'bg-red-950 text-red-300 border border-red-600/60'
              }`}
            >
              {delta.delayed_flights_diff < 0 ? <ArrowDownRight className="w-3 h-3" /> : <ArrowUpRight className="w-3 h-3" />}
              {Math.abs(delta.delayed_flights_diff)}
            </span>
          )}
        </div>
        <div className="mt-1.5 flex items-center justify-between text-[11px] text-slate-400">
          <span>On-Time: {kpis.on_time_flights}</span>
          {kpis.recovered_flights > 0 && (
            <span className="text-emerald-400 font-mono font-semibold">+{kpis.recovered_flights} recovered</span>
          )}
        </div>
      </div>

      {/* 3. Total Departure Delay */}
      <div
        className={`border rounded-xl p-3.5 backdrop-blur-sm relative overflow-hidden transition-all ${
          kpis.total_departure_delay_min > 0
            ? 'bg-amber-950/20 border-amber-600/40 hover:border-amber-500/60'
            : 'bg-[#0b142b]/80 border-cyan-900/40'
        }`}
      >
        <div className="flex items-center justify-between text-slate-400 mb-2">
          <span className="text-[11px] font-medium uppercase tracking-wider">Departure Delay</span>
          <Timer className={`w-4 h-4 ${kpis.total_departure_delay_min > 0 ? 'text-amber-400' : 'text-slate-500'}`} />
        </div>
        <div className="flex items-baseline justify-between">
          <div className="flex items-baseline gap-1.5">
            <span
              className={`text-2xl font-bold font-mono ${
                kpis.total_departure_delay_min > 0 ? 'text-amber-400' : 'text-slate-300'
              }`}
            >
              {kpis.total_departure_delay_min}
            </span>
            <span className="text-xs text-slate-400">min</span>
          </div>
          {isRecoveryActive && delta && delta.total_delay_diff_min !== 0 && (
            <span
              className={`text-[10px] font-mono px-1.5 py-0.5 rounded flex items-center gap-0.5 ${
                delta.total_delay_diff_min < 0
                  ? 'bg-emerald-950 text-emerald-300 border border-emerald-600/60'
                  : 'bg-red-950 text-red-300 border border-red-600/60'
              }`}
            >
              {delta.total_delay_diff_min < 0 ? '-' : '+'}
              {Math.abs(delta.total_delay_diff_min)}m
            </span>
          )}
        </div>
        <div className="mt-1.5 flex items-center justify-between text-[11px] text-slate-400">
          <span>Avg Delay</span>
          <span className="text-amber-300 font-mono font-medium">
            {kpis.average_delay_min} min/flt
          </span>
        </div>
      </div>

      {/* 4. Cancelled Flights */}
      <div
        className={`border rounded-xl p-3.5 backdrop-blur-sm relative overflow-hidden transition-all ${
          kpis.cancelled_flights > 0
            ? 'bg-red-950/20 border-red-700/50 hover:border-red-500/60'
            : 'bg-[#0b142b]/80 border-cyan-900/40'
        }`}
      >
        <div className="flex items-center justify-between text-slate-400 mb-2">
          <span className="text-[11px] font-medium uppercase tracking-wider">Cancelled</span>
          <Ban className={`w-4 h-4 ${kpis.cancelled_flights > 0 ? 'text-red-400' : 'text-slate-500'}`} />
        </div>
        <div className="flex items-baseline gap-1.5">
          <span
            className={`text-2xl font-bold font-mono ${
              kpis.cancelled_flights > 0 ? 'text-red-400' : 'text-slate-300'
            }`}
          >
            {kpis.cancelled_flights}
          </span>
          <span className="text-xs text-slate-400">flights</span>
        </div>
        <div className="mt-1.5 flex items-center justify-between text-[11px] text-slate-400">
          <span>Status</span>
          <span className={kpis.cancelled_flights > 0 ? 'text-red-300 font-mono' : 'text-slate-500'}>
            {kpis.cancelled_flights > 0 ? 'Ground Staged' : '0 Nullified'}
          </span>
        </div>
      </div>

      {/* 5. Broken Connections */}
      <div
        className={`border rounded-xl p-3.5 backdrop-blur-sm relative overflow-hidden transition-all ${
          kpis.broken_connections > 0
            ? 'bg-rose-950/20 border-rose-600/40 hover:border-rose-500/60'
            : 'bg-[#0b142b]/80 border-cyan-900/40'
        }`}
      >
        <div className="flex items-center justify-between text-slate-400 mb-2">
          <span className="text-[11px] font-medium uppercase tracking-wider">Broken CX</span>
          <GitBranch className={`w-4 h-4 ${kpis.broken_connections > 0 ? 'text-rose-400' : 'text-slate-500'}`} />
        </div>
        <div className="flex items-baseline justify-between">
          <div className="flex items-baseline gap-1.5">
            <span
              className={`text-2xl font-bold font-mono ${
                kpis.broken_connections > 0 ? 'text-rose-400' : 'text-slate-300'
              }`}
            >
              {kpis.broken_connections}
            </span>
            <span className="text-xs text-slate-400">pairs</span>
          </div>
          {isRecoveryActive && delta && delta.broken_connections_diff !== 0 && (
            <span
              className={`text-[10px] font-mono px-1.5 py-0.5 rounded flex items-center gap-0.5 ${
                delta.broken_connections_diff < 0
                  ? 'bg-emerald-950 text-emerald-300 border border-emerald-600/60'
                  : 'bg-red-950 text-red-300 border border-red-600/60'
              }`}
            >
              {delta.broken_connections_diff < 0 ? '-' : '+'}
              {Math.abs(delta.broken_connections_diff)}
            </span>
          )}
        </div>
        <div className="mt-1.5 flex items-center justify-between text-[11px] text-slate-400">
          <span>Safe CX</span>
          <span className="text-emerald-400 font-mono">{kpis.safe_connections}/21</span>
        </div>
      </div>

      {/* 6. Passengers Affected */}
      <div
        className={`border rounded-xl p-3.5 backdrop-blur-sm relative overflow-hidden transition-all ${
          kpis.affected_passengers > 0
            ? 'bg-rose-950/20 border-rose-600/40 hover:border-rose-500/60'
            : 'bg-[#0b142b]/80 border-cyan-900/40'
        }`}
      >
        <div className="flex items-center justify-between text-slate-400 mb-2">
          <span className="text-[11px] font-medium uppercase tracking-wider">Pax Affected</span>
          <Users className={`w-4 h-4 ${kpis.affected_passengers > 0 ? 'text-rose-400' : 'text-slate-500'}`} />
        </div>
        <div className="flex items-baseline justify-between">
          <div className="flex items-baseline gap-1.5">
            <span
              className={`text-2xl font-bold font-mono ${
                kpis.affected_passengers > 0 ? 'text-rose-400' : 'text-slate-300'
              }`}
            >
              {kpis.affected_passengers}
            </span>
            <span className="text-xs text-slate-400">pax</span>
          </div>
          {isRecoveryActive && delta && delta.affected_passengers_diff !== 0 && (
            <span
              className={`text-[10px] font-mono px-1.5 py-0.5 rounded flex items-center gap-0.5 ${
                delta.affected_passengers_diff < 0
                  ? 'bg-emerald-950 text-emerald-300 border border-emerald-600/60'
                  : 'bg-red-950 text-red-300 border border-red-600/60'
              }`}
            >
              {delta.affected_passengers_diff < 0 ? '-' : '+'}
              {Math.abs(delta.affected_passengers_diff)}
            </span>
          )}
        </div>
        <div className="mt-1.5 flex items-center justify-between text-[11px] text-slate-400">
          <span>Missed Connect</span>
          <span className="text-rose-300 font-mono">Rebook required</span>
        </div>
      </div>

      {/* 7. Crew Duty Alerts */}
      <div
        className={`border rounded-xl p-3.5 backdrop-blur-sm relative overflow-hidden transition-all ${
          kpis.crew_duty_violations > 0
            ? 'bg-red-950/30 border-red-600/60 glow-red'
            : kpis.crew_duty_warnings > 0
            ? 'bg-amber-950/20 border-amber-600/40'
            : 'bg-[#0b142b]/80 border-cyan-900/40'
        }`}
      >
        <div className="flex items-center justify-between text-slate-400 mb-2">
          <span className="text-[11px] font-medium uppercase tracking-wider">Crew Alerts</span>
          <ShieldAlert
            className={`w-4 h-4 ${
              kpis.crew_duty_violations > 0
                ? 'text-red-400 animate-bounce'
                : kpis.crew_duty_warnings > 0
                ? 'text-amber-400'
                : 'text-slate-500'
            }`}
          />
        </div>
        <div className="flex items-baseline justify-between">
          <div className="flex items-baseline gap-1.5">
            <span
              className={`text-2xl font-bold font-mono ${
                kpis.crew_duty_violations > 0
                  ? 'text-red-400'
                  : kpis.crew_duty_warnings > 0
                  ? 'text-amber-400'
                  : 'text-slate-300'
              }`}
            >
              {kpis.crew_duty_violations}
            </span>
            <span className="text-xs text-slate-400">
              {kpis.crew_duty_warnings > 0 ? `+${kpis.crew_duty_warnings} warn` : 'alerts'}
            </span>
          </div>
          {isRecoveryActive && delta && delta.crew_violations_diff !== 0 && (
            <span
              className={`text-[10px] font-mono px-1.5 py-0.5 rounded flex items-center gap-0.5 ${
                delta.crew_violations_diff < 0
                  ? 'bg-emerald-950 text-emerald-300 border border-emerald-600/60'
                  : 'bg-red-950 text-red-300 border border-red-600/60'
              }`}
            >
              {delta.crew_violations_diff < 0 ? '-' : '+'}
              {Math.abs(delta.crew_violations_diff)}
            </span>
          )}
        </div>
        <div className="mt-1.5 flex items-center justify-between text-[11px] text-slate-400">
          <span>Legal Limit</span>
          <span className="text-cyan-300 font-mono">600m max</span>
        </div>
      </div>
    </div>
  );
};

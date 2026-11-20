import React from 'react';
import { ComparisonResult, SimulatedFlight } from '../types';
import {
  TrendingDown,
  TrendingUp,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Clock,
  GitBranch,
  Users,
  ShieldAlert,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';

interface BeforeAfterComparisonProps {
  comparison: ComparisonResult;
  beforeFlights: SimulatedFlight[];
  afterFlights: SimulatedFlight[];
}

export const BeforeAfterComparison: React.FC<BeforeAfterComparisonProps> = ({
  comparison,
  beforeFlights,
  afterFlights,
}) => {
  const { before, after, delta } = comparison;

  // Chart data: compare delays for the top affected flights before and after
  const topDelayedBefore = beforeFlights
    .filter((f) => f.dep_delay > 0)
    .sort((a, b) => b.dep_delay - a.dep_delay)
    .slice(0, 8);

  const chartData = topDelayedBefore.map((bf) => {
    const af = afterFlights.find((f) => f.flight_id === bf.flight_id);
    return {
      flight: bf.flight_id,
      route: `${bf.origin}→${bf.destination}`,
      'Before Recovery': bf.dep_delay,
      'After Recovery': af?.is_cancelled ? 0 : af ? af.dep_delay : 0,
    };
  });

  return (
    <div className="bg-[#0b152d]/90 border border-cyan-900/40 rounded-xl p-5 shadow-xl shadow-cyan-950/20 backdrop-blur-md">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 mb-4 border-b border-cyan-900/40">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1 rounded bg-cyan-950 border border-cyan-700/60 text-cyan-400">
              <CheckCircle2 className="w-4 h-4" />
            </span>
            <h3 className="text-sm font-semibold tracking-wide text-white uppercase font-mono">
              Before vs After Recovery Evaluation Matrix
            </h3>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Deterministic quantitative benchmark of airline disruption recovery performance
          </p>
        </div>

        {/* Improvement Verdict Pill */}
        <div
          className={`px-3 py-1.5 rounded-lg border flex items-center gap-2 text-xs font-mono font-bold ${
            delta.is_improved
              ? 'bg-emerald-950/80 border-emerald-600/70 text-emerald-300 glow-emerald'
              : 'bg-amber-950/80 border-amber-600/70 text-amber-300'
          }`}
        >
          {delta.is_improved ? (
            <>
              <TrendingDown className="w-4 h-4 text-emerald-400" />
              <span>NETWORK STABILIZED (-{Math.abs(delta.total_delay_diff_min)}m Delay)</span>
            </>
          ) : (
            <>
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              <span>MARGINAL IMPACT DETECTED</span>
            </>
          )}
        </div>
      </div>

      {/* Side-by-Side Metric Comparison Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-5">
        {/* Metric 1: Total Delay Minutes */}
        <div className="bg-[#071024] p-3 rounded-lg border border-cyan-900/40">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span className="uppercase tracking-wider text-[10px]">Total Delay</span>
            <Clock className="w-3.5 h-3.5 text-cyan-400" />
          </div>
          <div className="flex items-center gap-2 font-mono text-sm">
            <span className="text-amber-400 font-bold">{before.total_departure_delay_min}m</span>
            <ArrowRight className="w-3 h-3 text-slate-500" />
            <span className="text-emerald-400 font-bold">{after.total_departure_delay_min}m</span>
          </div>
          <div className="mt-1 text-[11px] font-mono font-semibold text-emerald-400">
            {delta.total_delay_diff_min <= 0
              ? `Saved ${Math.abs(delta.total_delay_diff_min)} mins`
              : `+${delta.total_delay_diff_min} mins`}
          </div>
        </div>

        {/* Metric 2: Delayed Flights Count */}
        <div className="bg-[#071024] p-3 rounded-lg border border-cyan-900/40">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span className="uppercase tracking-wider text-[10px]">Delayed Flights</span>
            <Clock className="w-3.5 h-3.5 text-cyan-400" />
          </div>
          <div className="flex items-center gap-2 font-mono text-sm">
            <span className="text-amber-400 font-bold">{before.delayed_flights}</span>
            <ArrowRight className="w-3 h-3 text-slate-500" />
            <span className="text-emerald-400 font-bold">{after.delayed_flights}</span>
          </div>
          <div className="mt-1 text-[11px] font-mono font-semibold text-emerald-400">
            {delta.delayed_flights_diff <= 0
              ? `${Math.abs(delta.delayed_flights_diff)} recovered`
              : `+${delta.delayed_flights_diff} delayed`}
          </div>
        </div>

        {/* Metric 3: Broken Connections */}
        <div className="bg-[#071024] p-3 rounded-lg border border-cyan-900/40">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span className="uppercase tracking-wider text-[10px]">Broken CX</span>
            <GitBranch className="w-3.5 h-3.5 text-rose-400" />
          </div>
          <div className="flex items-center gap-2 font-mono text-sm">
            <span className="text-rose-400 font-bold">{before.broken_connections}</span>
            <ArrowRight className="w-3 h-3 text-slate-500" />
            <span className="text-emerald-400 font-bold">{after.broken_connections}</span>
          </div>
          <div className="mt-1 text-[11px] font-mono font-semibold text-emerald-400">
            {delta.broken_connections_diff <= 0
              ? `${Math.abs(delta.broken_connections_diff)} protected`
              : `+${delta.broken_connections_diff} broken`}
          </div>
        </div>

        {/* Metric 4: Affected Passengers */}
        <div className="bg-[#071024] p-3 rounded-lg border border-cyan-900/40">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span className="uppercase tracking-wider text-[10px]">Pax Affected</span>
            <Users className="w-3.5 h-3.5 text-rose-400" />
          </div>
          <div className="flex items-center gap-2 font-mono text-sm">
            <span className="text-rose-400 font-bold">{before.affected_passengers}</span>
            <ArrowRight className="w-3 h-3 text-slate-500" />
            <span className="text-emerald-400 font-bold">{after.affected_passengers}</span>
          </div>
          <div className="mt-1 text-[11px] font-mono font-semibold text-emerald-400">
            {delta.affected_passengers_diff <= 0
              ? `${Math.abs(delta.affected_passengers_diff)} rescued`
              : `+${delta.affected_passengers_diff} pax`}
          </div>
        </div>

        {/* Metric 5: Crew Violations */}
        <div className="bg-[#071024] p-3 rounded-lg border border-cyan-900/40">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span className="uppercase tracking-wider text-[10px]">Crew Violations</span>
            <ShieldAlert className="w-3.5 h-3.5 text-red-400" />
          </div>
          <div className="flex items-center gap-2 font-mono text-sm">
            <span className="text-red-400 font-bold">{before.crew_duty_violations}</span>
            <ArrowRight className="w-3 h-3 text-slate-500" />
            <span className="text-emerald-400 font-bold">{after.crew_duty_violations}</span>
          </div>
          <div className="mt-1 text-[11px] font-mono font-semibold text-emerald-400">
            {delta.crew_violations_diff <= 0
              ? `${Math.abs(delta.crew_violations_diff)} resolved`
              : `+${delta.crew_violations_diff} violations`}
          </div>
        </div>
      </div>

      {/* Visual Delay Reduction Chart */}
      {chartData.length > 0 && (
        <div className="bg-[#060c1d] p-4 rounded-xl border border-cyan-950">
          <div className="flex items-center justify-between mb-3 text-xs font-mono text-slate-300">
            <span className="font-semibold text-white">Flight Departure Delay Comparison (Top Cascaded Legs)</span>
            <span className="text-slate-500 text-[11px]">Values in Minutes</span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartData}
                margin={{ top: 10, right: 20, left: 0, bottom: 20 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#132448" />
                <XAxis
                  dataKey="flight"
                  stroke="#64748b"
                  tick={{ fill: '#94a3b8', fontSize: 11, fontFamily: 'monospace' }}
                />
                <YAxis
                  stroke="#64748b"
                  tick={{ fill: '#94a3b8', fontSize: 11, fontFamily: 'monospace' }}
                  label={{
                    value: 'Delay (min)',
                    angle: -90,
                    position: 'insideLeft',
                    fill: '#64748b',
                    fontSize: 10,
                  }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#070e20',
                    border: '1px solid #0891b2',
                    borderRadius: '8px',
                    fontFamily: 'monospace',
                    fontSize: '12px',
                  }}
                  itemStyle={{ color: '#e2e8f0' }}
                />
                <Legend
                  wrapperStyle={{
                    paddingTop: '8px',
                    fontFamily: 'monospace',
                    fontSize: '11px',
                  }}
                />
                <Bar dataKey="Before Recovery" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                <Bar dataKey="After Recovery" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
};

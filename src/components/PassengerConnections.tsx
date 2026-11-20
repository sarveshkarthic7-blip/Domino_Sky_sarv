import React, { useState } from 'react';
import { SimulatedConnection } from '../types';
import { GitBranch, AlertCircle, CheckCircle2, Users, Clock, Filter } from 'lucide-react';

interface PassengerConnectionsProps {
  connections: SimulatedConnection[];
}

export const PassengerConnections: React.FC<PassengerConnectionsProps> = ({ connections }) => {
  const [filter, setFilter] = useState<'ALL' | 'BROKEN_ONLY' | 'SAFE_ONLY'>('ALL');

  const filteredConnections = connections.filter((c) => {
    if (filter === 'BROKEN_ONLY') return c.status === 'BROKEN';
    if (filter === 'SAFE_ONLY') return c.status === 'SAFE';
    return true;
  });

  const totalBroken = connections.filter((c) => c.status === 'BROKEN').length;
  const totalPaxAffected = connections
    .filter((c) => c.status === 'BROKEN')
    .reduce((sum, c) => sum + c.passengers, 0);

  return (
    <div className="bg-[#0b152d]/90 border border-cyan-900/40 rounded-xl p-5 shadow-xl shadow-cyan-950/20 backdrop-blur-md">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 mb-4 border-b border-cyan-900/40">
        <div>
          <div className="flex items-center gap-2">
            <GitBranch className="w-4 h-4 text-cyan-400" />
            <h3 className="text-sm font-semibold tracking-wide text-white uppercase font-mono">
              Passenger Connection Analysis (21 Hub Transfer Pairs)
            </h3>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Monitors inbound-to-outbound transfer gaps against published Minimum Connection Times (MCT)
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
              All (21)
            </button>
            <button
              onClick={() => setFilter('BROKEN_ONLY')}
              className={`px-3 py-1 rounded transition-colors flex items-center gap-1.5 ${
                filter === 'BROKEN_ONLY'
                  ? 'bg-rose-600 text-white font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <AlertCircle className="w-3 h-3" />
              Broken ({totalBroken})
            </button>
            <button
              onClick={() => setFilter('SAFE_ONLY')}
              className={`px-3 py-1 rounded transition-colors flex items-center gap-1.5 ${
                filter === 'SAFE_ONLY'
                  ? 'bg-emerald-600 text-white font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <CheckCircle2 className="w-3 h-3" />
              Safe ({21 - totalBroken})
            </button>
          </div>
        </div>
      </div>

      {/* Summary Banner if broken */}
      {totalBroken > 0 && (
        <div className="bg-rose-950/40 border border-rose-800/60 rounded-lg p-3 mb-4 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 text-rose-300">
            <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
            <span>
              <strong>{totalBroken} passenger connections broken</strong> across network hubs. Urgent baggage
              and gate transfer re-routing required for <strong>{totalPaxAffected} ticketed passengers</strong>.
            </span>
          </div>
          <span className="font-mono text-rose-400 font-bold ml-4 whitespace-nowrap">
            {totalPaxAffected} PAX AT RISK
          </span>
        </div>
      )}

      {/* Grid of Connection Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 max-h-[460px] overflow-y-auto pr-1">
        {filteredConnections.map((c) => {
          const isBroken = c.status === 'BROKEN';
          return (
            <div
              key={c.connection_id}
              className={`rounded-xl p-3.5 border transition-all ${
                isBroken
                  ? 'bg-rose-950/20 border-rose-700/50 hover:border-rose-500/80 shadow-md shadow-rose-950/30'
                  : 'bg-[#081226]/80 border-cyan-900/30 hover:border-cyan-700/50'
              }`}
            >
              {/* Card Header */}
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold text-white px-2 py-0.5 rounded bg-slate-800 border border-slate-700">
                    {c.connection_id}
                  </span>
                  <span className="text-xs font-mono font-semibold text-cyan-300">
                    HUB: {c.airport}
                  </span>
                </div>
                <span
                  className={`text-[10px] font-mono font-semibold px-2 py-0.5 rounded flex items-center gap-1 ${
                    isBroken
                      ? 'bg-rose-950 text-rose-300 border border-rose-700'
                      : 'bg-emerald-950 text-emerald-300 border border-emerald-700'
                  }`}
                >
                  {isBroken ? <AlertCircle className="w-3 h-3" /> : <CheckCircle2 className="w-3 h-3" />}
                  {isBroken ? 'BROKEN' : 'SAFE'}
                </span>
              </div>

              {/* Transfer Flight Legs */}
              <div className="bg-[#060c1b] p-2.5 rounded-lg border border-cyan-950 mb-2 font-mono text-xs">
                <div className="flex items-center justify-between text-slate-300 mb-1">
                  <span>Inbound:</span>
                  <strong className="text-white">{c.from_flight}</strong>
                </div>
                <div className="flex items-center justify-between text-slate-300">
                  <span>Outbound:</span>
                  <strong className="text-white">{c.to_flight}</strong>
                </div>
              </div>

              {/* Transfer Times & Buffer */}
              <div className="text-[11px] font-mono text-slate-400 space-y-1 mb-2">
                <div className="flex items-center justify-between">
                  <span>Required MCT:</span>
                  <strong className="text-slate-200">{c.min_connect_minutes} mins</strong>
                </div>
                <div className="flex items-center justify-between">
                  <span>Actual Window:</span>
                  <strong className={isBroken ? 'text-rose-400 font-bold' : 'text-emerald-400'}>
                    {c.actual_gap_min} mins
                  </strong>
                </div>
                {isBroken && (
                  <div className="flex items-center justify-between text-rose-400 font-semibold">
                    <span>Shortfall:</span>
                    <span>-{c.shortfall_min} mins</span>
                  </div>
                )}
              </div>

              {/* Passengers and Reason Footer */}
              <div className="pt-2 border-t border-cyan-900/30 flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5 text-slate-300">
                  <Users className="w-3.5 h-3.5 text-cyan-400" />
                  <span className="font-mono font-bold text-white">{c.passengers}</span>
                  <span className="text-[11px] text-slate-400">passengers</span>
                </div>
              </div>

              {/* Short explanation */}
              <p
                className={`text-[10px] mt-1.5 leading-tight ${
                  isBroken ? 'text-rose-300/90' : 'text-slate-400'
                }`}
              >
                {c.reason}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
};

import React, { useState, useMemo } from 'react';
import { SimulatedFlight, Airport } from '../types';
import { Search, Filter, Plane, ArrowUpDown, Ban, RefreshCw } from 'lucide-react';

interface FlightTableProps {
  flights: SimulatedFlight[];
  airports: Airport[];
  onOpenSwapModal?: (flight: SimulatedFlight) => void;
  onCancelFlight?: (flightId: string) => void;
}

export const FlightTable: React.FC<FlightTableProps> = ({
  flights,
  airports,
  onOpenSwapModal,
  onCancelFlight,
}) => {
  const [search, setSearch] = useState('');
  const [selectedAirportFilter, setSelectedAirportFilter] = useState('ALL');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState('ALL');
  const [selectedTailFilter, setSelectedTailFilter] = useState('ALL');
  const [sortField, setSortField] = useState<'dep' | 'dep_delay' | 'flight_id'>('dep');
  const [sortAsc, setSortAsc] = useState(true);

  // Distinct aircraft tails
  const tails = useMemo(() => {
    return Array.from(new Set(flights.map((f) => f.current_tail_id))).sort();
  }, [flights]);

  // Filtering & Sorting
  const filteredFlights = useMemo(() => {
    return flights
      .filter((f) => {
        // Search filter
        if (search) {
          const s = search.toLowerCase();
          const matchFlight = f.flight_id.toLowerCase().includes(s);
          const matchTail = f.current_tail_id.toLowerCase().includes(s);
          const matchOrigin = f.origin.toLowerCase().includes(s);
          const matchDest = f.destination.toLowerCase().includes(s);
          if (!matchFlight && !matchTail && !matchOrigin && !matchDest) return false;
        }

        // Airport filter
        if (selectedAirportFilter !== 'ALL') {
          if (f.origin !== selectedAirportFilter && f.destination !== selectedAirportFilter) {
            return false;
          }
        }

        // Status filter
        if (selectedStatusFilter !== 'ALL') {
          if (selectedStatusFilter === 'DELAYED' && f.dep_delay === 0) return false;
          if (selectedStatusFilter === 'ON_TIME' && (f.dep_delay > 0 || f.is_cancelled)) return false;
          if (selectedStatusFilter === 'CANCELLED' && !f.is_cancelled) return false;
          if (selectedStatusFilter === 'RECOVERED' && f.status !== 'RECOVERED') return false;
        }

        // Tail filter
        if (selectedTailFilter !== 'ALL' && f.current_tail_id !== selectedTailFilter) {
          return false;
        }

        return true;
      })
      .sort((a, b) => {
        let valA: any = a[sortField];
        let valB: any = b[sortField];
        if (typeof valA === 'string') valA = valA.toLowerCase();
        if (typeof valB === 'string') valB = valB.toLowerCase();
        if (valA < valB) return sortAsc ? -1 : 1;
        if (valA > valB) return sortAsc ? 1 : -1;
        return 0;
      });
  }, [
    flights,
    search,
    selectedAirportFilter,
    selectedStatusFilter,
    selectedTailFilter,
    sortField,
    sortAsc,
  ]);

  const toggleSort = (field: 'dep' | 'dep_delay' | 'flight_id') => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(true);
    }
  };

  return (
    <div className="bg-[#0b152d]/90 border border-cyan-900/40 rounded-xl p-5 shadow-xl shadow-cyan-950/20 backdrop-blur-md">
      {/* Header and Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 mb-4 border-b border-cyan-900/40">
        <div>
          <h3 className="text-sm font-semibold tracking-wide text-white uppercase font-mono flex items-center gap-2">
            <Plane className="w-4 h-4 text-cyan-400" />
            Flight Operations Manifest ({filteredFlights.length} of {flights.length})
          </h3>
          <p className="text-xs text-slate-400">
            Real-time flight rotations, scheduled vs actual timings, and operational status
          </p>
        </div>

        {/* Search & Filters */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Search Input */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Filter flight / tail..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-[#080f21] border border-cyan-800/60 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white focus:outline-none focus:border-cyan-400 w-36 lg:w-44 font-mono"
            />
          </div>

          {/* Airport Filter */}
          <select
            value={selectedAirportFilter}
            onChange={(e) => setSelectedAirportFilter(e.target.value)}
            className="bg-[#080f21] border border-cyan-800/60 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-cyan-400 font-mono"
          >
            <option value="ALL">All Airports (16)</option>
            {airports.map((a) => (
              <option key={a.id} value={a.id}>
                {a.id} ({a.city})
              </option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={selectedStatusFilter}
            onChange={(e) => setSelectedStatusFilter(e.target.value)}
            className="bg-[#080f21] border border-cyan-800/60 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-cyan-400 font-mono"
          >
            <option value="ALL">All Statuses</option>
            <option value="ON_TIME">On Time</option>
            <option value="DELAYED">Delayed</option>
            <option value="CANCELLED">Cancelled</option>
            <option value="RECOVERED">Recovered</option>
          </select>

          {/* Aircraft Tail Filter */}
          <select
            value={selectedTailFilter}
            onChange={(e) => setSelectedTailFilter(e.target.value)}
            className="bg-[#080f21] border border-cyan-800/60 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-cyan-400 font-mono"
          >
            <option value="ALL">All Aircraft Tails</option>
            {tails.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Table Container */}
      <div className="overflow-x-auto rounded-lg border border-cyan-950 max-h-[500px]">
        <table className="w-full text-left text-xs font-mono">
          <thead className="bg-[#070e20] text-slate-400 uppercase tracking-wider sticky top-0 z-10 border-b border-cyan-900/50">
            <tr>
              <th
                onClick={() => toggleSort('flight_id')}
                className="py-3 px-3.5 cursor-pointer hover:text-white"
              >
                <div className="flex items-center gap-1">
                  Flight # <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
              <th className="py-3 px-3">Route</th>
              <th className="py-3 px-3">Tail ID</th>
              <th
                onClick={() => toggleSort('dep')}
                className="py-3 px-3 cursor-pointer hover:text-white"
              >
                <div className="flex items-center gap-1">
                  Sched (Dep → Arr) <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
              <th className="py-3 px-3">Actual (Dep → Arr)</th>
              <th
                onClick={() => toggleSort('dep_delay')}
                className="py-3 px-3 cursor-pointer hover:text-white text-right"
              >
                <div className="flex items-center justify-end gap-1">
                  Delay <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
              <th className="py-3 px-3 text-center">Status</th>
              <th className="py-3 px-3">Pax</th>
              <th className="py-3 px-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-cyan-950/60 bg-[#081126]">
            {filteredFlights.length === 0 ? (
              <tr>
                <td colSpan={9} className="py-8 text-center text-slate-500">
                  No flights match current filters.
                </td>
              </tr>
            ) : (
              filteredFlights.map((f) => {
                const isDelayed = f.dep_delay > 0;
                return (
                  <tr
                    key={f.flight_id}
                    className="hover:bg-[#0c1a3b]/60 transition-colors group"
                  >
                    <td className="py-2.5 px-3.5 font-bold text-white flex items-center gap-1.5">
                      <Plane className="w-3.5 h-3.5 text-cyan-400" />
                      <span>{f.flight_id}</span>
                      <span className="text-[10px] text-slate-500 font-normal">
                        L{f.leg_order}
                      </span>
                    </td>
                    <td className="py-2.5 px-3">
                      <span className="font-semibold text-cyan-300">{f.origin}</span>
                      <span className="text-slate-500 mx-1">→</span>
                      <span className="font-semibold text-cyan-300">{f.destination}</span>
                    </td>
                    <td className="py-2.5 px-3">
                      <span
                        className={`px-1.5 py-0.5 rounded text-[11px] font-mono ${
                          f.is_swapped
                            ? 'bg-purple-950/80 text-purple-300 border border-purple-700/60'
                            : 'text-slate-300'
                        }`}
                      >
                        {f.current_tail_id}
                        {f.is_swapped && ' (SPARE)'}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-slate-400">
                      {f.dep} → {f.arr}
                    </td>
                    <td className="py-2.5 px-3 font-semibold">
                      <span
                        className={
                          f.is_cancelled
                            ? 'line-through text-slate-600'
                            : isDelayed
                            ? 'text-amber-300'
                            : 'text-slate-200'
                        }
                      >
                        {f.actual_dep} → {f.actual_arr}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      {f.is_cancelled ? (
                        <span className="text-slate-500">--</span>
                      ) : isDelayed ? (
                        <span className="font-bold text-amber-400 bg-amber-950/60 px-2 py-0.5 rounded border border-amber-800/40">
                          +{f.dep_delay}m
                        </span>
                      ) : (
                        <span className="text-emerald-400">0m</span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold tracking-wider ${
                          f.is_cancelled
                            ? 'bg-red-950 text-red-300 border border-red-800'
                            : isDelayed
                            ? 'bg-amber-950 text-amber-300 border border-amber-800/70'
                            : f.status === 'RECOVERED'
                            ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                            : 'bg-cyan-950 text-cyan-300 border border-cyan-800/60'
                        }`}
                      >
                        {f.status}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-slate-300">{f.pax}</td>
                    <td className="py-2.5 px-3 text-right">
                      <div className="flex items-center justify-end gap-1.5 opacity-90 group-hover:opacity-100">
                        {onOpenSwapModal && !f.is_cancelled && (
                          <button
                            onClick={() => onOpenSwapModal(f)}
                            className="p-1 rounded bg-slate-800 hover:bg-cyan-900/60 text-slate-300 hover:text-cyan-300 border border-slate-700 hover:border-cyan-600 transition-colors"
                            title="Swap Spare Aircraft"
                          >
                            <RefreshCw className="w-3 h-3" />
                          </button>
                        )}
                        {onCancelFlight && !f.is_cancelled && (
                          <button
                            onClick={() => onCancelFlight(f.flight_id)}
                            className="p-1 rounded bg-slate-800 hover:bg-red-900/60 text-slate-300 hover:text-red-300 border border-slate-700 hover:border-red-600 transition-colors"
                            title="Cancel Flight Leg"
                          >
                            <Ban className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

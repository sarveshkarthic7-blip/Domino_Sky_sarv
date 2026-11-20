import React, { useState, useEffect, useMemo } from 'react';
import {
  runSimulation,
  compareSimulations,
  dataset,
} from './engine/simulation';
import {
  SimulationParams,
  SimulationResult,
  ComparisonResult,
  SimulatedFlight,
} from './types';
import { Header } from './components/Header';
import { SimulationControls } from './components/SimulationControls';
import { KpiCards } from './components/KpiCards';
import { NetworkVisualization } from './components/NetworkVisualization';
import { FlightTable } from './components/FlightTable';
import { PassengerConnections } from './components/PassengerConnections';
import { CrewDutyMonitoring } from './components/CrewDutyMonitoring';
import { RecoveryPanel } from './components/RecoveryPanel';
import { BeforeAfterComparison } from './components/BeforeAfterComparison';
import { AiAssistant } from './components/AiAssistant';
import {
  Plane,
  GitBranch,
  ShieldAlert,
  RefreshCw,
  BarChart3,
  Bot,
  HelpCircle,
  AlertTriangle,
} from 'lucide-react';

export const App: React.FC = () => {
  // Navigation tabs
  const [activeTab, setActiveTab] = useState<
    'NETWORK' | 'CONNECTIONS' | 'CREW' | 'RECOVERY' | 'COMPARISON' | 'AI'
  >('NETWORK');

  // Simulation Parameters
  const [selectedAirport, setSelectedAirport] = useState<string>('BOM');
  const [closureStartTime, setClosureStartTime] = useState<string>('07:30');
  const [closureDuration, setClosureDuration] = useState<number>(90);
  const [swaps, setSwaps] = useState<Array<{ flight_id: string; spare_tail_id: string; timestamp: string }>>([]);
  const [cancellations, setCancellations] = useState<string[]>([]);
  const [isSimulated, setIsSimulated] = useState<boolean>(true); // default loaded with initial state
  const [hasGeminiKey, setHasGeminiKey] = useState<boolean>(false);

  // Check backend health on load
  useEffect(() => {
    fetch('/api/health')
      .then((res) => res.json())
      .then((data) => {
        setHasGeminiKey(!!data.hasGeminiKey);
      })
      .catch((err) => {
        console.warn('Backend health check note:', err);
      });
  }, []);

  // Compute Baseline Disrupted Result (without recoveries)
  const baselineParams = useMemo<SimulationParams>(() => {
    return {
      closedAirport: isSimulated ? selectedAirport : null,
      closureStart: closureStartTime,
      closureDuration: isSimulated ? closureDuration : 0,
      swaps: [],
      cancellations: [],
    };
  }, [isSimulated, selectedAirport, closureStartTime, closureDuration]);

  const baselineResult = useMemo<SimulationResult>(() => {
    return runSimulation(baselineParams);
  }, [baselineParams]);

  // Compute Active Recovered Result (with any applied recoveries)
  const activeParams = useMemo<SimulationParams>(() => {
    return {
      closedAirport: isSimulated ? selectedAirport : null,
      closureStart: closureStartTime,
      closureDuration: isSimulated ? closureDuration : 0,
      swaps,
      cancellations,
    };
  }, [isSimulated, selectedAirport, closureStartTime, closureDuration, swaps, cancellations]);

  const activeResult = useMemo<SimulationResult>(() => {
    return runSimulation(activeParams);
  }, [activeParams]);

  const hasRecoveries = swaps.length > 0 || cancellations.length > 0;

  // Comparison between Disrupted Baseline and Active Recovered Result
  const comparisonResult = useMemo<ComparisonResult | null>(() => {
    if (!hasRecoveries) return null;
    return compareSimulations(baselineResult, activeResult);
  }, [baselineResult, activeResult, hasRecoveries]);

  // Simulation Status
  const simulationStatus: 'IDLE' | 'SIMULATED' | 'RECOVERED' = !isSimulated
    ? 'IDLE'
    : hasRecoveries
    ? 'RECOVERED'
    : 'SIMULATED';

  // Handlers
  const handleRunSimulation = () => {
    setIsSimulated(true);
  };

  const handleReset = () => {
    setSelectedAirport('BOM');
    setClosureStartTime('07:30');
    setClosureDuration(90);
    setSwaps([]);
    setCancellations([]);
    setIsSimulated(false);
  };

  // Hackathon Demo Scenario: BOM 07:30 AM for 90 minutes
  const handleApplyDemoScenario = () => {
    setSelectedAirport('BOM');
    setClosureStartTime('07:30');
    setClosureDuration(90);
    setSwaps([]);
    setCancellations([]);
    setIsSimulated(true);
    setActiveTab('NETWORK');
  };

  const handleApplySwap = (flightId: string, spareTailId: string) => {
    setSwaps((prev) => [
      ...prev.filter((s) => s.flight_id !== flightId),
      { flight_id: flightId, spare_tail_id: spareTailId, timestamp: new Date().toISOString() },
    ]);
  };

  const handleApplyCancellation = (flightId: string) => {
    setCancellations((prev) => [...new Set([...prev, flightId])]);
  };

  const handleUndoSwap = (flightId: string) => {
    setSwaps((prev) => prev.filter((s) => s.flight_id !== flightId));
  };

  const handleUndoCancellation = (flightId: string) => {
    setCancellations((prev) => prev.filter((id) => id !== flightId));
  };

  const handleResetAllRecoveries = () => {
    setSwaps([]);
    setCancellations([]);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#050b17] text-slate-100">
      {/* 1. Header */}
      <Header
        simulationStatus={simulationStatus}
        hasGeminiKey={hasGeminiKey}
        onApplyDemoScenario={handleApplyDemoScenario}
        onReset={handleReset}
        simulatedTimeStr={`${closureStartTime} IST`}
      />

      <main className="flex-1 max-w-[1700px] w-full mx-auto p-4 lg:p-6 space-y-6">
        {/* 2. Simulation Control Panel */}
        <SimulationControls
          airports={dataset.airports}
          selectedAirport={selectedAirport}
          closureStartTime={closureStartTime}
          closureDuration={closureDuration}
          onSelectAirport={(id) => setSelectedAirport(id)}
          onChangeStartTime={(time) => setClosureStartTime(time)}
          onChangeDuration={(mins) => setClosureDuration(mins)}
          onRunSimulation={handleRunSimulation}
          onReset={handleReset}
          isRunning={false}
        />

        {/* 3. Key Performance Indicators (KPIs) */}
        <KpiCards
          kpis={activeResult.kpis}
          delta={comparisonResult?.delta || null}
          isRecoveryActive={hasRecoveries}
        />

        {/* 4. Tab Navigation */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-cyan-900/40 pb-2">
          <div className="flex items-center gap-1.5 bg-[#081024] p-1 rounded-xl border border-cyan-900/40">
            <button
              onClick={() => setActiveTab('NETWORK')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-mono font-semibold transition-all ${
                activeTab === 'NETWORK'
                  ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-md shadow-cyan-950/60'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Plane className="w-3.5 h-3.5" />
              <span>Route Radar & Manifest</span>
            </button>

            <button
              onClick={() => setActiveTab('CONNECTIONS')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-mono font-semibold transition-all ${
                activeTab === 'CONNECTIONS'
                  ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-md shadow-cyan-950/60'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <GitBranch className="w-3.5 h-3.5" />
              <span>Passenger Connections ({activeResult.kpis.broken_connections} broken)</span>
            </button>

            <button
              onClick={() => setActiveTab('CREW')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-mono font-semibold transition-all ${
                activeTab === 'CREW'
                  ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-md shadow-cyan-950/60'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>Crew Duty Monitoring ({activeResult.kpis.crew_duty_violations + activeResult.kpis.crew_duty_warnings} alerts)</span>
            </button>

            <button
              onClick={() => setActiveTab('RECOVERY')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-mono font-semibold transition-all ${
                activeTab === 'RECOVERY'
                  ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-md shadow-cyan-950/60'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Recovery Strategies {hasRecoveries && `(${swaps.length + cancellations.length})`}</span>
            </button>

            <button
              onClick={() => setActiveTab('COMPARISON')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-mono font-semibold transition-all ${
                activeTab === 'COMPARISON'
                  ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-md shadow-cyan-950/60'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span>Before & After Matrix</span>
            </button>

            <button
              onClick={() => setActiveTab('AI')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-mono font-semibold transition-all ${
                activeTab === 'AI'
                  ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md shadow-purple-950/60'
                  : 'text-purple-300 hover:text-white'
              }`}
            >
              <Bot className="w-3.5 h-3.5" />
              <span>AI Operations Copilot</span>
            </button>
          </div>

          <div className="text-xs font-mono text-slate-400">
            Network Status: <span className="text-cyan-300 font-semibold">{activeResult.kpis.delayed_flights} Delayed</span> • <span className="text-rose-400 font-semibold">{activeResult.kpis.broken_connections} Broken CX</span>
          </div>
        </div>

        {/* 5. Tab Content Panes */}
        {activeTab === 'NETWORK' && (
          <div className="space-y-6">
            <NetworkVisualization
              airports={dataset.airports}
              flights={activeResult.flights}
              selectedAirport={isSimulated ? selectedAirport : null}
              onSelectAirport={(id) => {
                if (id) {
                  setSelectedAirport(id);
                  setIsSimulated(true);
                } else {
                  setIsSimulated(false);
                }
              }}
            />

            <FlightTable
              flights={activeResult.flights}
              airports={dataset.airports}
              onOpenSwapModal={(flight) => {
                setActiveTab('RECOVERY');
              }}
              onCancelFlight={(flightId) => {
                handleApplyCancellation(flightId);
              }}
            />
          </div>
        )}

        {activeTab === 'CONNECTIONS' && (
          <PassengerConnections connections={activeResult.connections} />
        )}

        {activeTab === 'CREW' && (
          <CrewDutyMonitoring crews={activeResult.crews} />
        )}

        {activeTab === 'RECOVERY' && (
          <div className="space-y-6">
            <RecoveryPanel
              flights={activeResult.flights}
              spareAircraft={dataset.spare_aircraft}
              currentParams={activeParams}
              onApplySwap={handleApplySwap}
              onApplyCancellation={handleApplyCancellation}
              onUndoSwap={handleUndoSwap}
              onUndoCancellation={handleUndoCancellation}
              onResetAllRecoveries={handleResetAllRecoveries}
            />

            {hasRecoveries && comparisonResult && (
              <BeforeAfterComparison
                comparison={comparisonResult}
                beforeFlights={baselineResult.flights}
                afterFlights={activeResult.flights}
              />
            )}
          </div>
        )}

        {activeTab === 'COMPARISON' && (
          <div>
            {hasRecoveries && comparisonResult ? (
              <BeforeAfterComparison
                comparison={comparisonResult}
                beforeFlights={baselineResult.flights}
                afterFlights={activeResult.flights}
              />
            ) : (
              <div className="bg-[#0b152d]/90 border border-cyan-900/40 rounded-xl p-8 text-center backdrop-blur-md space-y-4">
                <BarChart3 className="w-12 h-12 text-cyan-500/40 mx-auto" />
                <div>
                  <h3 className="text-base font-semibold text-white font-mono">
                    No Active Recovery Strategy Applied Yet
                  </h3>
                  <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
                    To compare operations before and after recovery, apply a Spare Aircraft Swap or Flight Cancellation in the Recovery Center.
                  </p>
                </div>
                <button
                  onClick={() => {
                    // Apply sample recovery: Swap VT-DS18 on DS1204
                    handleApplySwap('DS1204', 'VT-DS18');
                  }}
                  className="px-4 py-2 rounded-lg bg-gradient-to-r from-cyan-600 to-blue-600 text-white text-xs font-mono font-bold hover:scale-105 transition-all shadow-lg shadow-cyan-950/60"
                >
                  Quick Test: Swap Spare VT-DS18 on DS1204 @ DEL
                </button>
              </div>
            )}
          </div>
        )}

        {activeTab === 'AI' && (
          <AiAssistant
            simulationResult={activeResult}
            comparisonResult={comparisonResult}
            hasGeminiKey={hasGeminiKey}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-cyan-950/80 bg-[#040813] py-4 px-6 text-center text-xs font-mono text-slate-500">
        <p>DOMINO SKY • Airline Disruption Cascade & Recovery Simulator • PromptWars 2026 Challenge</p>
        <p className="text-[10px] mt-0.5 text-slate-600">
          Deterministic Simulation Engine • Real Flight Schedule Manifest • DGCA Duty Rules • Google Gemini Integration
        </p>
      </footer>
    </div>
  );
};

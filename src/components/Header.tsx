import React, { useState, useEffect } from 'react';
import { Plane, Radio, ShieldAlert, Sparkles, Clock, RefreshCw } from 'lucide-react';

interface HeaderProps {
  simulationStatus: 'IDLE' | 'SIMULATED' | 'RECOVERED';
  hasGeminiKey: boolean;
  onApplyDemoScenario: () => void;
  onReset: () => void;
  simulatedTimeStr: string;
}

export const Header: React.FC<HeaderProps> = ({
  simulationStatus,
  hasGeminiKey,
  onApplyDemoScenario,
  onReset,
  simulatedTimeStr,
}) => {
  const [currentTime, setCurrentTime] = useState<string>('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString('en-IN', {
          timeZone: 'Asia/Kolkata',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: false,
        }) + ' IST'
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="border-b border-cyan-900/30 bg-[#070e1e]/90 backdrop-blur-md sticky top-0 z-40 px-4 lg:px-8 py-3 transition-all">
      <div className="max-w-[1700px] mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Left: Brand & Title */}
        <div className="flex items-center gap-3.5">
          <div className="relative flex items-center justify-center w-11 h-11 rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-600/20 border border-cyan-500/40 shadow-lg shadow-cyan-950/60">
            <Plane className="w-6 h-6 text-cyan-400 -rotate-45" />
            <span className="absolute -top-1 -right-1 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-cyan-500"></span>
            </span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold tracking-wider text-white font-mono flex items-center gap-1.5">
                DOMINO<span className="text-cyan-400 font-extrabold">SKY</span>
              </h1>
              <span className="text-[10px] font-mono tracking-widest px-2 py-0.5 rounded bg-cyan-950/80 text-cyan-300 border border-cyan-800/60">
                PROMPTWARS 2026
              </span>
            </div>
            <p className="text-xs text-slate-400 flex items-center gap-1.5">
              <Radio className="w-3 h-3 text-cyan-500 animate-pulse" />
              Flight Disruption Cascade & Recovery Simulator • Airline OCC
            </p>
          </div>
        </div>

        {/* Center: System Status & Time */}
        <div className="flex items-center gap-4 bg-navy-900/90 border border-cyan-900/40 rounded-lg px-4 py-1.5 shadow-inner">
          <div className="flex items-center gap-2 border-r border-slate-700/60 pr-4">
            <span className="text-[11px] uppercase tracking-wider text-slate-400">Status</span>
            <span
              className={`px-2 py-0.5 rounded text-xs font-mono font-semibold flex items-center gap-1.5 ${
                simulationStatus === 'IDLE'
                  ? 'bg-slate-800 text-slate-300 border border-slate-700'
                  : simulationStatus === 'SIMULATED'
                  ? 'bg-amber-950/80 text-amber-300 border border-amber-600/50 glow-amber'
                  : 'bg-emerald-950/80 text-emerald-300 border border-emerald-600/50 glow-emerald'
              }`}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  simulationStatus === 'IDLE'
                    ? 'bg-slate-400'
                    : simulationStatus === 'SIMULATED'
                    ? 'bg-amber-400 animate-ping'
                    : 'bg-emerald-400'
                }`}
              />
              {simulationStatus === 'IDLE'
                ? 'STANDBY'
                : simulationStatus === 'SIMULATED'
                ? 'DISRUPTION ACTIVE'
                : 'RECOVERY APPLIED'}
            </span>
          </div>

          <div className="flex items-center gap-2 border-r border-slate-700/60 pr-4">
            <Clock className="w-3.5 h-3.5 text-cyan-400" />
            <span className="text-[11px] text-slate-400">Sim Timeline:</span>
            <span className="text-xs font-mono text-cyan-300 font-semibold">{simulatedTimeStr}</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11px] text-slate-400">Live Clock:</span>
            <span className="text-xs font-mono text-slate-200">{currentTime || '11:15 IST'}</span>
          </div>
        </div>

        {/* Right: Quick Demo Preset & AI Status */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={onApplyDemoScenario}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-xs font-semibold shadow-md shadow-cyan-950/50 border border-cyan-400/40 transition-all hover:scale-[1.02] active:scale-[0.98]"
            title="Load Hackathon Example Scenario: BOM closure 07:30 for 90 minutes"
          >
            <ShieldAlert className="w-3.5 h-3.5 text-white" />
            <span>Load Demo (BOM 07:30)</span>
          </button>

          <button
            onClick={onReset}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-750 text-slate-300 hover:text-white text-xs border border-slate-700 transition-all"
            title="Reset Simulation to Normal Schedule"
          >
            <RefreshCw className="w-3 h-3" />
            <span>Reset</span>
          </button>

          <div
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-mono border ${
              hasGeminiKey
                ? 'bg-purple-950/40 text-purple-300 border-purple-800/60'
                : 'bg-cyan-950/40 text-cyan-300 border-cyan-800/60'
            }`}
          >
            <Sparkles className="w-3 h-3 text-cyan-400" />
            <span>{hasGeminiKey ? 'Gemini AI Online' : 'Engine AI Mode'}</span>
          </div>
        </div>
      </div>
    </header>
  );
};

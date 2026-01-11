
import React from 'react';
import { PredictionModel } from '../../utils/adaptiveLogic';

interface QueueStats {
    isBuffering: boolean;
    lastBufferDuration: number;
    processing: number;
    outQueue: number;
    confirmedHandshakes: number;
    efficiencyRatio: number;
    modelDiagnostics: PredictionModel;
    bufferGap: number;
}

interface RealtimeDiagnosticsProps {
    queueStats: QueueStats;
    currentPlaybackRate: number;
    currentLatency: number;
    debugMode: boolean;
    setDebugMode: (val: boolean) => void;
    triggerTestTone: () => void; // NEW PROP
}

const RealtimeDiagnostics: React.FC<RealtimeDiagnosticsProps> = ({
    queueStats,
    currentPlaybackRate,
    currentLatency,
    debugMode,
    setDebugMode,
    triggerTestTone
}) => {
  const model = queueStats.modelDiagnostics;

  // Calculate speed level for UI
  let speedLevel = 1; 
  let speedLabel = "Synkad";
  
  if (currentPlaybackRate < 0.98) {
      speedLevel = 0;
      speedLabel = "Buffrar";
  } else if (currentPlaybackRate < 1.01) {
      speedLevel = 1;
      speedLabel = "Synkad";
  } else if (currentPlaybackRate < 1.04) {
      speedLevel = 2;
      speedLabel = "Justerar";
  } else {
      speedLevel = 3;
      speedLabel = "Ikappkörning";
  }

  return (
    <div className="space-y-3">
        <div className="flex justify-between items-center">
        <h4 className="text-xs font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
            Realtidsdata
        </h4>
        
        <div className="flex gap-2">
            <button 
                onClick={triggerTestTone}
                className="text-[10px] px-2 py-1 rounded border bg-purple-600 border-purple-500 text-white hover:bg-purple-500 transition-colors"
                title="Skicka en artificiell ton för att testa kedjan"
            >
                SIMULERA INPUT
            </button>
            <button 
                onClick={() => setDebugMode(!debugMode)}
                className={`text-[10px] px-2 py-1 rounded border transition-colors ${debugMode ? 'bg-indigo-600 border-indigo-500 text-white' : 'bg-slate-800 border-slate-600 text-slate-400'}`}
            >
                {debugMode ? 'DEBUG PÅ' : 'DEBUG AV'}
            </button>
        </div>
        </div>
        
        {/* SPEEDOMETER UI */}
        <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 mb-3">
            <div className="flex justify-between items-end mb-2">
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Buffert-synkronisering</span>
                <span className={`text-sm font-mono font-bold ${
                    speedLevel === 3 ? 'text-yellow-400 animate-pulse' : 
                    speedLevel === 0 ? 'text-blue-400' : 'text-green-400'
                }`}>
                    {speedLabel} ({currentPlaybackRate.toFixed(2)}x)
                </span>
            </div>
            
            <div className="flex gap-1 h-2 w-full">
                <div className={`flex-1 rounded-l-full transition-all duration-300 ${speedLevel === 0 ? 'bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]' : 'bg-slate-800'}`}></div>
                <div className={`flex-1 transition-all duration-300 ${speedLevel >= 1 ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]' : 'bg-slate-800'}`}></div>
                <div className={`flex-1 transition-all duration-300 ${speedLevel >= 2 ? 'bg-green-400' : 'bg-slate-800'}`}></div>
                <div className={`flex-1 rounded-r-full transition-all duration-300 ${speedLevel === 3 ? 'bg-yellow-400 shadow-[0_0_8px_rgba(250,204,21,0.5)]' : 'bg-slate-800'}`}></div>
            </div>
        </div>

        {/* METRICS GRID */}
        <div className="grid grid-cols-2 gap-3 mb-3 text-xs">
            <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                <div className="text-slate-500 text-[10px] font-bold mb-1">LATENS (FIXED)</div>
                <div className="font-mono text-white text-lg">{Math.round(model.fixedOverhead)} ms</div>
            </div>
            <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                    <div className="text-slate-500 text-[10px] font-bold mb-1">BUFFER GAP</div>
                    <div className={`font-mono text-lg transition-colors ${Math.abs(queueStats.bufferGap) > 0.2 ? 'text-yellow-400' : 'text-slate-400'}`}>
                    {(queueStats.bufferGap > 0 ? "+" : "") + queueStats.bufferGap.toFixed(2)}s
                    </div>
            </div>
             <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 col-span-2 flex justify-between items-center">
                <div className="text-slate-500 text-[10px] font-bold">SENASTE SVARSTID</div>
                <div className="font-mono text-white text-lg">{currentLatency.toFixed(2)} s</div>
            </div>
        </div>

        <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 grid grid-cols-3 gap-2 text-center">
            <div>
                <div className="text-[9px] text-slate-500 font-bold">BUFFERT</div>
                <div className={`text-sm font-mono font-bold mt-1 ${queueStats.isBuffering ? 'text-yellow-400 animate-pulse' : 'text-slate-600'}`}>
                    {queueStats.isBuffering ? "AKTIV" : "TOM"}
                </div>
            </div>
                <div className="border-l border-slate-800 pl-2">
                <div className="text-[9px] text-slate-500 font-bold">PAKET</div>
                <div className="text-purple-400 font-mono text-sm font-bold mt-1">{(queueStats.lastBufferDuration / 1000).toFixed(1)} s</div>
            </div>
                <div className="border-l border-slate-800 pl-2">
                <div className="text-[9px] text-slate-500 font-bold">EFFEKTIVITET</div>
                <div className={`text-sm font-mono font-bold mt-1 ${queueStats.efficiencyRatio >= 90 ? 'text-green-400' : 'text-yellow-400'}`}>
                    {queueStats.efficiencyRatio}%
                </div>
            </div>
        </div>
    </div>
  );
};

export default RealtimeDiagnostics;

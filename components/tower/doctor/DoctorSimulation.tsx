
import React from 'react';

interface SimulationResult {
    rtt: number;
    total: number;
    rating: string;
}

interface DoctorSimulationProps {
    status: 'idle' | 'running' | 'success' | 'fail';
    result: SimulationResult | null;
    lastLog: string | null;
    onRun: () => void;
    onCopyReport: () => void;
}

const DoctorSimulation: React.FC<DoctorSimulationProps> = ({ status, result, lastLog, onRun, onCopyReport }) => {
    return (
        <div className="flex-1 flex flex-col p-4 overflow-y-auto">
            <div className="flex flex-col items-center justify-center py-6 space-y-6">
                
                {/* LAB FLASK VISUALIZATION */}
                <div className="relative">
                    <div className="relative w-24 h-32 border-2 border-white/20 rounded-b-3xl rounded-t-lg mx-auto flex items-end justify-center overflow-hidden bg-slate-800/30 backdrop-blur-sm z-10">
                        <div className={`absolute bottom-0 w-full transition-all duration-1000 ${
                            status === 'running' ? 'h-full bg-purple-500/50 animate-pulse' : 
                            status === 'success' ? 'h-full bg-green-500/50' : 
                            status === 'fail' ? 'h-1/4 bg-red-500/50' : 'h-0'
                        }`}></div>
                        
                        <div className="absolute top-2 left-1/2 -translate-x-1/2 text-4xl drop-shadow-md">
                            {status === 'running' ? '⚡' : status === 'success' ? '✅' : status === 'fail' ? '⚠️' : '🧪'}
                        </div>
                    </div>
                    {/* Glow effect behind flask */}
                    <div className={`absolute inset-0 rounded-full blur-2xl -z-0 opacity-20 ${
                        status === 'running' ? 'bg-purple-500' :
                        status === 'success' ? 'bg-green-500' :
                        status === 'fail' ? 'bg-red-500' : 'bg-transparent'
                    }`}></div>
                </div>

                {/* RESULT DISPLAY */}
                {result && (
                    <div className="text-center w-full animate-in zoom-in slide-in-from-bottom-2">
                        <div className="text-6xl font-black text-white mb-2 shadow-text">{result.rating}</div>
                        <div className="grid grid-cols-2 gap-2 text-xs font-mono w-full max-w-[200px] mx-auto">
                            <div className="bg-slate-800 p-2 rounded border border-slate-700">
                                <div className="text-slate-500">RTT</div>
                                <div className="text-white font-bold">{result.rtt}ms</div>
                            </div>
                            <div className="bg-slate-800 p-2 rounded border border-slate-700">
                                <div className="text-slate-500">TOTAL</div>
                                <div className="text-white font-bold">{result.total}ms</div>
                            </div>
                        </div>
                    </div>
                )}

                {/* LIVE LOG FEEDBACK */}
                <div className="w-full max-w-xs bg-black/40 rounded border border-slate-800 p-2 min-h-[40px] flex items-center justify-center text-center">
                    <p className="text-[10px] font-mono text-slate-400 break-words leading-tight">
                        {lastLog ? lastLog.replace(/\[.*?\] /, '') : "Väntar på start..."}
                    </p>
                </div>

                {/* ACTION BUTTONS */}
                <div className="w-full max-w-xs space-y-2">
                    <button 
                        onClick={onRun}
                        disabled={status === 'running'}
                        className="w-full bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white font-bold py-3 rounded-lg shadow-lg shadow-purple-500/30 transition-all flex items-center justify-center gap-2"
                    >
                        {status === 'running' ? (
                            <>
                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                <span>Simulerar...</span>
                            </>
                        ) : (
                            <span>{status === 'fail' ? "Försök Igen" : "Starta Labb-test"}</span>
                        )}
                    </button>

                    <button 
                        onClick={onCopyReport}
                        className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded border border-slate-600 flex items-center justify-center gap-2 transition-colors"
                    >
                        📋 Kopiera Rapport
                    </button>
                </div>
                
                {/* METHOD EXPLANATION */}
                <div className="mt-4 bg-slate-900/50 p-3 rounded border border-slate-800 text-[10px] text-slate-400 leading-relaxed max-w-xs">
                    <strong className="block text-slate-300 mb-1">Metodbeskrivning:</strong>
                    1. <strong>Injicera:</strong> Appen skapar en ljudfil med texten "Systemcheck ett två tre".<br/>
                    2. <strong>VAD-check:</strong> Vi verifierar att mikrofon-logiken "hör" ljudet.<br/>
                    3. <strong>Ping:</strong> Ljudet skickas till Google. Vi mäter tiden tills vi får ett svar (text/ljud) tillbaka.<br/>
                    <br/>
                    <em>Detta utesluter fel på mikrofonen och testar hela kedjan.</em>
                </div>
            </div>
        </div>
    );
};

export default DoctorSimulation;

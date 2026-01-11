
import React from 'react';

interface TowerMaintenanceProps {
    onClose: () => void;
}

const TowerMaintenance: React.FC<TowerMaintenanceProps> = ({ onClose }) => {
    return (
        <div className="w-[350px] bg-slate-900/95 backdrop-blur-xl border border-emerald-500/30 rounded-xl shadow-2xl animate-in fade-in slide-in-from-bottom-4 flex flex-col font-sans overflow-hidden shrink-0 max-h-[70vh]">
            
            {/* HEADER */}
            <div className="bg-slate-800/80 p-4 flex justify-between items-center border-b border-emerald-500/30 shrink-0">
                <div className="flex items-center gap-3">
                    <div className="bg-emerald-500/20 p-2 rounded-lg border border-emerald-500/30">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                        </svg>
                    </div>
                    <div>
                        <h2 className="font-bold text-white text-sm tracking-wide uppercase">Systemunderhåll</h2>
                        <p className="text-[10px] text-slate-400">Hälsa, Minne & Resurser</p>
                    </div>
                </div>
                <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors bg-slate-700/50 hover:bg-slate-700 p-2 rounded-lg">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
            </div>

            {/* SCROLLABLE CONTENT */}
            <div className="flex-1 overflow-y-auto p-4 scrollbar-hide space-y-6">
                
                {/* SECTION 1: CRITICAL RESOURCES */}
                <section>
                    <h4 className="text-[10px] font-bold text-red-400 uppercase tracking-widest mb-2 border-b border-red-500/20 pb-1">
                        1. Minnesläckage & Resurser
                    </h4>
                    <div className="bg-slate-950/50 p-3 rounded-lg border border-red-500/10 text-[10px] text-slate-400 space-y-2">
                        <p className="leading-relaxed">
                            För att appen ska vara stabil under långa sessioner (1h+) måste följande strikt efterlevas i koden:
                        </p>
                        <ul className="list-disc list-inside space-y-1 ml-1 text-slate-300">
                            <li>
                                <strong className="text-red-300">AudioContext:</strong> Måste stängas med <code>.close()</code> vid unmount. Webbläsare har en hård gräns (ofta 6 st).
                            </li>
                            <li>
                                <strong className="text-red-300">Blob URLs:</strong> Kartor och ljud som använder <code>createObjectURL</code> måste rensas med <code>revokeObjectURL</code>.
                            </li>
                            <li>
                                <strong className="text-red-300">ONNX Sessioner:</strong> VAD-modellen körs i WebAssembly. Minnet frigörs inte automatiskt av JS Garbage Collector. Kräv <code>session.release()</code>.
                            </li>
                        </ul>
                    </div>
                </section>

                {/* SECTION 2: AI COMMANDS */}
                <section>
                    <h4 className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest mb-2 border-b border-indigo-500/20 pb-1">
                        2. Kommandon till Utvecklaren (AI)
                    </h4>
                    <p className="text-[10px] text-slate-500 mb-2">
                        Använd dessa prompts om systemet börjar bete sig instabilt:
                    </p>

                    <div className="space-y-3">
                        <div className="bg-slate-800/50 p-2 rounded border border-slate-700">
                            <div className="text-[9px] font-bold text-slate-400 mb-1">PRESTANDA-CHECK</div>
                            <code className="block bg-black/30 p-2 rounded text-[9px] text-green-400 font-mono border border-white/5 select-all">
                                "Analysera 'Tower.tsx' och 'SubtitleOverlay.tsx'. Sker det onödiga omritningar (re-renders)? Används useMemo korrekt för ljuddata?"
                            </code>
                        </div>

                        <div className="bg-slate-800/50 p-2 rounded border border-slate-700">
                            <div className="text-[9px] font-bold text-slate-400 mb-1">RACE CONDITIONS</div>
                            <code className="block bg-black/30 p-2 rounded text-[9px] text-green-400 font-mono border border-white/5 select-all">
                                "Granska 'useGeminiSession'. Finns det risk att vi försöker skicka data via en stängd WebSocket om nätverket svajar?"
                            </code>
                        </div>

                        <div className="bg-slate-800/50 p-2 rounded border border-slate-700">
                            <div className="text-[9px] font-bold text-slate-400 mb-1">IOS / SAFARI</div>
                            <code className="block bg-black/30 p-2 rounded text-[9px] text-green-400 font-mono border border-white/5 select-all">
                                "Kolla initieringen av AudioContext. Hanterar vi 'suspended' state korrekt vid första användarinteraktion?"
                            </code>
                        </div>
                    </div>
                </section>

                {/* SECTION 3: STATUS */}
                <section>
                    <div className="mt-4 p-3 bg-emerald-900/10 border border-emerald-500/20 rounded text-[10px] text-emerald-300 text-center">
                        <span className="block font-bold mb-1">SYSTEMSTATUS: STABIL</span>
                        Inga kända minnesläckor i nuvarande version (v4.3).
                    </div>
                </section>

            </div>
        </div>
    );
};

export default TowerMaintenance;


import React from 'react';

const MaintenanceGuide: React.FC = () => {
  return (
    <div className="space-y-4 pt-6 border-t border-slate-800">
        <h4 className="text-sm font-bold text-white flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg>
            Underhållsmanual & Hälsa
        </h4>
        
        <div className="grid grid-cols-1 gap-4 text-xs text-slate-400">
            
            {/* MINNESLÄCKAGE & RESURSER */}
            <div className="bg-slate-950/50 p-3 rounded-lg border border-red-500/20">
                <strong className="text-red-400 block mb-2 uppercase tracking-wide">1. Kritisk Resurshantering</strong>
                <ul className="list-disc list-inside space-y-1.5 ml-1">
                    <li>
                        <span className="text-slate-300">Bilder/Blobs:</span> Använd alltid <code>URL.revokeObjectURL()</code> vid unmount (t.ex. i kartan).
                    </li>
                    <li>
                        <span className="text-slate-300">AudioContext:</span> Måste stängas explicit med <code>.close()</code> när komponenter dör för att inte slå i webbläsarens gräns (max 6).
                    </li>
                    <li>
                        <span className="text-slate-300">VAD/ONNX:</span> AI-modeller måste rensas med <code>.release()</code> för att frigöra WASM-minne.
                    </li>
                    <li>
                        <span className="text-slate-300">Timers:</span> Alla <code>setInterval</code> och <code>setTimeout</code> måste rensas i <code>useEffect cleanup</code>.
                    </li>
                </ul>
            </div>

            {/* AI PROMPTS */}
            <div className="bg-slate-950/50 p-3 rounded-lg border border-indigo-500/20">
                <strong className="text-indigo-400 block mb-2 uppercase tracking-wide">2. Kommandon till AI-utvecklaren</strong>
                <p className="mb-3 text-[10px]">Kopiera dessa och ge till mig (AI) med jämna mellanrum för att hålla koden frisk:</p>
                
                <div className="space-y-3">
                    <div>
                        <div className="text-[10px] font-bold text-slate-500 mb-1">PRESTANDA-CHECK</div>
                        <code className="block bg-black/30 p-2 rounded text-[10px] text-green-400 font-mono border border-white/5 select-all">
                            "Analysera 'Tower.tsx' och 'SubtitleOverlay.tsx'. Sker det onödiga omritningar (re-renders)? Används useMemo/useCallback korrekt för högfrekvent ljuddata?"
                        </code>
                    </div>

                    <div>
                        <div className="text-[10px] font-bold text-slate-500 mb-1">RACE CONDITIONS</div>
                        <code className="block bg-black/30 p-2 rounded text-[10px] text-green-400 font-mono border border-white/5 select-all">
                            "Granska 'useGeminiSession' och 'useAudioInput'. Finns det risk att vi försöker använda en stängd WebSocket eller AudioContext om användaren trycker PÅ/AV snabbt?"
                        </code>
                    </div>

                    <div>
                        <div className="text-[10px] font-bold text-slate-500 mb-1">WEBBLÄSAR-KOMPATIBILITET</div>
                        <code className="block bg-black/30 p-2 rounded text-[10px] text-green-400 font-mono border border-white/5 select-all">
                            "Kolla initieringen av ljudet. Är koden kompatibel med Safaris strikta policy för auto-play? Hanterar vi 'suspended' state korrekt?"
                        </code>
                    </div>
                </div>
            </div>

        </div>
    </div>
  );
};

export default MaintenanceGuide;

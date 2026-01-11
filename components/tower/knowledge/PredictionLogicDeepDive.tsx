
import React from 'react';

const PredictionLogicDeepDive: React.FC = () => {
    return (
        <section className="mb-8 animate-in fade-in slide-in-from-bottom-6 duration-500 delay-400">
            <h3 className="text-purple-400 font-bold text-xs uppercase tracking-widest mb-3 border-b border-purple-500/30 pb-1">
                5. Prediktionslogik (När vågar vi sända?)
            </h3>

            <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-800 text-slate-300 text-xs">
                <p className="mb-4 leading-relaxed">
                    Hur vet vi om Gemini tänker svara eller om den ignorerade vårt senaste paket (t.ex. pga brus)? 
                    Om vi väntar för länge på ett svar som aldrig kommer, ökar latensen. Om vi sänder för tidigt, gör vi en Barge-in.
                    Lösningen är en <strong>Adaptiv Regressionsmodell</strong>.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div className="bg-slate-950 p-3 rounded border border-slate-800">
                        <strong className="text-white block mb-2">Modellen: y = mx + c</strong>
                        <ul className="space-y-1 text-[10px] font-mono text-slate-400">
                            <li><span className="text-indigo-400">x</span> = Input Duration (Hur länge vi pratade)</li>
                            <li><span className="text-green-400">y</span> = RTT (Tid till svar)</li>
                            <li><span className="text-yellow-400">m</span> = Processing Rate (AI:s tankehastighet)</li>
                            <li><span className="text-blue-400">c</span> = Fixed Overhead (Nätverkslatens)</li>
                        </ul>
                    </div>
                    
                    <div className="bg-slate-950 p-3 rounded border border-slate-800">
                        <strong className="text-white block mb-2">Säkerhetsmarginal (Sigma)</strong>
                        <p className="text-[10px] text-slate-400">
                            Vi beräknar standardavvikelsen på de senaste 20 svaren. 
                            Vi lägger till <code>2 * Sigma</code> på vår gissning. 
                            Det ger oss 95% säkerhet att AI:n är klar innan vi bryter tystnaden.
                        </p>
                    </div>
                </div>

                <div className="p-3 bg-purple-900/10 border border-purple-500/20 rounded text-[11px] leading-relaxed">
                    <strong>Exempel:</strong><br/>
                    Vi skickade just en fras på 2 sekunder. Historiken säger att Gemini brukar ta 0.5x tid på sig att tänka, plus 300ms nätverk.
                    <br/><br/>
                    <code>WaitTime = (2000ms * 0.5) + 300ms + SafetyMargin</code>
                    <br/><br/>
                    Vi sätter <code>busyUntil = Now + 1300ms</code>. Om inget svar kommit då, antar vi att paketet var "skräp" och öppnar sändaren igen (Fas 1).
                </div>
            </div>
        </section>
    );
};

export default PredictionLogicDeepDive;

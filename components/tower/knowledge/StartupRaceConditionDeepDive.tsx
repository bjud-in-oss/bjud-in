
import React from 'react';

const StartupRaceConditionDeepDive: React.FC = () => {
    return (
        <section className="mb-8 animate-in fade-in slide-in-from-bottom-2 duration-500 delay-700">
            <h3 className="text-orange-400 font-bold text-xs uppercase tracking-widest mb-3 border-b border-orange-500/30 pb-1 flex items-center gap-2">
                8. Historik: Uppstartsproblemen (Race Condition & Stall)
            </h3>
            
            <div className="bg-slate-900/50 p-4 rounded-xl border border-orange-500/20 text-slate-300 text-xs space-y-6">
                
                <p className="leading-relaxed text-[11px] text-slate-400 italic">
                    Under utvecklingen av v4.0 uppstod två kritiska fel som gjorde att systemet ibland startade "tyst" eller inte alls efter en omstart. 
                    Här är den tekniska obduktionen av dessa buggar.
                </p>

                {/* PROBLEM 1: RACE CONDITION */}
                <div className="space-y-2">
                    <div className="flex gap-2 items-center">
                        <div className="bg-orange-900/30 text-orange-400 border border-orange-500/30 px-1.5 rounded text-[10px] font-bold">BUGG 1</div>
                        <strong className="text-white text-[11px]">Race Condition: "Det tysta startskottet"</strong>
                    </div>
                    
                    <div className="pl-3 border-l border-slate-700 ml-1 space-y-2">
                        <p>
                            <strong>Symptom:</strong> Användaren tryckte "PÅ". Mikrofonikonen lös grönt, Diagnosen sa "Engine Running", men <em>inget ljud skickades</em> (TX blinkade inte).
                        </p>
                        <p>
                            <strong>Orsak:</strong> Reacts <code>useState</code> är asynkront.
                            När knappen trycktes, anropades <code>initAudioInput()</code> omedelbart. 
                            Inuti ljudloopen (ScriptProcessor) fanns en säkerhetsspärr: <code>if (activeMode !== 'translate') return;</code>.
                            Eftersom React inte hunnit uppdatera variabeln <code>activeMode</code> än, trodde ljudmotorn att den fortfarande var "AV" och blockerade sig själv millisekunden efter start.
                        </p>
                        <div className="bg-green-900/20 p-2 rounded border border-green-500/20 text-[10px]">
                            <strong className="text-green-400 block mb-1">LÖSNING: "Force Active" Flagga</strong>
                            Vi skickar nu med <code>forceActive: true</code> till init-funktionen. 
                            Detta tvingar ljudmotorn att manuellt sätta en intern referens (Ref) till "PÅ" omedelbart, utan att vänta på Reacts långsamma renderingscykel.
                        </div>
                    </div>
                </div>

                {/* PROBLEM 2: ENGINE STALL */}
                <div className="space-y-2">
                    <div className="flex gap-2 items-center">
                        <div className="bg-red-900/30 text-red-400 border border-red-500/30 px-1.5 rounded text-[10px] font-bold">BUGG 2</div>
                        <strong className="text-white text-[11px]">Engine Stall: "Död vid återuppståndelse"</strong>
                    </div>
                    
                    <div className="pl-3 border-l border-slate-700 ml-1 space-y-2">
                        <p>
                            <strong>Symptom:</strong> Efter att ha tryckt "Starta Om" i menyn, kopplade WebSocket upp sig (WS: OPEN), men Diagnosen visade <code>Frames Delta: 0</code>. Systemet var hjärndött.
                        </p>
                        <p>
                            <strong>Orsak:</strong> För att spara batteri dödar <code>disconnect()</code> hela ljudmotorn (stänger AudioContext). 
                            När <code>connect()</code> sedan kördes för att återansluta nätverket, antog den att ljudmotorn fortfarande levde. 
                            Resultatet blev en öppen telefonlinje där ingen pratade.
                        </p>
                        <div className="bg-green-900/20 p-2 rounded border border-green-500/20 text-[10px]">
                            <strong className="text-green-400 block mb-1">LÖSNING: "Hjärtstartaren"</strong>
                            Vi lade till en kontroll i <code>connect()</code>. 
                            Innan vi ringer upp Google, känner vi på AudioContexts puls. 
                            Om den är <code>closed</code> eller <code>null</code>, utför vi en blixtsnabb omstart av ljudmotorn ("Heart Start") innan nätverksanropet görs.
                        </div>
                    </div>
                </div>

            </div>
        </section>
    );
};

export default StartupRaceConditionDeepDive;

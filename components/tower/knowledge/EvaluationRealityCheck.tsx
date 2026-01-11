
import React from 'react';

const EvaluationRealityCheck: React.FC = () => {
    return (
        <section className="mb-8 animate-in fade-in slide-in-from-bottom-7 duration-500 delay-500">
            <h3 className="text-pink-400 font-bold text-xs uppercase tracking-widest mb-3 border-b border-pink-500/30 pb-1">
                6. Utvärdering & Verklighetskoll
            </h3>

            <div className="bg-slate-900/50 p-4 rounded-xl border border-pink-500/20 text-slate-300 text-xs space-y-4">
                
                <p className="leading-relaxed">
                    Dokumentationen beskriver en idealisk "Traffic Light"-modell. Verkligheten är dock mer organisk. 
                    Här analyseras skillnaden mellan kodens intention och den fysiska verkligheten.
                </p>

                {/* THE PHASE 1 PARADOX */}
                <div className="bg-slate-950 p-3 rounded border border-slate-800">
                    <strong className="text-white block mb-2 text-sm">⚠️ "Paus-paradoxen" i Fas 1</strong>
                    <div className="text-[11px] space-y-2 text-slate-400">
                        <p>
                            <strong>Teori:</strong> Vi sänder ljud i Fas 1. När användaren tystnar (VAD trigger), går vi till Fas 2 och väntar på svar.
                        </p>
                        <p>
                            <strong>Verklighet:</strong> Om användaren bara hämtar andan i Fas 1, skickar vi "tystnad" (eller slutar skicka). 
                            Gemini tolkar denna tystnad som "Turn Complete" och börjar <em>omedelbart</em> generera tal.
                        </p>
                        <p className="text-pink-300 italic border-l-2 border-pink-500 pl-2">
                            <strong>Konsekvens:</strong> Detta skapar ett "Falskt Positivt" Fas 2-läge. 
                            Om användaren fortsätter tala efter andhämtningen, krockar deras nya tal med Geminis påbörjade svar. 
                            Detta är den vanligaste orsaken till att vi tappar synk.
                        </p>
                    </div>
                </div>

                {/* VAD SENSITIVITY */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <strong className="text-indigo-400 block mb-1">Lokal VAD vs Server VAD</strong>
                        <p className="text-[10px] text-slate-500">
                            Även om vår lokala VAD säger "Tystnad", kan serverns VAD ha en annan uppfattning beroende på bakgrundsbrus. 
                            Om vi klipper strömmen för tidigt, kan servern tolka det som ett nätverksfel snarare än en paus.
                        </p>
                    </div>
                    <div>
                        <strong className="text-indigo-400 block mb-1">Latens-gapet</strong>
                        <p className="text-[10px] text-slate-500">
                            Beräkningen av <code>busyUntil</code> bygger på historisk data. 
                            Om Gemini plötsligt svarar mycket snabbare än väntat (cache hit), kan vi råka sända ljud rakt in i hennes svar ("Input Barge-in").
                        </p>
                    </div>
                </div>

            </div>
        </section>
    );
};

export default EvaluationRealityCheck;

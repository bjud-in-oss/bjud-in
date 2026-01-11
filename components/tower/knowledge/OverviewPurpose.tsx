
import React from 'react';

const OverviewPurpose: React.FC = () => {
    return (
        <section className="mb-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
            <h3 className="text-indigo-400 font-bold text-xs uppercase tracking-widest mb-3 border-b border-indigo-500/30 pb-1 flex items-center gap-2">
                1. Syfte & Nytta i Församlingen
            </h3>
            <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-800">
                <p className="text-xs leading-relaxed mb-3 text-slate-300">
                    <strong>Mötesbryggan</strong> är skapad för att eliminera språkbarriärer i realtid under gudstjänster och möten. 
                    Traditionell tolkning kräver ofta att talaren pausar (konsekutiv tolkning) eller att tolken pratar över talaren (viskningstolkning), vilket kan vara distraherande.
                </p>
                <p className="text-xs leading-relaxed text-slate-300">
                    Genom att använda <strong>Simultanöversättning via AI</strong> möjliggör appen att:
                </p>
                <ul className="list-disc list-inside mt-2 space-y-1 text-xs text-slate-400 ml-2">
                    <li>Alla deltagare kan höra budskapet på sitt eget språk samtidigt som det talas.</li>
                    <li>Gemenskapen stärks då ingen behöver sitta utanför förståelsen.</li>
                    <li>Mötet flyter naturligt utan onödiga pauser för översättning.</li>
                </ul>
            </div>
        </section>
    );
};

export default OverviewPurpose;

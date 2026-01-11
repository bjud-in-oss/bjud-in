
import React from 'react';

const OverviewProblems: React.FC = () => {
    return (
        <section className="mb-8 animate-in fade-in slide-in-from-bottom-3 duration-500 delay-100">
            <h3 className="text-red-400 font-bold text-xs uppercase tracking-widest mb-3 border-b border-red-500/30 pb-1">
                2. Tekniska Utmaningar
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-slate-950/50 p-3 rounded border border-slate-800">
                    <strong className="text-slate-200 text-xs block mb-1">Latens (Fördröjning)</strong>
                    <p className="text-[10px] text-slate-500">Om översättningen dröjer för länge tappar lyssnaren sammanhanget. Systemet måste vara blixtsnabbt.</p>
                </div>
                <div className="bg-slate-950/50 p-3 rounded border border-slate-800">
                    <strong className="text-slate-200 text-xs block mb-1">Otydligt Tal & Brus</strong>
                    <p className="text-[10px] text-slate-500">Kyrkorum har eko, och talare mumlar eller hostar. AI:n får inte tolka hostningar som ord.</p>
                </div>
                <div className="bg-slate-950/50 p-3 rounded border border-slate-800">
                    <strong className="text-slate-200 text-xs block mb-1">"Barge-In" (Avbrott)</strong>
                    <p className="text-[10px] text-slate-500">Gemini Live är konversativ. Om vi sänder ljud medan den talar, tystnar den för att lyssna. Detta är huvudproblemet vi måste kringgå.</p>
                </div>
                <div className="bg-slate-950/50 p-3 rounded border border-slate-800">
                    <strong className="text-slate-200 text-xs block mb-1">Nätverksinstabilitet</strong>
                    <p className="text-[10px] text-slate-500">Mobilnät svajar. Appen måste kunna "hålla andan" och buffra ljud tills kontakten återupptas.</p>
                </div>
            </div>
        </section>
    );
};

export default OverviewProblems;

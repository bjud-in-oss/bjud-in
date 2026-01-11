
import React from 'react';

const SystemInstructionCard: React.FC = () => {
  return (
    <div className="space-y-3">
        <h4 className="text-xs font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>
            AI Systeminstruktion
        </h4>
        <div className="bg-slate-950 rounded-lg border border-slate-800 p-4 font-mono text-xs text-slate-400 leading-relaxed shadow-inner">
            <p className="mb-2">Instruktionen genereras dynamiskt i koden.</p>
            <p className="mb-2">För att redigera logiken och prompten, öppna filen:</p>
            <code className="block bg-slate-900 p-2 rounded text-green-400 border border-slate-700 select-all font-bold">
                utils/promptBuilder.ts
            </code>
            <p className="mt-3 text-[10px] text-slate-500 italic border-t border-slate-800 pt-2">
                (Denna fil bygger prompten baserat på valda målspråk och inställd AI-hastighet vid varje ny anslutning)
            </p>
        </div>
    </div>
  );
};

export default SystemInstructionCard;

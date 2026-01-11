
import React from 'react';
import { MODULE_DOCS } from './TowerKnowledge';

interface TowerModuleHelpProps {
    moduleKey: string;
    onClose: () => void;
}

const TowerModuleHelp: React.FC<TowerModuleHelpProps> = ({ moduleKey, onClose }) => {
    const doc = MODULE_DOCS[moduleKey];

    if (!doc) return null;

    return (
        <div className="w-72 bg-slate-900/95 backdrop-blur-xl border border-slate-600 rounded-xl shadow-2xl animate-in fade-in slide-in-from-left-4 flex flex-col font-sans overflow-hidden shrink-0 max-h-[70vh]">
            
            {/* HEADER */}
            <div className="bg-slate-800/80 p-4 flex justify-between items-start border-b border-slate-600 shrink-0">
                <div>
                    <h3 className="font-bold text-white text-xs">{doc.title}</h3>
                    <div className="text-[9px] text-slate-400 mt-0.5">Modulbeskrivning</div>
                </div>
                <button 
                    onClick={onClose} 
                    className="text-slate-500 hover:text-white p-1 hover:bg-slate-700 rounded transition-colors"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
            </div>

            {/* SCROLLABLE CONTENT */}
            <div className="flex-1 overflow-y-auto p-4 scrollbar-hide">
                <p className="text-[11px] text-slate-300 mb-4 italic leading-relaxed border-b border-slate-800 pb-4">
                    {doc.description}
                </p>
                
                <div className="space-y-3">
                    {doc.params.map(p => (
                        <div key={p.abbr} className="bg-slate-950/50 p-2.5 rounded border border-slate-800">
                            <div className="flex items-center gap-2 mb-1">
                                <span className="text-[9px] font-bold text-slate-900 font-mono bg-yellow-500 px-1 rounded shadow-sm">{p.abbr}</span>
                                <span className="text-[10px] font-bold text-white">{p.full}</span>
                            </div>
                            <p className="text-[10px] text-slate-400 leading-snug pl-1">{p.desc}</p>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default TowerModuleHelp;

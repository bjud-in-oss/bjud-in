
import React from 'react';
import { KNOWLEDGE_BASE } from './TowerKnowledge';

interface TowerInfoProps {
    selectedKey: string | null;
    onClose: () => void;
    onSelectRelation: (key: string) => void;
}

const TowerInfo: React.FC<TowerInfoProps> = ({ selectedKey, onClose, onSelectRelation }) => {
    if (!selectedKey || !KNOWLEDGE_BASE[selectedKey]) return null;
    
    const info = KNOWLEDGE_BASE[selectedKey];

    const getTagColor = (tag: string) => {
        if (tag.includes('FAS 1')) return 'bg-green-500/20 text-green-300 border-green-500/30';
        if (tag.includes('FAS 2')) return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30';
        if (tag.includes('FAS 3')) return 'bg-red-500/20 text-red-300 border-red-500/30';
        if (tag.includes('FAS 4')) return 'bg-blue-500/20 text-blue-300 border-blue-500/30';
        if (tag === 'PRED') return 'bg-purple-500/20 text-purple-300 border-purple-500/30';
        return 'bg-slate-700 text-slate-300 border-slate-600';
    };

    return (
        <div className="w-72 bg-slate-900/95 backdrop-blur-xl border border-indigo-500/50 rounded-xl shadow-2xl animate-in fade-in slide-in-from-left-4 flex flex-col font-sans overflow-hidden shrink-0 max-h-[70vh]">
            
            {/* HEADER */}
            <div className="bg-slate-800/80 p-4 flex justify-between items-start border-b border-indigo-500/30 shrink-0">
                <div>
                    <h4 className="text-indigo-400 font-bold text-xs uppercase tracking-wider">{info.title}</h4>
                    <div className="text-[9px] text-slate-500 font-mono mt-0.5">ID: {selectedKey}</div>
                </div>
                <button 
                    onClick={onClose} 
                    className="text-slate-500 hover:text-white p-1 hover:bg-slate-700 rounded transition-colors"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
            </div>

            {/* SCROLLABLE CONTENT */}
            <div className="flex-1 overflow-y-auto p-4 scrollbar-hide flex flex-col gap-4">
                
                {/* TAGS */}
                {info.tags && info.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                        {info.tags.map(tag => (
                            <span key={tag} className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${getTagColor(tag)}`}>
                                {tag}
                            </span>
                        ))}
                    </div>
                )}

                {/* DESCRIPTION */}
                <p className="text-slate-300 text-[11px] leading-relaxed">
                    {info.text}
                </p>

                {/* GOAL */}
                <div className="text-[10px] bg-slate-950/50 p-2 rounded border border-slate-800 flex justify-between items-center">
                    <span className="text-slate-400 font-bold">MÅLVÄRDE:</span>
                    <span className="text-green-400 font-mono font-bold bg-green-500/10 px-2 rounded border border-green-500/20">{info.good}</span>
                </div>

                {/* RELATIONS SECTION */}
                <div className="flex flex-col gap-3 pt-2 border-t border-slate-800/50">
                    
                    {/* AFFECTS (YELLOW) */}
                    {info.affects.length > 0 && (
                        <div className="space-y-1.5">
                            <div className="text-[9px] font-bold text-yellow-500/80 uppercase tracking-widest flex items-center gap-1">
                                <div className="w-1 h-1 rounded-full bg-yellow-500"></div>
                                Påverkar
                            </div>
                            <div className="flex flex-col gap-1.5">
                                {info.affects.map(rel => (
                                    <button 
                                        key={rel.id}
                                        onClick={() => onSelectRelation(rel.id)}
                                        className="flex items-center justify-between group w-full text-left bg-yellow-500/5 hover:bg-yellow-500/10 border border-yellow-500/10 hover:border-yellow-500/30 rounded p-2 transition-all"
                                    >
                                        <span className="text-[10px] font-mono font-bold text-yellow-400 group-hover:text-yellow-300">{rel.id}</span>
                                        <span className="text-[9px] text-slate-400 group-hover:text-slate-300">{rel.desc} →</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* AFFECTED BY (BLUE) */}
                    {info.affectedBy.length > 0 && (
                        <div className="space-y-1.5">
                            <div className="text-[9px] font-bold text-blue-400/80 uppercase tracking-widest flex items-center gap-1">
                                <div className="w-1 h-1 rounded-full bg-blue-400"></div>
                                Påverkas Av
                            </div>
                            <div className="flex flex-col gap-1.5">
                                {info.affectedBy.map(rel => (
                                    <button 
                                        key={rel.id}
                                        onClick={() => onSelectRelation(rel.id)}
                                        className="flex items-center justify-between group w-full text-left bg-blue-500/5 hover:bg-blue-500/10 border border-blue-500/10 hover:border-blue-500/30 rounded p-2 transition-all"
                                    >
                                        <span className="text-[10px] font-mono font-bold text-blue-400 group-hover:text-blue-300">{rel.id}</span>
                                        <span className="text-[9px] text-slate-400 group-hover:text-slate-300">← {rel.desc}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default TowerInfo;


import React, { forwardRef } from 'react';

export interface TowerPhasesRefs {
    p1: HTMLDivElement | null;
    p2: HTMLDivElement | null;
    p3: HTMLDivElement | null;
    p4: HTMLDivElement | null;
}

const TowerPhases = forwardRef<TowerPhasesRefs, {}>((props, ref) => {
    
    const setRef = (key: keyof TowerPhasesRefs) => (el: any) => {
        if (ref && typeof ref === 'object' && ref.current) {
            ref.current[key] = el;
        }
    };

    const PhaseBox = ({ id, label, rKey, color }: { id: string, label: string, rKey: keyof TowerPhasesRefs, color: string }) => (
        <div ref={setRef(rKey)} className="relative flex flex-col items-center justify-center p-3 rounded-lg border border-slate-800 bg-slate-900/80 transition-all duration-150 grayscale opacity-50">
            <div className={`text-[10px] font-bold ${color} mb-1`}>{id}</div>
            <div className="text-[8px] text-slate-400 text-center uppercase tracking-wide leading-tight">{label}</div>
            
            {/* GLOW EFFECT (Hidden by default) */}
            <div className={`absolute inset-0 rounded-lg ring-2 ring-offset-0 ring-transparent transition-all duration-75 pointer-events-none active-ring`}></div>
        </div>
    );

    return (
        <div className="bg-slate-900/95 backdrop-blur-md border border-slate-700 rounded-lg shadow-2xl overflow-hidden animate-in fade-in slide-in-from-left-4 w-72 flex flex-col shrink-0">
            
            {/* HEADER */}
            <div className="bg-slate-800/80 px-4 py-2 border-b border-slate-700">
                <span className="font-bold text-white text-xs uppercase tracking-widest">Micro-Turns Protokoll</span>
            </div>

            {/* FLOWCHART */}
            <div className="p-4 grid grid-cols-2 gap-4">
                
                {/* PHASE 1 */}
                <PhaseBox id="FAS 1" label="Sänder (Talk)" rKey="p1" color="text-green-400" />
                
                {/* PHASE 2 */}
                <PhaseBox id="FAS 2" label="Handskakning" rKey="p2" color="text-yellow-400" />
                
                {/* ARROWS (Visual Only) */}
                <div className="col-span-2 flex justify-center h-4 relative">
                    <div className="absolute top-0 w-[1px] h-full bg-slate-700 left-1/4"></div>
                    <div className="absolute top-0 w-[1px] h-full bg-slate-700 right-1/4"></div>
                    <div className="absolute top-1/2 w-1/2 h-[1px] bg-slate-700"></div>
                </div>

                {/* PHASE 3 */}
                <PhaseBox id="FAS 3" label="Bearbetar (Think)" rKey="p3" color="text-purple-400" />

                {/* PHASE 4 */}
                <PhaseBox id="FAS 4" label="Burst (Play)" rKey="p4" color="text-blue-400" />

            </div>

            {/* LEGEND */}
            <div className="px-4 py-2 bg-slate-950/50 border-t border-slate-800 text-[9px] text-slate-500 font-mono">
                P1: Mic &rarr; Cloud <br/>
                P2: Turn Complete (VAD) <br/>
                P3: Prediction Wait <br/>
                P4: Cloud &rarr; Speaker
            </div>
        </div>
    );
});

export default TowerPhases;

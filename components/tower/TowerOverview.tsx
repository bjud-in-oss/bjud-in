
import React from 'react';
import OverviewPurpose from './knowledge/OverviewPurpose';
import OverviewProblems from './knowledge/OverviewProblems';
import OverviewArchitecture from './knowledge/OverviewArchitecture';
import BargeInDeepDive from './knowledge/BargeInDeepDive';
import PredictionLogicDeepDive from './knowledge/PredictionLogicDeepDive';
import EvaluationRealityCheck from './knowledge/EvaluationRealityCheck';
import FutureOptimizationPlan from './knowledge/FutureOptimizationPlan';
import StartupRaceConditionDeepDive from './knowledge/StartupRaceConditionDeepDive';

interface TowerOverviewProps {
    onClose: () => void;
}

const TowerOverview: React.FC<TowerOverviewProps> = ({ onClose }) => {
    return (
        <div className="w-[500px] bg-slate-900/95 backdrop-blur-xl border border-indigo-500/30 rounded-xl shadow-2xl animate-in fade-in slide-in-from-bottom-4 flex flex-col font-sans overflow-hidden shrink-0 max-h-[70vh]">
            
            {/* HEADER */}
            <div className="bg-slate-800/80 p-4 flex justify-between items-center border-b border-indigo-500/30 shrink-0">
                <div className="flex items-center gap-3">
                    <div className="bg-indigo-500/20 p-2 rounded-lg border border-indigo-500/30">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                        </svg>
                    </div>
                    <div>
                        <h2 className="font-bold text-white text-sm tracking-wide uppercase">Systemdokumentation</h2>
                        <p className="text-[10px] text-slate-400">Arkitektur, Logik & Optimering</p>
                    </div>
                </div>
                <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors bg-slate-700/50 hover:bg-slate-700 p-2 rounded-lg">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
            </div>

            {/* SCROLLABLE CONTENT */}
            <div className="flex-1 overflow-y-auto p-6 scrollbar-hide">
                <OverviewPurpose />
                <OverviewProblems />
                <OverviewArchitecture />
                <BargeInDeepDive />
                <PredictionLogicDeepDive />
                <EvaluationRealityCheck />
                <FutureOptimizationPlan />
                <StartupRaceConditionDeepDive />
                
                <div className="mt-8 pt-6 border-t border-slate-800 text-center text-[10px] text-slate-600">
                    Systemarkitektur v4.4 | Genererad för Dr. Tower Optimization Suite
                </div>
            </div>
        </div>
    );
};

export default TowerOverview;

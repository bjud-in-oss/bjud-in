
import React, { forwardRef } from 'react';
import { LayerProps } from './types';
import LogicGraph from './logic/LogicGraph';
import LogicMetrics, { LogicMetricsRefs } from './logic/LogicMetrics';

// Combine the Refs
export interface LogicLayerRefs extends LogicMetricsRefs {
    canvasRef: HTMLCanvasElement | null;
}

const LogicLayer = forwardRef<LogicLayerRefs, LayerProps>(({ onExplain, onHelp }, ref) => {
    
    return (
        <div className="bg-slate-900/95 border border-slate-700 rounded overflow-hidden shadow-lg backdrop-blur mt-1">
            <div className="bg-slate-800 px-2 py-1 flex justify-between items-center border-b border-slate-700">
                <span className="font-bold text-slate-400 text-[9px]">[LOGIC_MODULE]</span>
                <button onClick={() => onHelp('MODULE_LOGIC')} className="text-slate-500 hover:text-white">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" /></svg>
                </button>
            </div>
            
            <LogicGraph ref={(el) => {
                if (ref && typeof ref === 'object' && ref.current) {
                    ref.current.canvasRef = el;
                }
            }} />

            <LogicMetrics 
                onExplain={onExplain} 
                ref={ref as React.Ref<LogicMetricsRefs>} 
            />
        </div>
    );
});

export default LogicLayer;

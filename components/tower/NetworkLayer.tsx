
import React, { forwardRef } from 'react';
import { LayerProps } from './types';

export interface NetworkLayerRefs {
    wsRef: HTMLSpanElement | null;
    keyRef: HTMLSpanElement | null;
    txRef: HTMLDivElement | null;
    rxRef: HTMLDivElement | null;
}

const NetworkLayer = forwardRef<NetworkLayerRefs, LayerProps & { isConnected: boolean }>(({ onExplain, onHelp, isConnected }, ref) => {
    
    const setRef = (key: keyof NetworkLayerRefs) => (el: any) => {
        if (ref && typeof ref === 'object' && ref.current) {
            ref.current[key] = el;
        }
    };

    return (
        <div className="bg-slate-900/95 border border-slate-700 rounded overflow-hidden shadow-lg backdrop-blur">
            <div className="bg-slate-800 px-2 py-1 flex justify-between items-center border-b border-slate-700">
                <span className="font-bold text-slate-400 text-[9px]">[NETWORK_MODULE]</span>
                <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500 animate-pulse'}`}></div>
                    <button onClick={() => onHelp('MODULE_NETWORK')} className="text-slate-500 hover:text-white">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" /></svg>
                    </button>
                </div>
            </div>
            <div className="p-2 grid grid-cols-4 gap-2 text-center">
                <div className="hover:bg-slate-800 rounded p-1 cursor-pointer" onClick={() => onExplain('KEY')}>
                    <div className="text-slate-500 text-[9px] mb-1">KEY</div>
                    <span ref={setRef('keyRef')}>...</span>
                </div>
                <div className="hover:bg-slate-800 rounded p-1 cursor-pointer" onClick={() => onExplain('WS')}>
                    <div className="text-slate-500 text-[9px] mb-1">WS</div>
                    <span ref={setRef('wsRef')} className="text-[9px]">---</span>
                </div>
                <div className="hover:bg-slate-800 rounded p-1 flex flex-col items-center cursor-pointer" onClick={() => onExplain('TX')}>
                    <div className="text-slate-500 text-[9px] mb-1">TX</div>
                    <div ref={setRef('txRef')} className="w-2.5 h-2.5 rounded-full bg-slate-800 transition-colors duration-75"></div>
                </div>
                <div className="hover:bg-slate-800 rounded p-1 flex flex-col items-center cursor-pointer" onClick={() => onExplain('RX')}>
                    <div className="text-slate-500 text-[9px] mb-1">RX</div>
                    <div ref={setRef('rxRef')} className="w-2.5 h-2.5 rounded-full bg-slate-800 transition-colors duration-75"></div>
                </div>
            </div>
        </div>
    );
});

export default NetworkLayer;

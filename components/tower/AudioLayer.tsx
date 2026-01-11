
import React, { forwardRef } from 'react';
import { LayerProps } from './types';

export interface AudioLayerRefs {
    rmsRef: HTMLSpanElement | null;
    srRef: HTMLSpanElement | null;
    ctxRef: HTMLSpanElement | null;
    framesRef: HTMLSpanElement | null;
    timeRef: HTMLSpanElement | null; // NEW: Audio Clock Ref
}

const AudioLayer = forwardRef<AudioLayerRefs, LayerProps>(({ onExplain, onHelp }, ref) => {

    const setRef = (key: keyof AudioLayerRefs) => (el: any) => {
        if (ref && typeof ref === 'object' && ref.current) {
            ref.current[key] = el;
        }
    };

    return (
        <div className="bg-slate-900/95 border border-slate-700 rounded overflow-hidden shadow-lg backdrop-blur mt-1">
            <div className="bg-slate-800 px-2 py-1 flex justify-between items-center border-b border-slate-700">
                <span className="font-bold text-slate-400 text-[9px]">[AUDIO_MODULE]</span>
                <button onClick={() => onHelp('MODULE_AUDIO')} className="text-slate-500 hover:text-white">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" /></svg>
                </button>
            </div>
            <div className="p-2 grid grid-cols-5 gap-2 text-center">
                <div className="hover:bg-slate-800 rounded p-1 cursor-pointer" onClick={() => onExplain('RMS')}>
                    <div className="text-slate-500 text-[9px]">RMS</div>
                    <span ref={setRef('rmsRef')} className="text-white font-mono text-[9px]">0.00</span>
                </div>
                <div className="hover:bg-slate-800 rounded p-1 cursor-pointer" onClick={() => onExplain('SR')}>
                    <div className="text-slate-500 text-[9px]">SR</div>
                    <span ref={setRef('srRef')} className="text-white text-[9px]">---</span>
                </div>
                <div className="hover:bg-slate-800 rounded p-1 cursor-pointer" onClick={() => onExplain('CTX')}>
                    <div className="text-slate-500 text-[9px]">CTX</div>
                    <span ref={setRef('ctxRef')} className="text-white text-[9px]">---</span>
                </div>
                <div className="hover:bg-slate-800 rounded p-1 cursor-pointer" onClick={() => onExplain('FRM')}>
                    <div className="text-slate-500 text-[9px]">FRM</div>
                    <span ref={setRef('framesRef')} className="text-white text-[9px]">0</span>
                </div>
                {/* NEW: Audio Clock Display */}
                <div className="hover:bg-slate-800 rounded p-1 cursor-pointer" onClick={() => onExplain('TIME')}>
                    <div className="text-slate-500 text-[9px]">TIME</div>
                    <span ref={setRef('timeRef')} className="text-indigo-400 font-mono text-[9px]">0.0</span>
                </div>
            </div>
        </div>
    );
});

export default AudioLayer;

import React, { useEffect, useState } from 'react';

interface TowerSettingsProps {
    aiSpeakingRate: number;
    setAiSpeakingRate: (val: number) => void;
    minTurnDuration: number;
    setMinTurnDuration: (val: number) => void;
    vadThreshold: number;
    setVadThreshold: (val: number) => void;
    silenceThreshold: number; 
    setSilenceThreshold: (val: number) => void; 
    volMultiplier: number; 
    setVolMultiplier: (val: number) => void; 
    
    // Devices (New)
    inputDeviceId?: string;
    setInputDeviceId?: (val: string) => void;
    outputDeviceId?: string;
    setOutputDeviceId?: (val: string) => void;

    debugMode: boolean;
    setDebugMode: (val: boolean) => void;
    onOpenCalibration: () => void;
    onHelp: (key: string) => void;
    highlightKey: string | null; 
    enableLogs: boolean;
    setEnableLogs: (val: boolean) => void;
    onOpenPromptModal: () => void; 
}

const TowerSettings: React.FC<TowerSettingsProps> = ({
    aiSpeakingRate,
    setAiSpeakingRate,
    minTurnDuration,
    setMinTurnDuration,
    vadThreshold,
    setVadThreshold,
    silenceThreshold,
    setSilenceThreshold,
    volMultiplier,
    setVolMultiplier,
    inputDeviceId,
    setInputDeviceId,
    outputDeviceId,
    setOutputDeviceId,
    debugMode,
    setDebugMode,
    onOpenCalibration,
    onHelp,
    highlightKey,
    enableLogs,
    setEnableLogs,
    onOpenPromptModal
}) => {
    
    const [inputDevices, setInputDevices] = useState<MediaDeviceInfo[]>([]);
    const [outputDevices, setOutputDevices] = useState<MediaDeviceInfo[]>([]);

    useEffect(() => {
        let mounted = true;
        const loadDevices = async () => {
             try {
                 const devices = await navigator.mediaDevices.enumerateDevices();
                 if (!mounted) return;
                 setInputDevices(devices.filter(d => d.kind === 'audioinput'));
                 setOutputDevices(devices.filter(d => d.kind === 'audiooutput'));
             } catch (e) { console.error(e); }
        };
        loadDevices();
        navigator.mediaDevices.addEventListener('devicechange', loadDevices);
        return () => { mounted = false; navigator.mediaDevices.removeEventListener('devicechange', loadDevices); };
    }, []);

    const getHighlight = (keys: string[]) => {
        if (!highlightKey) return '';
        if (keys.includes(highlightKey)) return 'ring-2 ring-indigo-500 bg-indigo-500/10 rounded px-1 transition-all';
        return 'opacity-50 transition-all';
    };

    return (
        <div className="bg-slate-900/95 border border-slate-700 rounded overflow-hidden shadow-lg backdrop-blur mt-1 w-full animate-in fade-in slide-in-from-bottom-2 flex flex-col max-h-[350px]">
            <div className="bg-slate-800 px-2 py-1 flex justify-between items-center border-b border-slate-700 shrink-0">
                <span className="font-bold text-slate-400 text-[9px]">[CONFIGURATION_MODULE]</span>
                <button onClick={() => onHelp('MODULE_CONFIG')} className="text-slate-500 hover:text-white">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" /></svg>
                </button>
            </div>
            
            <div className="p-3 space-y-4 overflow-y-auto scrollbar-hide flex-1">
                
                {/* TOOLS - MOVED TO TOP */}
                <div className="flex gap-2 pb-2 border-b border-slate-700/50 flex-wrap">
                    <button onClick={() => setEnableLogs(!enableLogs)} className={`flex-1 min-w-[80px] text-[9px] font-bold py-2 rounded transition-colors border ${enableLogs ? 'bg-slate-800 text-slate-400 border-slate-600 hover:bg-slate-700' : 'bg-red-900/30 text-red-300 border-red-500/50 hover:bg-red-900/50 animate-pulse'}`}>
                        {enableLogs ? "LOGGAR: PÅ" : "LOGGAR: AV"}
                    </button>
                    <button onClick={onOpenCalibration} className="flex-1 min-w-[80px] text-[9px] font-bold py-2 rounded bg-indigo-600/20 text-indigo-300 border border-indigo-500/30 hover:bg-indigo-600/30 transition-colors">
                        STARTA KALIBRERING
                    </button>
                    <button onClick={onOpenPromptModal} className="w-full text-[9px] font-bold py-2 rounded bg-slate-800 text-slate-300 border border-slate-600 hover:bg-slate-700 transition-colors flex items-center justify-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                        REDIGERA SYSTEM PROMPT
                    </button>
                </div>

                {/* DEVICES (NEW) */}
                {setInputDeviceId && setOutputDeviceId && (
                    <div className="space-y-2 pb-2 border-b border-slate-700/50">
                        <div>
                            <label className="text-[9px] font-bold text-slate-400 block mb-1">MIKROFON</label>
                            <select value={inputDeviceId} onChange={(e) => setInputDeviceId(e.target.value)} className="w-full bg-slate-800 text-white text-[9px] rounded px-2 py-1 border border-slate-600">
                                <option value="default">Default</option>
                                {inputDevices.map(d => <option key={d.deviceId} value={d.deviceId}>{d.label || d.deviceId.slice(0,5)}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="text-[9px] font-bold text-slate-400 block mb-1">HÖGTALARE</label>
                            <select value={outputDeviceId} onChange={(e) => setOutputDeviceId(e.target.value)} className="w-full bg-slate-800 text-white text-[9px] rounded px-2 py-1 border border-slate-600">
                                <option value="default">Default</option>
                                {outputDevices.map(d => <option key={d.deviceId} value={d.deviceId}>{d.label || d.deviceId.slice(0,5)}</option>)}
                            </select>
                        </div>
                    </div>
                )}

                {/* VAD THRESHOLD */}
                <div className={`space-y-1 ${getHighlight(['THR', 'VAD', 'SPK'])}`}>
                    <div className="flex justify-between items-end">
                        <label className="text-[9px] font-bold text-slate-400 uppercase">Bruskänslighet (THR)</label>
                        <span className="text-[9px] font-mono text-indigo-300">{(vadThreshold * 100).toFixed(0)}%</span>
                    </div>
                    <input 
                        type="range" min="0.1" max="0.9" step="0.05" 
                        value={vadThreshold} onChange={(e) => setVadThreshold(parseFloat(e.target.value))}
                        className="w-full h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                    />
                </div>

                {/* SILENCE THRESHOLD (NEW) */}
                <div className={`space-y-1 ${getHighlight(['SIL', 'ASLP'])}`}>
                    <div className="flex justify-between items-end">
                        <label className="text-[9px] font-bold text-slate-400 uppercase">Paus-tolerans (SIL)</label>
                        <span className="text-[9px] font-mono text-yellow-300">{silenceThreshold}ms</span>
                    </div>
                    <input 
                        type="range" min="200" max="2000" step="50" 
                        value={silenceThreshold} onChange={(e) => setSilenceThreshold(parseInt(e.target.value))}
                        className="w-full h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-yellow-500"
                    />
                </div>

                {/* VOL MULTIPLIER (NEW) */}
                <div className={`space-y-1 ${getHighlight(['RMS', 'VOL'])}`}>
                    <div className="flex justify-between items-end">
                        <label className="text-[9px] font-bold text-slate-400 uppercase">Volymboost (VOL)</label>
                        <span className="text-[9px] font-mono text-orange-300">{volMultiplier.toFixed(1)}x</span>
                    </div>
                    <input 
                        type="range" min="1.0" max="5.0" step="0.5" 
                        value={volMultiplier} onChange={(e) => setVolMultiplier(parseFloat(e.target.value))}
                        className="w-full h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-orange-500"
                    />
                </div>

                {/* LATENCY */}
                <div className={`space-y-1 ${getHighlight(['LTC', 'GAP', 'BUF'])}`}>
                    <div className="flex justify-between items-end">
                        <label className="text-[9px] font-bold text-slate-400 uppercase">Latens/Buffert (BUF)</label>
                        <span className="text-[9px] font-mono text-indigo-300">{(minTurnDuration / 1000).toFixed(1)}s</span>
                    </div>
                    <input 
                        type="range" min="500" max="8000" step="100" 
                        value={minTurnDuration} onChange={(e) => setMinTurnDuration(parseInt(e.target.value))}
                        className="w-full h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                    />
                </div>

                {/* AI SPEED */}
                <div className={`space-y-1 ${getHighlight(['RX', 'GAP'])}`}>
                    <div className="flex justify-between items-end">
                        <label className="text-[9px] font-bold text-slate-400 uppercase">AI Talhastighet (SPEED)</label>
                        <span className="text-[9px] font-mono text-indigo-300">{aiSpeakingRate.toFixed(1)}x</span>
                    </div>
                    <input 
                        type="range" min="1.0" max="2.0" step="0.1" 
                        value={aiSpeakingRate} onChange={(e) => setAiSpeakingRate(parseFloat(e.target.value))}
                        className="w-full h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                    />
                </div>
            </div>
        </div>
    );
};

export default TowerSettings;
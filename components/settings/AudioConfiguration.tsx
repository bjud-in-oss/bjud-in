import React, { useEffect, useState } from 'react';

interface AudioConfigurationProps {
    aiSpeakingRate: number;
    setAiSpeakingRate: (val: number) => void;
    minTurnDuration: number;
    setMinTurnDuration: (val: number) => void;
    vadThreshold: number;
    setVadThreshold: (val: number) => void;
    inputDeviceId?: string; // NEW
    setInputDeviceId?: (val: string) => void; // NEW
    outputDeviceId?: string; // NEW
    setOutputDeviceId?: (val: string) => void; // NEW
}

const AudioConfiguration: React.FC<AudioConfigurationProps> = ({
    aiSpeakingRate,
    setAiSpeakingRate,
    minTurnDuration,
    setMinTurnDuration,
    vadThreshold,
    setVadThreshold,
    inputDeviceId,
    setInputDeviceId,
    outputDeviceId,
    setOutputDeviceId
}) => {
    const [inputDevices, setInputDevices] = useState<MediaDeviceInfo[]>([]);
    const [outputDevices, setOutputDevices] = useState<MediaDeviceInfo[]>([]);

    useEffect(() => {
        let mounted = true;
        const loadDevices = async () => {
             try {
                 // Requesting permission implicitly via enumerate usually works if permission was granted before.
                 // If not, labels might be empty.
                 const devices = await navigator.mediaDevices.enumerateDevices();
                 if (!mounted) return;
                 
                 const inputs = devices.filter(d => d.kind === 'audioinput');
                 const outputs = devices.filter(d => d.kind === 'audiooutput');
                 
                 setInputDevices(inputs);
                 setOutputDevices(outputs);
             } catch (e) {
                 console.error("Failed to enumerate devices", e);
             }
        };
        
        loadDevices();
        
        // Listen for changes (plugging in headphones etc)
        navigator.mediaDevices.addEventListener('devicechange', loadDevices);
        return () => {
            mounted = false;
            navigator.mediaDevices.removeEventListener('devicechange', loadDevices);
        };
    }, []);

    return (
    <div className="space-y-6">
        <h4 className="text-xs font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" /></svg>
            Konfiguration
        </h4>

        {/* DEVICE SELECTORS (NEW) */}
        {setInputDeviceId && setOutputDeviceId && (
            <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50 space-y-4">
                
                {/* Input Device */}
                <div className="space-y-1">
                    <label className="text-sm font-bold text-white block">Mikrofon</label>
                    <select 
                        value={inputDeviceId}
                        onChange={(e) => setInputDeviceId(e.target.value)}
                        className="w-full bg-slate-700 text-white text-xs rounded p-2 border border-slate-600 focus:border-indigo-500 focus:outline-none"
                    >
                        <option value="default">Systemstandard</option>
                        {inputDevices.map(device => (
                            <option key={device.deviceId} value={device.deviceId}>
                                {device.label || `Mikrofon ${device.deviceId.slice(0,5)}...`}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Output Device */}
                <div className="space-y-1">
                    <label className="text-sm font-bold text-white block">Högtalare</label>
                    <select 
                        value={outputDeviceId}
                        onChange={(e) => setOutputDeviceId(e.target.value)}
                        className="w-full bg-slate-700 text-white text-xs rounded p-2 border border-slate-600 focus:border-indigo-500 focus:outline-none"
                    >
                        <option value="default">Systemstandard</option>
                        {outputDevices.map(device => (
                            <option key={device.deviceId} value={device.deviceId}>
                                {device.label || `Högtalare ${device.deviceId.slice(0,5)}...`}
                            </option>
                        ))}
                    </select>
                    {outputDevices.length === 0 && (
                        <p className="text-[9px] text-slate-500 italic">
                            Obs: Vissa webbläsare (t.ex. Safari/Firefox) stödjer inte byte av ut-enhet.
                        </p>
                    )}
                </div>

            </div>
        )}
        
        {/* AI SPEED */}
        <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
            <div className="flex justify-between mb-3">
                <label className="text-sm font-bold text-white flex items-center gap-2">
                    AI Talhastighet
                    <span className="text-[10px] bg-yellow-500/10 text-yellow-500 px-1.5 py-0.5 rounded border border-yellow-500/20">Kräver omstart</span>
                </label>
                <span className="text-xs font-mono text-indigo-300 bg-indigo-500/20 px-2 py-0.5 rounded">
                    {aiSpeakingRate.toFixed(1)}x
                </span>
            </div>
            <input 
            type="range" 
            min="1.0" 
            max="2.0" 
            step="0.1" 
            value={aiSpeakingRate}
            onChange={(e) => setAiSpeakingRate(parseFloat(e.target.value))}
            className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-500 hover:accent-indigo-400"
            />
        </div>

        {/* MIN TURN DURATION */}
        <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
            <div className="flex justify-between mb-3">
                <label className="text-sm font-bold text-white">Minimum Taltid (Latens)</label>
                <span className="text-xs font-mono text-indigo-300 bg-indigo-500/20 px-2 py-0.5 rounded">
                    {(minTurnDuration / 1000).toFixed(1)} s
                </span>
            </div>
            <input 
            type="range" 
            min="500" 
            max="8000" 
            step="100" 
            value={minTurnDuration}
            onChange={(e) => setMinTurnDuration(parseInt(e.target.value))}
            className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-500 hover:accent-indigo-400"
            />
            <p className="text-[10px] text-slate-400 mt-3 leading-relaxed border-t border-slate-700/50 pt-2">
                <strong>Balans:</strong> Lågt värde (snabbare) vs Högt värde (stabilare). 
                Bestämmer hur mycket ljud som måste spelas in innan det skickas till AI:n.
            </p>
        </div>

        {/* VAD THRESHOLD */}
        <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
            <div className="flex justify-between mb-3">
                <label className="text-sm font-bold text-white">Brusfilter (Känslighet)</label>
                <span className="text-xs font-mono text-indigo-300 bg-indigo-500/20 px-2 py-0.5 rounded">
                    {(vadThreshold * 100).toFixed(0)}%
                </span>
            </div>
            <input 
            type="range" 
            min="0.1" 
            max="0.9" 
            step="0.05" 
            value={vadThreshold}
            onChange={(e) => setVadThreshold(parseFloat(e.target.value))}
            className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-500 hover:accent-indigo-400"
            />
            <p className="text-[10px] text-slate-400 mt-3 leading-relaxed border-t border-slate-700/50 pt-2">
            <strong>Brusreducering:</strong> Höj detta värde om fläktar eller bakgrundssorl aktiverar mikrofonen av misstag. 
            Sänkt värde gör den känsligare för viskningar.
            </p>
        </div>
    </div>
  );
};

export default AudioConfiguration;
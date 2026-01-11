import React, { useEffect, useRef, useState } from 'react';
import { DiagnosticData } from './tower/types';
import NetworkLayer, { NetworkLayerRefs } from './tower/NetworkLayer';
import LogicLayer, { LogicLayerRefs } from './tower/LogicLayer';
import AudioLayer, { AudioLayerRefs } from './tower/AudioLayer';
import TowerSettings from './tower/TowerSettings';
import TowerInfo from './tower/TowerInfo';
import TowerDoctor from './tower/TowerDoctor';
import TowerOverview from './tower/TowerOverview';
import TowerMaintenance from './tower/TowerMaintenance';
import TowerModuleHelp from './tower/TowerModuleHelp'; 
import TowerPhases, { TowerPhasesRefs } from './tower/TowerPhases'; // NEW
import { KNOWLEDGE_BASE } from './tower/TowerKnowledge';

interface TowerProps {
    diagnosticsRef: React.MutableRefObject<DiagnosticData>;
    isConnected: boolean;
    triggerTestTone: () => void;
    injectTextAsAudio: (text: string) => Promise<string>;
    initAudioInput: () => Promise<void>; 
    
    // Settings Props
    aiSpeakingRate: number;
    setAiSpeakingRate: (val: number) => void;
    minTurnDuration: number;
    setMinTurnDuration: (val: number) => void;
    vadThreshold: number;
    setVadThreshold: (val: number) => void;
    silenceThreshold: number; // NEW
    setSilenceThreshold: (val: number) => void; // NEW
    volMultiplier: number; // NEW
    setVolMultiplier: (val: number) => void; // NEW
    
    // Devices (New)
    inputDeviceId?: string;
    setInputDeviceId?: (val: string) => void;
    outputDeviceId?: string;
    setOutputDeviceId?: (val: string) => void;

    debugMode: boolean;
    setDebugMode: (val: boolean) => void;
    onOpenCalibration: () => void;
    
    // Optimizer Props
    connect: () => Promise<void>;
    disconnect: () => void;
    setCustomSystemInstruction: (text: string) => void;
    
    // Log Controls
    enableLogs: boolean;
    setEnableLogs: (val: boolean) => void;
    onOpenPromptModal: () => void; // NEW
}

const Tower: React.FC<TowerProps> = ({ 
    diagnosticsRef, 
    isConnected, 
    triggerTestTone, 
    injectTextAsAudio,
    initAudioInput,
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
    inputDeviceId, setInputDeviceId, // NEW
    outputDeviceId, setOutputDeviceId, // NEW
    debugMode,
    setDebugMode,
    onOpenCalibration,
    connect,
    disconnect,
    setCustomSystemInstruction,
    enableLogs,
    setEnableLogs,
    onOpenPromptModal
}) => {
    const [selectedInfo, setSelectedInfo] = useState<string | null>(null);
    const [showDoctor, setShowDoctor] = useState<boolean>(false);
    const [showOverview, setShowOverview] = useState<boolean>(false);
    const [showMaintenance, setShowMaintenance] = useState<boolean>(false);
    const [showPhases, setShowPhases] = useState<boolean>(false); // NEW
    
    const [activeHelpModule, setActiveHelpModule] = useState<string | null>(null);
    
    // --- DRAGGING STATE ---
    // UPDATED: Reduced initial Y to 40px to ensure it fits nicely at the top
    const [position, setPosition] = useState({ x: 20, y: 40 });
    const isDraggingRef = useRef(false);
    const dragOffsetRef = useRef({ x: 0, y: 0 });

    // --- REFS ---
    const networkRefs = useRef<NetworkLayerRefs>({ wsRef: null, keyRef: null, txRef: null, rxRef: null });
    const logicRefs = useRef<LogicLayerRefs>({ 
        vadRef: null, thrRef: null, spkRef: null, silRef: null, 
        gapRef: null, modeRef: null, bufRef: null, latRef: null,
        bsyRef: null, qlnRef: null, aslpRef: null, vstRef: null,
        cnbRef: null, infRef: null, ltsRef: null, avgRef: null, 
        rttRef: null, volRef: null,
        canvasRef: null 
    });
    
    const audioRefs = useRef<AudioLayerRefs>({ rmsRef: null, srRef: null, ctxRef: null, framesRef: null, timeRef: null });
    const phasesRefs = useRef<TowerPhasesRefs>({ p1: null, p2: null, p3: null, p4: null }); // NEW

    // --- DRAG HANDLERS ---
    const startDrag = (e: React.MouseEvent | React.TouchEvent) => {
        if ((e.target as HTMLElement).closest('button, input, select, input[type="range"]')) return;
        
        isDraggingRef.current = true;
        const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
        const clientY = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;
        
        dragOffsetRef.current = {
            x: clientX - position.x,
            y: clientY - position.y
        };
    };

    useEffect(() => {
        const handleMove = (e: MouseEvent | TouchEvent) => {
            if (!isDraggingRef.current) return;
            e.preventDefault();
            const clientX = 'touches' in e ? e.touches[0].clientX : (e as MouseEvent).clientX;
            const clientY = 'touches' in e ? e.touches[0].clientY : (e as MouseEvent).clientY;
            
            setPosition({
                x: clientX - dragOffsetRef.current.x,
                y: clientY - dragOffsetRef.current.y
            });
        };

        const handleUp = () => {
            isDraggingRef.current = false;
        };

        window.addEventListener('mousemove', handleMove);
        window.addEventListener('mouseup', handleUp);
        window.addEventListener('touchmove', handleMove, { passive: false });
        window.addEventListener('touchend', handleUp);

        return () => {
            window.removeEventListener('mousemove', handleMove);
            window.removeEventListener('mouseup', handleUp);
            window.removeEventListener('touchmove', handleMove);
            window.removeEventListener('touchend', handleUp);
        };
    }, []);


    // --- TOGGLE ACTIONS ---
    const toggleDoctor = () => {
        if (showDoctor) {
            setShowDoctor(false);
        } else {
            setShowDoctor(true);
            setSelectedInfo(null);
        }
    };

    const toggleOverview = () => { setShowOverview(!showOverview); };
    const toggleMaintenance = () => { setShowMaintenance(!showMaintenance); };
    const togglePhases = () => { setShowPhases(!showPhases); }; // NEW

    const handleAdjustConfig = (key: string, val: number) => {
        if (key === 'vadThreshold') setVadThreshold(val);
        if (key === 'minTurnDuration') setMinTurnDuration(val);
        if (key === 'aiSpeakingRate') setAiSpeakingRate(val);
        if (key === 'silenceThreshold') setSilenceThreshold(val);
        if (key === 'volMultiplier') setVolMultiplier(val);
    };

    const handleToggleConnection = (action: 'connect' | 'disconnect') => {
        if (action === 'connect') connect();
        else disconnect();
    };

    // --- HELPER: HIGHLIGHT LOGIC ---
    const updateHighlights = (activeKey: string | null) => {
        if (!activeKey) {
            // Remove highlights
            Object.values(audioRefs.current).forEach(el => el?.parentElement?.classList.remove('ring-2', 'ring-indigo-500'));
            Object.values(logicRefs.current).forEach(el => el?.parentElement?.classList.remove('ring-2', 'ring-indigo-500'));
            return;
        }
        
        // Simple mapping
        // We rely on the parent elements of the refs which are the clickable divs
    };

    useEffect(() => { updateHighlights(selectedInfo); }, [selectedInfo]);

    // --- RENDER LOOP ---
    useEffect(() => {
        let ctx: CanvasRenderingContext2D | null = null;
        const initCanvas = () => { if (logicRefs.current.canvasRef) ctx = logicRefs.current.canvasRef.getContext('2d'); };
        setTimeout(initCanvas, 100);

        const historySize = 80;
        const vadHistory = new Array(historySize).fill(0);
        let animationFrameId: number;

        const updatePhaseStyle = (ref: HTMLDivElement | null, isActive: boolean, activeClass: string) => {
            if (!ref) return;
            if (isActive) {
                ref.classList.remove('grayscale', 'opacity-50');
                ref.classList.add('scale-105', 'shadow-lg');
                const ring = ref.querySelector('.active-ring');
                if (ring) ring.classList.add(activeClass);
            } else {
                ref.classList.add('grayscale', 'opacity-50');
                ref.classList.remove('scale-105', 'shadow-lg');
                const ring = ref.querySelector('.active-ring');
                if (ring) ring.classList.remove(activeClass);
            }
        };

        const render = () => {
            const data = diagnosticsRef.current;
            const net = networkRefs.current;
            const logic = logicRefs.current;
            const audio = audioRefs.current;
            const phases = phasesRefs.current;

            // Updates
            if (net.keyRef) { net.keyRef.innerText = (process.env.API_KEY && process.env.API_KEY.length > 5) ? "OK" : "NO"; net.keyRef.className = (process.env.API_KEY && process.env.API_KEY.length > 5) ? "text-green-400" : "text-red-500 font-bold"; }
            if (net.wsRef) { net.wsRef.innerText = data.wsState || '---'; net.wsRef.className = data.wsState === 'OPEN' ? 'text-green-400 font-bold text-[9px]' : 'text-yellow-400 text-[9px]'; }
            if (net.rxRef) { net.rxRef.style.backgroundColor = data.serverRx ? '#22c55e' : '#1e293b'; net.rxRef.style.boxShadow = data.serverRx ? '0 0 8px #22c55e' : 'none'; }
            if (net.txRef) { net.txRef.style.backgroundColor = data.networkEvent !== 'idle' ? '#3b82f6' : '#1e293b'; }
            
            if (logic.vadRef) logic.vadRef.innerText = (data.vadProb * 100).toFixed(0);
            if (logic.thrRef) logic.thrRef.innerText = data.vadThreshold.toFixed(2);
            if (logic.spkRef) { logic.spkRef.innerText = data.isSpeaking ? 'JA' : 'NEJ'; logic.spkRef.className = data.isSpeaking ? 'text-green-400 font-bold text-[9px]' : 'text-slate-600 text-[9px]'; }
            if (logic.silRef) { logic.silRef.innerText = data.silenceDuration.toFixed(0) + 's'; const s = data.silenceDuration; logic.silRef.className = s > 110 ? 'text-red-500 font-bold text-[9px] animate-pulse' : (s > 60 ? 'text-yellow-500 text-[9px]' : 'text-slate-400 text-[9px]'); }
            if (logic.gapRef) { const gap = data.bufferGap || 0; logic.gapRef.innerText = gap.toFixed(2) + 's'; logic.gapRef.style.color = Math.abs(gap) > 0.5 ? '#facc15' : '#ffffff'; }
            if (logic.bufRef) { const isWarning = data.wsState !== 'OPEN' && data.bufferSize > 5; logic.bufRef.innerText = data.bufferSize.toString(); logic.bufRef.className = isWarning ? 'text-red-400 font-bold text-[9px]' : 'text-slate-400 text-[9px]'; }
            if (logic.modeRef) { logic.modeRef.innerText = data.activeMode === 'translate' ? 'TRNS' : (data.activeMode === 'off' ? 'OFF' : 'SCRB'); logic.modeRef.className = data.activeMode === 'translate' ? 'text-green-400 font-bold text-[9px]' : 'text-slate-500 text-[9px]'; }
            if (logic.latRef) { const lat = (data.currentLatency || 0) * 1000; logic.latRef.innerText = lat.toFixed(0); logic.latRef.className = lat > 1000 ? 'text-yellow-400 text-[9px]' : 'text-green-400 text-[9px]'; }
            if (logic.bsyRef) { logic.bsyRef.innerText = Math.max(0, data.busyRemaining || 0).toFixed(0); logic.bsyRef.className = (data.busyRemaining > 0) ? 'text-yellow-400 font-bold text-[9px]' : 'text-slate-600 text-[9px]'; }
            if (logic.qlnRef) { logic.qlnRef.innerText = (data.queueLength || 0).toString(); }
            if (logic.aslpRef) { logic.aslpRef.innerText = (data.autoSleepCountdown || 120).toFixed(0) + 's'; }
            if (logic.vstRef) { if (data.isSpeaking) { logic.vstRef.innerText = "HOT"; logic.vstRef.className = "text-red-400 font-bold text-[9px]"; } else if (data.vadProb > 0.1) { logic.vstRef.innerText = "WARM"; logic.vstRef.className = "text-yellow-400 text-[9px]"; } else { logic.vstRef.innerText = "READY"; logic.vstRef.className = "text-slate-500 text-[9px]"; } }
            if (logic.cnbRef) { logic.cnbRef.innerText = (data.connectingBufferSize || 0).toString(); logic.cnbRef.className = (data.connectingBufferSize || 0) > 0 ? 'text-purple-400 font-bold text-[9px] animate-pulse' : 'text-slate-500 text-[9px]'; }
            if (logic.infRef) { logic.infRef.innerText = (data.inFlightCount || 0).toString(); }
            if (logic.ltsRef) { const ms = data.timeSinceLastSpeech || 0; logic.ltsRef.innerText = ms < 1000 ? `${ms.toFixed(0)}ms` : `${(ms/1000).toFixed(1)}s`; }
            if (logic.avgRef) { const avg = (data.avgVadProb || 0) * 100; logic.avgRef.innerText = avg.toFixed(0); logic.avgRef.className = avg > 10 ? 'text-red-400 font-bold text-[9px]' : 'text-slate-500 text-[9px]'; }
            
            // NEW METRICS
            if (logic.rttRef) { logic.rttRef.innerText = (data.rtt || 0).toFixed(0) + 'ms'; }
            if (logic.volRef) { logic.volRef.innerText = (data.volMultiplier || 1).toFixed(1) + 'x'; }

            if (audio.rmsRef) audio.rmsRef.innerText = data.rms.toFixed(4);
            if (audio.framesRef) audio.framesRef.innerText = (data.framesProcessed % 1000).toString();
            if (audio.ctxRef) { const s = data.audioContextState === 'running' ? 'RUN' : 'SUSP'; audio.ctxRef.innerText = s; audio.ctxRef.className = s === 'RUN' ? 'text-green-400 font-bold text-[9px]' : 'text-red-400 font-bold text-[9px] animate-pulse'; }
            if (audio.srRef) { audio.srRef.innerText = (data.sampleRate / 1000).toFixed(0) + 'k'; audio.srRef.className = data.sampleRate === 16000 ? 'text-green-400 font-bold text-[9px]' : 'text-yellow-400 font-bold text-[9px]'; }
            if (audio.timeRef) { const t = data.audioContextTime || 0; audio.timeRef.innerText = t.toFixed(1) + 's'; }

            // --- PHASE VISUALIZATION UPDATE ---
            // Phase 1: Speaking
            const isP1 = data.isSpeaking;
            // Phase 2: Handshake (Not speaking, but in flight)
            const isP2 = !isP1 && (data.inFlightCount > 0);
            // Phase 3: Processing (Busy pred or buffering while not playing)
            const isP3 = !isP1 && !isP2 && (data.busyRemaining > 0);
            // Phase 4: Playback (Receiving or buffer gap exists implies playout)
            const isP4 = !isP1 && data.serverRx; 

            if (showPhases) {
                updatePhaseStyle(phases.p1, isP1, 'ring-green-500');
                updatePhaseStyle(phases.p2, isP2, 'ring-yellow-500');
                updatePhaseStyle(phases.p3, isP3, 'ring-purple-500');
                updatePhaseStyle(phases.p4, isP4, 'ring-blue-500');
            }

            // Canvas
            if (ctx && logic.canvasRef) {
                const w = logic.canvasRef.width;
                const h = logic.canvasRef.height;
                vadHistory.push(data.vadProb);
                vadHistory.shift();
                ctx.clearRect(0, 0, w, h);
                const thY = h - (data.vadThreshold * h);
                ctx.strokeStyle = '#475569';
                ctx.beginPath(); ctx.moveTo(0, thY); ctx.lineTo(w, thY); ctx.stroke();
                ctx.beginPath(); ctx.strokeStyle = data.isSpeaking ? '#22c55e' : '#64748b'; ctx.lineWidth = 2;
                for(let i=0; i<historySize; i++) { const x = (i/historySize) * w; const y = h - (vadHistory[i] * h); if (i===0) ctx.moveTo(x,y); else ctx.lineTo(x,y); }
                ctx.stroke();
            } else if (!ctx) { initCanvas(); }

            animationFrameId = requestAnimationFrame(render);
        };
        render();
        return () => cancelAnimationFrame(animationFrameId);
    }, [diagnosticsRef, showPhases]);

    return (
        // MAIN DRAGGABLE CONTAINER
        <div 
            style={{ 
                left: `${position.x}px`, 
                top: `${position.y}px`,
                cursor: isDraggingRef.current ? 'grabbing' : 'auto' 
            }}
            onMouseDown={startDrag}
            onTouchStart={startDrag}
            className="absolute z-[60] flex flex-col font-mono text-[10px] select-none touch-none animate-in fade-in duration-300"
        >
            {/* HEADER BAR (DRAG HANDLE) */}
            <div className="h-6 bg-slate-800 rounded-t-lg border-x border-t border-slate-700 flex items-center justify-between px-2 w-full min-w-[288px] cursor-grab active:cursor-grabbing">
                <span className="font-bold text-slate-400 uppercase tracking-widest text-[9px]">TESTPANEL</span>
                <div className="flex gap-2">
                    <button 
                        onClick={togglePhases}
                        className={`px-2 rounded flex items-center gap-1 transition-colors ${showPhases ? 'bg-indigo-600 text-white' : 'hover:bg-slate-700 text-slate-500'}`}
                    >
                        <span>FASER</span>
                    </button>
                    <button 
                        onClick={toggleOverview}
                        className={`px-2 rounded flex items-center gap-1 transition-colors ${showOverview ? 'bg-indigo-600 text-white' : 'hover:bg-slate-700 text-slate-500'}`}
                    >
                        <span>ÖVERSIKT</span>
                    </button>
                    <button 
                        onClick={toggleDoctor}
                        className={`px-2 rounded flex items-center gap-1 transition-colors ${showDoctor ? 'bg-indigo-600 text-white' : 'hover:bg-slate-700 text-slate-500'}`}
                    >
                        <span>DIAGNOS</span>
                    </button>
                    <button 
                        onClick={toggleMaintenance}
                        className={`px-2 rounded flex items-center gap-1 transition-colors ${showMaintenance ? 'bg-indigo-600 text-white' : 'hover:bg-slate-700 text-slate-500'}`}
                    >
                        <span>UNDERHÅLL</span>
                    </button>
                </div>
            </div>

            {/* FLEX CONTAINER FOR PANELS (THE PUZZLE) */}
            <div className="flex flex-row items-start shadow-2xl">
                
                {/* 1. MAIN PANEL (Always Visible) */}
                <div className="w-72 flex flex-col gap-1 bg-slate-900/90 backdrop-blur p-1 border border-slate-700 rounded-b-lg rounded-tr-none">
                    <NetworkLayer 
                        ref={networkRefs} 
                        isConnected={isConnected} 
                        onExplain={setSelectedInfo} 
                        onHelp={setActiveHelpModule}
                    />
                    <LogicLayer 
                        ref={logicRefs} 
                        onExplain={setSelectedInfo} 
                        onHelp={setActiveHelpModule}
                    />
                    <AudioLayer 
                        ref={audioRefs} 
                        onExplain={setSelectedInfo} 
                        onHelp={setActiveHelpModule}
                    />
                    <TowerSettings 
                        aiSpeakingRate={aiSpeakingRate}
                        setAiSpeakingRate={setAiSpeakingRate}
                        minTurnDuration={minTurnDuration}
                        setMinTurnDuration={setMinTurnDuration}
                        vadThreshold={vadThreshold}
                        setVadThreshold={setVadThreshold}
                        silenceThreshold={silenceThreshold}
                        setSilenceThreshold={setSilenceThreshold}
                        volMultiplier={volMultiplier}
                        setVolMultiplier={setVolMultiplier}
                        inputDeviceId={inputDeviceId} setInputDeviceId={setInputDeviceId} // NEW
                        outputDeviceId={outputDeviceId} setOutputDeviceId={setOutputDeviceId} // NEW
                        debugMode={debugMode}
                        setDebugMode={setDebugMode}
                        onOpenCalibration={onOpenCalibration}
                        onHelp={setActiveHelpModule}
                        highlightKey={selectedInfo}
                        enableLogs={enableLogs}
                        setEnableLogs={setEnableLogs}
                        onOpenPromptModal={onOpenPromptModal}
                    />
                </div>

                {/* 2. OVERVIEW PANEL */}
                {showOverview && (
                    <div className="h-full ml-1" data-no-drag="true">
                        <TowerOverview onClose={() => setShowOverview(false)} />
                    </div>
                )}

                {/* 3. DOCTOR PANEL */}
                {showDoctor && (
                    <div className="h-full ml-1" data-no-drag="true">
                        <TowerDoctor 
                            diagnosticsRef={diagnosticsRef} 
                            onClose={() => setShowDoctor(false)}
                            triggerTestTone={triggerTestTone}
                            injectTextAsAudio={injectTextAsAudio}
                            onAdjustConfig={handleAdjustConfig}
                            onToggleConnection={handleToggleConnection}
                            onUpdateInstruction={setCustomSystemInstruction}
                            initAudioInput={initAudioInput} 
                        />
                    </div>
                )}

                {/* 4. MAINTENANCE PANEL */}
                {showMaintenance && (
                    <div className="h-full ml-1" data-no-drag="true">
                        <TowerMaintenance onClose={() => setShowMaintenance(false)} />
                    </div>
                )}

                {/* 5. PHASES PANEL (NEW) */}
                {showPhases && (
                    <div className="h-full ml-1" data-no-drag="true">
                        <TowerPhases ref={phasesRefs} />
                    </div>
                )}

                {/* 6. INFO PANEL */}
                {selectedInfo && !activeHelpModule && (
                    <div className="h-full ml-1" data-no-drag="true">
                        <TowerInfo 
                            selectedKey={selectedInfo} 
                            onClose={() => setSelectedInfo(null)}
                            onSelectRelation={setSelectedInfo}
                        />
                    </div>
                )}

                {/* 7. HELP MODULE PANEL */}
                {activeHelpModule && (
                    <div className="h-full ml-1" data-no-drag="true">
                        <TowerModuleHelp 
                            moduleKey={activeHelpModule}
                            onClose={() => setActiveHelpModule(null)}
                        />
                    </div>
                )}
            </div>
        </div>
    );
};

export default Tower;
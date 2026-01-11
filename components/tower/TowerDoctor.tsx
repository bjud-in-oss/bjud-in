
import React, { useState, useRef } from 'react';
import { GoogleGenAI } from '@google/genai';
import { DiagnosticData } from './types';
import { generateDoctorPrompt, DOCTOR_TOOLS } from './doctorPrompt';
import DoctorLogView from './doctor/DoctorLogView';
import DoctorSimulation from './doctor/DoctorSimulation';

interface TowerDoctorProps {
    diagnosticsRef: React.MutableRefObject<DiagnosticData>; 
    onClose: () => void;
    triggerTestTone: () => void;
    injectTextAsAudio: (text: string) => Promise<string>;
    onAdjustConfig: (key: string, val: number) => void;
    onToggleConnection: (action: 'connect' | 'disconnect') => void;
    onUpdateInstruction: (text: string) => void;
    initAudioInput: () => Promise<void>; 
}

const AVAILABLE_MODELS = [
    { id: 'gemini-2.0-flash-exp', name: 'Gemini 2.5 Flash (Stabil)' },
    { id: 'gemini-2.0-flash-lite-preview-02-05', name: 'Gemini 2.5 Flash Lite' },
    { id: 'gemini-2.0-pro-exp-02-05', name: 'Gemini 2.5 Pro' },
    { id: 'gemini-3-flash-preview', name: 'Gemini 3.0 Flash' }
];

const TowerDoctor: React.FC<TowerDoctorProps> = ({ 
    diagnosticsRef, 
    onClose, 
    triggerTestTone, 
    injectTextAsAudio, 
    onAdjustConfig,
    onToggleConnection,
    onUpdateInstruction,
    initAudioInput
}) => {
    // --- MODE STATE ---
    const [mode, setMode] = useState<'manual' | 'auto' | 'simulation'>('manual');
    const [selectedModel, setSelectedModel] = useState<string>('gemini-2.0-flash-exp');

    // --- SHARED LOGS ---
    const [logs, setLogs] = useState<string[]>([]);
    const addLog = (msg: string, type: 'info' | 'action' | 'success' | 'error' | 'warning' | 'user' | 'ai' = 'info') => {
        setLogs(prev => [...prev, `[${type.toUpperCase()}] ${msg}`]);
    };

    // --- DIAGNOSTIC RESULT STATE ---
    const [probeResult, setProbeResult] = useState<{ status: 'ok' | 'stall' | 'mute' | 'routing' | null, msg: string }>({ status: null, msg: '' });

    // --- AUTO AGENT STATE ---
    const [status, setStatus] = useState<'idle' | 'thinking' | 'acting' | 'paused' | 'done'>('idle');
    const [maxSteps, setMaxSteps] = useState(12);
    const [currentStep, setCurrentStep] = useState(0);
    const historyRef = useRef<string[]>([]);
    const activeRef = useRef(false);
    const verifiedSystemsRef = useRef<Set<string>>(new Set());

    // --- MANUAL LAB STATE ---
    const [consultantInput, setConsultantInput] = useState("");
    const [isConsulting, setIsConsulting] = useState(false);
    
    // --- SIMULATION LAB STATE ---
    const [simStatus, setSimStatus] = useState<'idle' | 'running' | 'success' | 'fail'>('idle');
    const [simResult, setSimResult] = useState<{ rtt: number, total: number, rating: string } | null>(null);
    const [simStepDescription, setSimStepDescription] = useState<string>(""); 

    // --------------------------------------------------------------------------------
    // TOOLS IMPLEMENTATION
    // --------------------------------------------------------------------------------
    
    const runPassiveProbe = async () => {
        setProbeResult({ status: null, msg: 'Lyssnar...' });
        addLog("🩺 PROBE: Djupläser Audio Engine...", 'action');
        
        const d = diagnosticsRef.current;
        const startFrames = d.framesProcessed;
        const startState = d.audioContextState;
        
        await new Promise(r => setTimeout(r, 1000));
        
        const endFrames = diagnosticsRef.current.framesProcessed;
        const delta = endFrames - startFrames;
        const currentRMS = diagnosticsRef.current.rms;
        const currentState = diagnosticsRef.current.audioContextState;
        const wsState = diagnosticsRef.current.wsState;
        
        // --- DEEP ANALYSIS ---
        if (currentState !== 'running') {
             addLog(`CRITICAL: AudioContext is '${currentState}' (Not Running).`, 'error');
             setProbeResult({ status: 'stall', msg: "MOTORSTOPP (SUSPENDED)" });
             return false;
        }

        if (delta === 0) {
            const msg = `CRITICAL: ENGINE STALL. Frames rör sig inte (Delta: 0).`;
            addLog(msg, 'error');
            setProbeResult({ status: 'stall', msg: "MOTORSTOPP (LOOPEN DÖD)" });
            return false;
        } 
        
        // NEW: Check for "Phantom Running" (Loop runs, but silence)
        if (currentRMS === 0) {
            addLog(`WARNING: Digital Silence (RMS: 0.0000). Engine Running but input is dead.`, 'warning');
            
            if (diagnosticsRef.current.trackMuted) {
                addLog(`INFO: Track is explicitly Muted by OS/Browser.`, 'warning');
                setProbeResult({ status: 'mute', msg: "MIC MUTAD AV OS" });
            } else {
                setProbeResult({ status: 'mute', msg: "FANTOM-LÄGE (INGET LJUD)" });
            }
            return false;
        }

        // NEW: Logic / Routing Check
        // If engine works but we think we are speaking and NO network traffic happens?
        if (diagnosticsRef.current.isSpeaking && diagnosticsRef.current.networkEvent === 'idle') {
             addLog(`WARNING: Speaking detected locally but Network is IDLE.`, 'warning');
             setProbeResult({ status: 'routing', msg: "ROUTING FEL (TAL STANNAR KVAR)" });
             return false;
        }

        addLog(`SUCCESS: Engine Running (Delta: ${delta}, RMS: ${currentRMS.toFixed(4)}).`, 'success');
        setProbeResult({ status: 'ok', msg: "MOTOR OCH LJUD OK" });
        return true;
    };

    const runHardRestart = async () => {
        addLog("utför HÅRD OMSTART av ljudmotor...", 'action');
        onToggleConnection('disconnect');
        await new Promise(r => setTimeout(r, 500));
        // Force re-init logic here via parent if needed, but toggle usually triggers cleanup
        try {
            await initAudioInput();
            addLog("Ljudmotor omstartad.", 'success');
            onToggleConnection('connect');
        } catch(e) {
            addLog("Kunde inte starta om: " + e, 'error');
        }
    };

    const runToneTest = async () => {
        addLog("Startar 440Hz test...", 'action');
        triggerTestTone();
        await new Promise(r => setTimeout(r, 800));
        if (diagnosticsRef.current.rms > 0.01) {
            addLog(`SUCCESS: RMS Spike detekterad (${diagnosticsRef.current.rms.toFixed(4)}). Mikrofon OK.`, 'success');
            return true;
        } else {
            addLog("FAILURE: Ingen signal. Kolla 'AudioContext' eller mute-knapp.", 'error');
            return false;
        }
    };

    const runTtsTest = async (phraseInput?: string) => {
        const d = diagnosticsRef.current;
        if (d.activeMode === 'off') {
            addLog("AVBRUTEN: Systemet är i läge OFF. Slå på översättning först.", 'error');
            return false;
        }

        const phrase = phraseInput || "Hello system, please confirm reception.";
        const start = Date.now();
        addLog(`TEST START: Injecting "${phrase}"`, 'action');
        
        await injectTextAsAudio(phrase);
        addLog("Ljud injicerat. Lyssnar efter svar...", 'info');
        
        let vadTriggered = false;
        let networkTx = false;
        let networkRx = false;

        for (let i=0; i<200; i++) {
            await new Promise(r => setTimeout(r, 50));
            const currentD = diagnosticsRef.current;
            if (currentD.isSpeaking && !vadTriggered) { vadTriggered = true; addLog("✓ VAD Trigged", 'success'); }
            if (vadTriggered && currentD.networkEvent !== 'idle' && !networkTx) { networkTx = true; addLog("✓ Network TX", 'success'); }
            if (networkTx && currentD.serverRx && !networkRx) { networkRx = true; addLog("✓ Server Response", 'success'); break; }
        }
        
        const duration = Date.now() - start;

        if (networkRx) {
            addLog(`TEST COMPLETE: Verified in ${duration}ms`, 'success');
            return true;
        } else {
            if (!vadTriggered) addLog("TEST FAILED: VAD reagerade inte.", 'error');
            else if (!networkTx) addLog("TEST FAILED: Socket Error?", 'error');
            else addLog("TEST FAILED: Inget svar från Google.", 'error');
            return false;
        }
    };

    // ... (rest of automated sim / agent logic kept as is) ...
    // --- AUTOMATISERAD SIMULERING (MED AUTO-HEAL) ---
    const runSimulation = async () => {
        setSimStatus('running');
        setSimResult(null);
        addLog("🧪 Startar Labb-simulering...", 'action');

        // STEG 1: PRE-FLIGHT CHECK (Detta fixar Race Condition)
        setSimStepDescription("Steg 1/4: Säkrar nätverkslinjen...");
        addLog("🔄 Utför 'Warm Handshake' för att väcka backend...", 'info');
        
        onToggleConnection('disconnect');
        await new Promise(r => setTimeout(r, 1000));
        onToggleConnection('connect');
        
        // Vänta på OPEN state
        setSimStepDescription("Steg 2/4: Väntar på Socket OPEN...");
        let connected = false;
        for(let i=0; i<20; i++) {
            await new Promise(r => setTimeout(r, 100));
            if (diagnosticsRef.current.wsState === 'OPEN') {
                connected = true;
                break;
            }
        }
        
        if (!connected) {
             setSimStatus('fail');
             setSimStepDescription("Misslyckades: Kunde inte ansluta till socket.");
             addLog("❌ Socket Timeout.", 'error');
             return;
        }
        
        // Extra bufferttid för att backend ska bli redo
        await new Promise(r => setTimeout(r, 1500)); 
        
        // STEG 3: INJEKTION
        setSimStepDescription("Steg 3/4: Injicerar artificiellt ljud...");
        
        const phrase = "Systemcheck ett två tre.";
        const start = Date.now();
        const injectionResult = await injectTextAsAudio(phrase);
        
        if (injectionResult !== "Success") {
             addLog(`❌ Injection Failed: ${injectionResult}`, 'error');
             setSimStatus('fail');
             setSimStepDescription(`Fel vid generering: ${injectionResult}`);
             return;
        }
        
        addLog("✅ Ljud injicerat. Väntar på VAD & Respons...", 'success');
        setSimStepDescription("Steg 4/4: Mäter responstid...");
        
        let networkRx = false;
        let rtt = 0;
        let vadSeen = false;

        for (let i=0; i<200; i++) { 
            await new Promise(r => setTimeout(r, 50));
            const d = diagnosticsRef.current;
            if (d.isSpeaking && !vadSeen) { vadSeen = true; addLog("✓ VAD Detekterad", 'info'); }
            if (d.serverRx && !networkRx) { networkRx = true; rtt = d.rtt || 0; break; }
        }
        
        const totalTime = Date.now() - start;

        if (networkRx) {
            let rating = totalTime < 2500 ? "A" : totalTime < 5000 ? "B" : "C";
            setSimResult({ rtt, total: totalTime, rating });
            setSimStatus('success');
            setSimStepDescription("Klar! Kedjan fungerar.");
            addLog(`✅ Simulering klar. Total tid: ${totalTime}ms`, 'success');
        } else {
            setSimStatus('fail');
            setSimStepDescription("Misslyckades. Inget svar.");
            addLog("❌ Simulering misslyckades (Timeout).", 'error');
        }
    };

    const runStressLoop = async () => {
        addLog("STARTING STRESS TEST LOOP...", 'action');
        const phrases = ["Hello system one", "Testing latency two", "Final check three"];
        for (const phrase of phrases) {
            addLog(`>>> Loop: "${phrase}"`, 'info');
            if (!(await runTtsTest(phrase))) return;
            await new Promise(r => setTimeout(r, 1500));
        }
        addLog("STRESS TEST COMPLETED", 'success');
    };

    const runFlushBuffers = () => {
        addLog("Forcing Buffer Flush...", 'action');
        onToggleConnection('disconnect');
        setTimeout(() => { onToggleConnection('connect'); addLog("Buffers cleared.", 'success'); }, 500);
    };

    const runReconnect = async () => {
        addLog("Initierar omstart av nätverk...", 'action');
        onToggleConnection('disconnect');
        await new Promise(r => setTimeout(r, 1500));
        onToggleConnection('connect');
        addLog("Ny session startad.", 'info');
    };

    const copyReportToClipboard = () => {
        const d = diagnosticsRef.current;
        const report = `
=== DIAGNOS LAB RAPPORT ===
Tid: ${new Date().toLocaleTimeString()}
Status: ${d.wsState}
Ctx: ${d.audioContextState}
Frames: ${d.framesProcessed}
RMS: ${d.rms.toFixed(4)}
Muted: ${d.trackMuted}
TrackState: ${d.trackReadyState}

[LOGG]
${logs.slice(-20).join('\n')}
        `.trim();
        navigator.clipboard.writeText(report).then(() => addLog("Rapport kopierad!", 'success'));
    };

    const askConsultant = async () => {
        if (!consultantInput.trim()) return;
        const userQ = consultantInput;
        setConsultantInput("");
        setIsConsulting(true);
        addLog(userQ, 'user');

        try {
            const apiKey = process.env.API_KEY;
            const ai = new GoogleGenAI({ apiKey: apiKey! });
            const prompt = generateDoctorPrompt(diagnosticsRef.current, logs.slice(-10), Array.from(verifiedSystemsRef.current), userQ);
            const result = await ai.models.generateContent({ model: selectedModel, contents: prompt, config: { tools: DOCTOR_TOOLS } });
            const call = result.functionCalls?.[0];
            
            if (call) {
                const toolName = call.name;
                const args = call.args as any;
                addLog(`Co-Pilot kör verktyg: ${toolName}`, 'ai');

                if (toolName === 'run_passive_probe') await runPassiveProbe();
                else if (toolName === 'inject_test_signal') await runToneTest();
                else if (toolName === 'speak_test_phrase') await runTtsTest(args.phrase);
                else if (toolName === 'run_stress_test') await runStressLoop();
                else if (toolName === 'force_flush_buffers') runFlushBuffers();
                else if (toolName === 'generate_full_report') copyReportToClipboard();
                else if (toolName === 'adjust_configuration') { onAdjustConfig(args.parameter, args.value); addLog(`Justerade ${args.parameter}`, 'success'); }
                else if (toolName === 'toggle_connection') await runReconnect();
                else if (toolName === 'mark_resolved') { verifiedSystemsRef.current.add(args.system); addLog(`OK: ${args.system}`, 'success'); }
            } else {
                addLog(result.text || "Inget svar.", 'ai');
            }
        } catch (e: any) {
            addLog(`Konsultfel: ${e.message}`, 'error');
        } finally {
            setIsConsulting(false);
        }
    };

    const startAutoDiagnostics = () => {
        setLogs([]); historyRef.current = []; verifiedSystemsRef.current.clear();
        setMaxSteps(12); setCurrentStep(0); activeRef.current = true; runAgentLoop();
    };

    const runAgentLoop = async () => {
        try { await initAudioInput(); } catch(e) {}
        setStatus('thinking');
        let stepsRun = currentStep; 
        try {
            const apiKey = process.env.API_KEY;
            const ai = new GoogleGenAI({ apiKey: apiKey! });
            while (activeRef.current) {
                if (stepsRun >= maxSteps) { setStatus('paused'); break; }
                stepsRun++; setCurrentStep(stepsRun);
                const prompt = generateDoctorPrompt(diagnosticsRef.current, historyRef.current.slice(-20), Array.from(verifiedSystemsRef.current), "System check.");
                
                try {
                    const result = await ai.models.generateContent({ model: selectedModel, contents: prompt, config: { tools: DOCTOR_TOOLS } });
                    const call = result.functionCalls?.[0];
                    if (call) {
                        setStatus('acting');
                        const toolName = call.name;
                        addLog(`${toolName}`, 'action');
                        historyRef.current.push(`CMD: ${toolName}`);
                        
                        let feedback = "Done.";
                        if (toolName === 'run_passive_probe') {
                            const ok = await runPassiveProbe();
                            feedback = ok ? "ENGINE RUNNING" : "ENGINE STALL";
                        } else if (toolName === 'inject_test_signal') {
                            const ok = await runToneTest();
                            feedback = ok ? "RMS OK" : "NO SIGNAL";
                            if(ok) verifiedSystemsRef.current.add('AUDIO_INPUT');
                        } else if (toolName === 'speak_test_phrase') {
                             const ok = await runTtsTest((call.args as any).phrase || "Test");
                             feedback = ok ? "LOOP OK" : "LOOP FAIL";
                        }
                        historyRef.current.push(`RES: ${feedback}`);
                        setStatus('thinking');
                    } else {
                        addLog(result.text || "Done.", 'success');
                        activeRef.current = false;
                        setStatus('done');
                    }
                } catch (e) {
                     addLog("Agent Error", 'error');
                     setStatus('paused');
                }
            }
        } catch (e: any) { setStatus('done'); }
    };

    return (
        <div className="w-[500px] bg-slate-900/95 backdrop-blur-md border border-indigo-500/50 rounded-lg shadow-2xl flex flex-col overflow-hidden max-h-[80vh] shrink-0 animate-in fade-in slide-in-from-bottom-4 font-sans">
            <div className="bg-slate-800/80 p-2 flex flex-col gap-2 border-b border-indigo-500/30">
                <div className="flex justify-between items-center px-2">
                    <div className="flex items-center gap-2">
                        <span className="font-bold text-white text-sm tracking-widest uppercase text-emerald-400">DIAGNOS LAB</span>
                        {status === 'acting' && mode === 'auto' && <div className="w-2 h-2 rounded-full bg-blue-400 animate-pulse"></div>}
                    </div>
                    <button onClick={onClose} className="text-slate-500 hover:text-white">✕</button>
                </div>
                <div className="flex bg-slate-950/50 p-1 rounded-lg gap-1">
                    <button onClick={() => setMode('manual')} className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-all ${mode === 'manual' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}>CO-PILOT</button>
                    <button onClick={() => setMode('simulation')} className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-all ${mode === 'simulation' ? 'bg-purple-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}>🧪 SIMULERING</button>
                    <button onClick={() => setMode('auto')} className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-all ${mode === 'auto' ? 'bg-slate-700 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}>AUTO AGENT</button>
                </div>
                <select value={selectedModel} onChange={(e) => setSelectedModel(e.target.value)} className="w-full bg-slate-900 border border-slate-700 text-xs text-slate-300 rounded px-2 py-1">
                    {AVAILABLE_MODELS.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                </select>
            </div>

            <div className="flex-1 flex flex-col min-h-0">
                {mode === 'simulation' ? (
                    <DoctorSimulation status={simStatus} result={simResult} lastLog={simStepDescription} onRun={runSimulation} onCopyReport={copyReportToClipboard} />
                ) : (
                    <DoctorLogView logs={logs} />
                )}

                {/* PROBE RESULT OVERLAY */}
                {probeResult.status && mode === 'manual' && (
                    <div className={`mx-3 mt-3 p-3 rounded-lg flex items-center justify-between shadow-lg ${
                        probeResult.status === 'ok' ? 'bg-green-900/50 border border-green-500' : 
                        probeResult.status === 'stall' || probeResult.status === 'routing' ? 'bg-red-900/50 border border-red-500' : 'bg-yellow-900/50 border border-yellow-500'
                    }`}>
                        <div className="flex flex-col">
                            <span className="text-[10px] font-bold text-white uppercase tracking-wider">Resultat</span>
                            <span className={`font-bold text-xs ${
                                probeResult.status === 'ok' ? 'text-green-300' : 
                                probeResult.status === 'stall' || probeResult.status === 'routing' ? 'text-red-300' : 'text-yellow-300'
                            }`}>{probeResult.msg}</span>
                        </div>
                        {/* Always show auto-fix for stall/routing, OR if user thinks it's broken even if probe is ok (Allow manual override) */}
                        <button onClick={runHardRestart} className="bg-red-600 hover:bg-red-500 text-white text-[10px] font-bold py-2 px-3 rounded shadow animate-pulse">
                            TVINGA FIX
                        </button>
                    </div>
                )}

                {mode === 'manual' && (
                    <div className="bg-slate-900 p-3 space-y-3 shrink-0">
                        <div className="grid grid-cols-3 gap-2">
                            <button onClick={runPassiveProbe} className="bg-slate-800 hover:bg-slate-700 border border-slate-600 text-white text-xs py-2 rounded flex items-center justify-center gap-2">
                                <span>🩺</span> Stetoskop
                            </button>
                            <button onClick={runToneTest} className="bg-slate-800 hover:bg-slate-700 border border-slate-600 text-white text-xs py-2 rounded flex items-center justify-center gap-2">
                                <span>🔊</span> 440Hz
                            </button>
                            <button onClick={runReconnect} className="bg-slate-800 hover:bg-slate-700 border border-slate-600 text-white text-xs py-2 rounded flex items-center justify-center gap-2">
                                <span>🔌</span> Starta om
                            </button>
                        </div>
                        <div className="pt-2 border-t border-slate-800 relative space-y-2">
                             <div className="flex gap-2">
                                <input type="text" value={consultantInput} onChange={(e) => setConsultantInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && askConsultant()} className="flex-1 bg-slate-950 border border-indigo-500/30 focus:border-indigo-500 rounded-lg pl-3 pr-10 py-3 text-xs text-white placeholder-slate-500 focus:outline-none" placeholder="Be Co-Pilot köra test..." disabled={isConsulting} />
                                <button onClick={askConsultant} disabled={isConsulting} className="bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg px-3 flex items-center justify-center">
                                    {isConsulting ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.707l-3-3a1 1 0 00-1.414 0l-3 3a1 1 0 001.414 1.414L9 9.414V13a1 1 0 102 0V9.414l1.293 1.293a1 1 0 001.414-1.414z" clipRule="evenodd" /></svg>}
                                </button>
                             </div>
                             <button onClick={copyReportToClipboard} className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded border border-slate-600 flex items-center justify-center gap-2 transition-colors">📋 KOPIERA RAPPORT</button>
                        </div>
                    </div>
                )}
                {mode === 'auto' && (
                    <div className="p-3 bg-slate-900 border-t border-slate-800 flex gap-2">
                        {status === 'idle' || status === 'done' || status === 'paused' ? (
                            <button onClick={startAutoDiagnostics} className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 rounded uppercase text-xs">{status === 'paused' ? "Fortsätt Diagnos" : "Starta Auto-Analys"}</button>
                        ) : (
                            <button onClick={() => { activeRef.current = false; setStatus('done'); addLog("Stoppad.", 'warning'); }} className="flex-1 bg-red-900/50 border border-red-500 text-red-300 font-bold py-3 rounded uppercase text-xs animate-pulse">Stoppa Agent</button>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default TowerDoctor;

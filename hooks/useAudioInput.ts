import { useState, useRef, useEffect, useCallback, MutableRefObject } from 'react';
import { VAD_CONFIG, calculateRMS } from '../utils/vadLogic';
import { createPcmBlob, encodeBase64, decodeAudioData } from '../utils/audioUtils'; 
import { TurnPackage } from '../types';
import { NeuralVad } from '../utils/neuralVad';
import { GoogleGenAI, Modality } from '@google/genai'; 

interface UseAudioInputProps {
    activeMode: 'translate' | 'transcribe' | 'off';
    vadThreshold: number;
    minTurnDuration: number;
    silenceThreshold: number; 
    volMultiplier: number;    
    inputDeviceId: string; // NEW
    isPlaying: boolean; 
    busyUntilRef: MutableRefObject<number>; 
    onPhraseDetected: (turn: TurnPackage) => void; 
    onAudioData: (base64: string) => void;
    debugMode: boolean;
    audioDiagnosticsRef: MutableRefObject<{
        rms: number;
        vadProb: number;
        vadThreshold: number;
        isSpeaking: boolean;
        isBuffering: boolean;
        bufferSize: number;
        networkEvent: 'idle' | 'normal' | 'flush';
        framesProcessed: number; 
        audioContextState: string; 
        activeMode: string; 
        serverRx: boolean;
        sampleRate: number; 
        wsState: string;
        bufferGap: number;
        silenceDuration: number; 
        avgVadProb: number; 
        audioContextTime: number;
        rtt: number;
        volMultiplier: number;
        silenceThreshold: number;
        trackReadyState: string;
        trackMuted: boolean;
    }>;
}

export function useAudioInput({
    activeMode,
    vadThreshold,
    minTurnDuration,
    silenceThreshold,
    volMultiplier,
    inputDeviceId,
    isPlaying,
    busyUntilRef,
    onPhraseDetected,
    onAudioData,
    debugMode,
    audioDiagnosticsRef
}: UseAudioInputProps) {
    const [effectiveMinDuration, setEffectiveMinDuration] = useState<number>(VAD_CONFIG.MIN_TURN_DURATION_DEFAULT);
    const [currentLatency, setCurrentLatency] = useState<number>(0);
    const [error, setError] = useState<string | null>(null);

    const inputContextRef = useRef<AudioContext | null>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const processorRef = useRef<ScriptProcessorNode | null>(null);
    const keepAliveOscRef = useRef<OscillatorNode | null>(null); 
    const vadRef = useRef<NeuralVad | null>(null); 
    
    // HYBRID BUFFER
    const hybridBufferRef = useRef<Float32Array[]>([]); 

    // State Refs
    const phraseStartTimeRef = useRef<number>(0);
    const lastSpeechTimeRef = useRef<number>(Date.now()); 
    const isSpeakingRef = useRef(false);
    const framesProcessedRef = useRef<number>(0);
    
    const vadHistoryRef = useRef<number[]>([]);
    
    // Config Mirrors
    const vadThresholdRef = useRef(vadThreshold);
    const silenceThresholdRef = useRef(silenceThreshold);
    const volMultiplierRef = useRef(volMultiplier);
    const inputDeviceIdRef = useRef(inputDeviceId);
    
    const isPlayingRef = useRef(isPlaying);
    const activeModeRef = useRef(activeMode);

    // Callback Mirrors (CRITICAL FIX FOR STALE CLOSURES)
    const onPhraseDetectedRef = useRef(onPhraseDetected);
    const onAudioDataRef = useRef(onAudioData);

    useEffect(() => { vadThresholdRef.current = vadThreshold; }, [vadThreshold]);
    useEffect(() => { silenceThresholdRef.current = silenceThreshold; }, [silenceThreshold]);
    useEffect(() => { volMultiplierRef.current = volMultiplier; }, [volMultiplier]);
    useEffect(() => { inputDeviceIdRef.current = inputDeviceId; }, [inputDeviceId]);
    
    useEffect(() => { isPlayingRef.current = isPlaying; }, [isPlaying]);
    useEffect(() => { activeModeRef.current = activeMode; }, [activeMode]);

    // Keep callbacks fresh
    useEffect(() => { onPhraseDetectedRef.current = onPhraseDetected; }, [onPhraseDetected]);
    useEffect(() => { onAudioDataRef.current = onAudioData; }, [onAudioData]);

    // --- HELPER: LOG CHECKER ---
    const log = useCallback((msg: string, forceDebug: boolean = false) => {
        if (msg.includes('Sending stream packet') || msg.includes('Monologue detected')) {
             if (!debugMode) return; 
        }
        const globalEnabled = (window as any).APP_LOGS_ENABLED;
        if (globalEnabled) {
            console.log(msg);
        }
    }, [debugMode]);

    // --- HELPER: CONVERT & SEND ---
    const sendFloat32 = useCallback((data: Float32Array, isFlush: boolean = false) => {
        const int16 = new Int16Array(data.length);
        for (let i = 0; i < data.length; i++) {
            const s = Math.max(-1, Math.min(1, data[i]));
            int16[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
        }
        const base64 = encodeBase64(new Uint8Array(int16.buffer));
        
        if (isFlush) {
             log(`[AudioInput] 📤 Sending FLUSH packet (${base64.length} chars)`, true);
        }

        // Use Ref to call latest callback
        onAudioDataRef.current(base64);
        audioDiagnosticsRef.current.networkEvent = isFlush ? 'flush' : 'normal';
    }, [audioDiagnosticsRef, log]);

    // --- HELPER: FLUSH BUFFER ---
    const flushBuffer = useCallback(() => {
        if (hybridBufferRef.current.length === 0) return;
        const totalLen = hybridBufferRef.current.reduce((acc, c) => acc + c.length, 0);
        const merged = new Float32Array(totalLen);
        let offset = 0;
        for(const c of hybridBufferRef.current) {
            merged.set(c, offset);
            offset += c.length;
        }
        sendFloat32(merged, true);
        hybridBufferRef.current = [];
        audioDiagnosticsRef.current.bufferSize = 0;
    }, [sendFloat32, audioDiagnosticsRef]);

    useEffect(() => {
        if (!isPlaying) {
            flushBuffer();
        }
    }, [isPlaying, flushBuffer]);

    // UPDATED INIT: Accepts forceActive boolean to override stale React state
    const initAudioInput = useCallback(async (forceActiveMode: boolean = false) => {
        try {
            if (forceActiveMode) {
                console.log("[AudioInput] Forcing Active Mode (Bypassing React State)");
                activeModeRef.current = 'translate';
            }

            if (!vadRef.current) {
                vadRef.current = new NeuralVad();
            }

            // --- ZOMBIE CHECK ---
            if (inputContextRef.current && inputContextRef.current.state === 'closed') {
                console.warn("[AudioInput] Found closed context. Recreating...");
                inputContextRef.current = null;
            }

            if (!inputContextRef.current) {
                console.log("[AudioInput] Ignition: Creating New Audio Context...");
                inputContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
            }

            if(inputContextRef.current.state === 'suspended') {
                await inputContextRef.current.resume();
            }
            
            audioDiagnosticsRef.current.audioContextState = inputContextRef.current.state;
            audioDiagnosticsRef.current.sampleRate = inputContextRef.current.sampleRate;

            // --- GUARDRAIL: KEEP-ALIVE OSCILLATOR ---
            if (!keepAliveOscRef.current && inputContextRef.current) {
                const ctx = inputContextRef.current;
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.type = 'sine';
                osc.frequency.value = 10; 
                gain.gain.value = 0.0001; 
                osc.connect(gain);
                gain.connect(ctx.destination);
                osc.start();
                keepAliveOscRef.current = osc;
            }

            // --- STOP PREVIOUS STREAM ---
            if (streamRef.current) {
                streamRef.current.getTracks().forEach(track => track.stop());
            }

            // --- NEW: USE SELECTED DEVICE ID ---
            const constraints: MediaStreamConstraints = { 
                audio: { 
                    echoCancellation: true, 
                    noiseSuppression: true, 
                    autoGainControl: true, 
                    sampleRate: 16000,
                    deviceId: inputDeviceIdRef.current !== 'default' ? { exact: inputDeviceIdRef.current } : undefined
                } 
            };
            
            console.log("[AudioInput] Requesting Mic with constraints:", constraints);
            const stream = await navigator.mediaDevices.getUserMedia(constraints);
            streamRef.current = stream;
            
            // Track Diagnostics
            const track = stream.getAudioTracks()[0];
            if (track) {
                console.log(`[AudioInput] Using Mic: ${track.label}`);
                audioDiagnosticsRef.current.trackReadyState = track.readyState;
                audioDiagnosticsRef.current.trackMuted = track.muted;
                track.onmute = () => { audioDiagnosticsRef.current.trackMuted = true; };
                track.onunmute = () => { audioDiagnosticsRef.current.trackMuted = false; };
                track.onended = () => { audioDiagnosticsRef.current.trackReadyState = 'ended'; };
            }
            
            if (inputContextRef.current) {
                if (processorRef.current) {
                    processorRef.current.disconnect();
                }

                const source = inputContextRef.current.createMediaStreamSource(stream);
                const processor = inputContextRef.current.createScriptProcessor(2048, 1, 1);
                processorRef.current = processor;

                processor.onaudioprocess = async (e) => {
                    // CRITICAL: Check Active Mode Ref (which is up-to-date)
                    if (activeModeRef.current === 'off') return;

                    const now = Date.now();
                    framesProcessedRef.current++;
                    
                    audioDiagnosticsRef.current.framesProcessed = framesProcessedRef.current;
                    audioDiagnosticsRef.current.audioContextState = inputContextRef.current?.state || 'unknown';
                    audioDiagnosticsRef.current.activeMode = activeModeRef.current;
                    audioDiagnosticsRef.current.silenceDuration = (now - lastSpeechTimeRef.current) / 1000;

                    // --- AUDIO PROCESSING ---
                    const inputData = e.inputBuffer.getChannelData(0);
                    const gain = volMultiplierRef.current;
                    const chunk = new Float32Array(inputData.length);
                    for (let i = 0; i < inputData.length; i++) chunk[i] = inputData[i] * gain; 
                    
                    const rms = calculateRMS(chunk);
                    let prob = 0;
                    if (vadRef.current && rms > 0.002) {
                         prob = await vadRef.current.process(chunk);
                    }

                    vadHistoryRef.current.push(prob);
                    if (vadHistoryRef.current.length > 50) vadHistoryRef.current.shift();
                    
                    audioDiagnosticsRef.current.rms = rms;
                    audioDiagnosticsRef.current.vadProb = prob;
                    audioDiagnosticsRef.current.isBuffering = isPlayingRef.current || hybridBufferRef.current.length > 0;
                    audioDiagnosticsRef.current.bufferSize = hybridBufferRef.current.length;

                    if (isPlayingRef.current) {
                        hybridBufferRef.current.push(chunk);
                    } else {
                        if (hybridBufferRef.current.length > 0) {
                            flushBuffer(); 
                            sendFloat32(chunk, false);
                        } else {
                            sendFloat32(chunk, false);
                        }
                    }

                    let effectiveThreshold = vadThresholdRef.current;
                    if (isPlayingRef.current) effectiveThreshold += 0.2; 

                    const isCurrentlySpeaking = prob > effectiveThreshold;
                    audioDiagnosticsRef.current.isSpeaking = isCurrentlySpeaking;

                    if (isCurrentlySpeaking) {
                         lastSpeechTimeRef.current = now; 
                    }

                    if (isCurrentlySpeaking && !isSpeakingRef.current) {
                        isSpeakingRef.current = true;
                        phraseStartTimeRef.current = now;
                        onPhraseDetectedRef.current({ id: 'temp-start', audioData: '', timestamp: now, durationMs: 0, confidenceScore: prob });
                    }

                    if (!isCurrentlySpeaking && isSpeakingRef.current) {
                        if (now - lastSpeechTimeRef.current > silenceThresholdRef.current) {
                            isSpeakingRef.current = false;
                            const dur = now - phraseStartTimeRef.current;
                            if (dur > 200) setCurrentLatency(dur / 1000);
                        }
                    }
                };
                
                source.connect(processor);
                processor.connect(inputContextRef.current.destination);
            }
        } catch (e) {
            console.error("Mic init failed", e);
            setError("Microphone access failed");
        }
    }, [flushBuffer, sendFloat32, audioDiagnosticsRef, log, debugMode]); 

    // Re-init if device ID changes while active
    useEffect(() => {
        if (activeModeRef.current !== 'off') {
            initAudioInput();
        }
    }, [inputDeviceId, initAudioInput]);

    const stopAudioInput = useCallback(() => {
        if (processorRef.current) {
            processorRef.current.disconnect();
            processorRef.current = null;
        }
        if (keepAliveOscRef.current) {
            keepAliveOscRef.current.stop();
            keepAliveOscRef.current.disconnect();
            keepAliveOscRef.current = null;
        }
        if (inputContextRef.current) {
            if (inputContextRef.current.state !== 'closed') {
                inputContextRef.current.close().catch(console.error);
            }
            inputContextRef.current = null;
        }
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }
        
        hybridBufferRef.current = [];
        phraseStartTimeRef.current = 0;
        framesProcessedRef.current = 0;
        vadHistoryRef.current = []; 
    }, []);

    // ... (Test tone and Injection logic remains same) ...
    const triggerTestTone = useCallback(() => {
        if (!inputContextRef.current || !processorRef.current) return;
        const ctx = inputContextRef.current;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(440, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.1);
        gain.gain.setValueAtTime(0, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.8, ctx.currentTime + 0.1); 
        gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 1.5);
        osc.connect(gain);
        gain.connect(processorRef.current); 
        gain.connect(ctx.destination); 
        osc.start();
        osc.stop(ctx.currentTime + 1.6);
    }, []);

    const injectTextAsAudio = useCallback(async (text: string) => {
        if (!inputContextRef.current) {
            try {
                await initAudioInput();
                await new Promise(r => setTimeout(r, 200));
            } catch (e) {
                return "Failed to init Audio Context";
            }
        }

        if (!inputContextRef.current || !processorRef.current) return "Audio Context Not Ready (Still Null)";

        try {
            const ctx = inputContextRef.current;
            if (ctx.state === 'suspended') {
                await ctx.resume();
            }

            const apiKey = process.env.API_KEY;
            if (!apiKey) return "API Key Missing";

            const ai = new GoogleGenAI({ apiKey });
            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash-preview-tts',
                contents: [{ parts: [{ text }] }],
                config: {
                    responseModalities: [Modality.AUDIO],
                    speechConfig: {
                        voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Fenrir' } } 
                    }
                }
            });

            const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
            if (!base64Audio) return "No Audio from Gemini TTS";

            const audioBuffer = await decodeAudioData(
                Uint8Array.from(atob(base64Audio), c => c.charCodeAt(0)), 
                ctx, 
                24000, 
                1
            );

            const source = ctx.createBufferSource();
            const gainNode = ctx.createGain();
            gainNode.gain.value = 2.0; 
            source.buffer = audioBuffer;
            source.connect(gainNode);
            gainNode.connect(processorRef.current); 
            source.start();
            return "Success";

        } catch (e: any) {
            console.error("Injection failed", e);
            return `TTS API Error: ${e.message}`;
        }
    }, [initAudioInput]);

    return {
        initAudioInput,
        stopAudioInput,
        triggerTestTone,
        injectTextAsAudio, 
        effectiveMinDuration,
        currentLatency,
        inputContextRef, 
        error
    };
}
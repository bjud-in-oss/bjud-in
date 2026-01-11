// ... (Previous imports remain largely the same, ensuring correct order)
import { useState, useRef, useCallback, useEffect } from 'react';
import { TranscriptItem, TurnPackage } from '../types';
import { useTurnQueue } from './useTurnQueue';
import { buildSystemInstruction } from '../utils/promptBuilder';
import { useAudioInput } from './useAudioInput';
import { useAudioPlayer } from './useAudioPlayer';
import { useGeminiSession, ExtendedStatus } from './useGeminiSession';
import { useLiveDiagnostics } from './useLiveDiagnostics';
import { useLiveConfig } from './useLiveConfig';
import { useBackgroundMonitor } from './useBackgroundMonitor';

export function useGeminiLive() {
  // --- UI STATE ---
  const [transcripts, setTranscripts] = useState<TranscriptItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [notification, setNotification] = useState<string | null>(null);
  
  // --- CONFIG HOOK ---
  const config = useLiveConfig(); 
  
  // --- DIAGNOSTICS & QUEUE ---
  const { 
      queueStats, packetEvents, trackSentTurn, trackStreamPacket, 
      trackTurnComplete, resetDiagnostics, updateStats, busyUntilRef,
      latestRtt 
  } = useLiveDiagnostics();

  // New: Shared Ref for Audio Visualizer
  const audioDiagnosticsRef = useRef<{
      rms: number;
      vadProb: number;
      avgVadProb: number; 
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
      currentLatency: number; 
      busyRemaining: number; 
      queueLength: number; 
      autoSleepCountdown: number; 
      connectingBufferSize: number; 
      inFlightCount: number; 
      timeSinceLastSpeech: number; 
      audioContextTime: number;
      rtt: number;
      volMultiplier: number;
      silenceThreshold: number;
      trackReadyState: string;
      trackMuted: boolean;
  }>({
      rms: 0, vadProb: 0, avgVadProb: 0, vadThreshold: 0.5, isSpeaking: false, 
      isBuffering: false, bufferSize: 0, networkEvent: 'idle',
      framesProcessed: 0, audioContextState: 'unknown', activeMode: 'off',
      serverRx: false,
      sampleRate: 0,
      wsState: 'CLOSED',
      bufferGap: 0,
      silenceDuration: 0,
      currentLatency: 0,
      busyRemaining: 0,
      queueLength: 0,
      autoSleepCountdown: 120,
      connectingBufferSize: 0,
      inFlightCount: 0,
      timeSinceLastSpeech: 0,
      audioContextTime: 0,
      rtt: 0,
      volMultiplier: 1.0,
      silenceThreshold: 500,
      trackReadyState: 'unknown',
      trackMuted: false
  });

  const { enqueueTurn, flushQueue, markTurnAsSent, confirmOldestTurn, queueLength, inFlightCount } = useTurnQueue();
  
  const { 
      addToQueue: playAudio, resetPlayer, resumeContext, isPlaying, activeGroupId,
      activePhraseDuration, bufferGap, currentPlaybackRate,
      queueLength: outQueueLength, audioContext 
  } = useAudioPlayer({ 
      sampleRate: 24000,
      outputDeviceId: config.outputDeviceId // NEW
  });

  // --- REFS ---
  const phraseCounterRef = useRef<number>(0); 
  const currentTranscriptIdRef = useRef<string | null>(null);
  const sentPhrasesCountRef = useRef<number>(0);
  const receivedPhrasesCountRef = useRef<number>(0);
  const lastSpeechTimeRef = useRef<number>(0);
  const isHandshakingRef = useRef<boolean>(false);
  
  const connectingBufferRef = useRef<string[]>([]);

  // Mirrors for useEffects
  const targetLanguagesRef = useRef(config.targetLanguages);
  const aiSpeakingRateRef = useRef(config.aiSpeakingRate);
  const activeModeRef = useRef(config.activeMode);
  // Using the config's custom instruction
  const customInstRef = useRef(config.customSystemInstruction);
  
  useEffect(() => { targetLanguagesRef.current = config.targetLanguages; }, [config.targetLanguages]);
  useEffect(() => { aiSpeakingRateRef.current = config.aiSpeakingRate; }, [config.aiSpeakingRate]);
  useEffect(() => { activeModeRef.current = config.activeMode; }, [config.activeMode]);
  useEffect(() => { customInstRef.current = config.customSystemInstruction; }, [config.customSystemInstruction]);

  // --- SESSION HANDLERS ---
  const handleAudioData = useCallback((base64Data: string) => {
      trackStreamPacket();
      playAudio(base64Data, phraseCounterRef.current);
  }, [playAudio, trackStreamPacket]);

  const handleTextData = useCallback((text: string) => {
      setTranscripts(prev => {
           const id = currentTranscriptIdRef.current;
           if (id) {
               return prev.map(t => t.id === id ? { ...t, text: t.text + text } : t);
           } else {
               const newId = Date.now().toString();
               currentTranscriptIdRef.current = newId;
               return [...prev, {
                   id: newId, groupId: phraseCounterRef.current, 
                   role: 'model', text: text, timestamp: new Date()
               }];
           }
      });
  }, []);

  const handleTurnComplete = useCallback(() => {
      if (confirmOldestTurn()) {
           receivedPhrasesCountRef.current += 1;
           trackTurnComplete();
      }
      currentTranscriptIdRef.current = null;
  }, [confirmOldestTurn, trackTurnComplete]);

  const handleSessionConnect = useCallback(() => {
      setError(null);
      sentPhrasesCountRef.current = 0;
      receivedPhrasesCountRef.current = 0;
      audioDiagnosticsRef.current.wsState = 'OPEN'; 
  }, []);

  const handleServerMessage = useCallback(() => {
      audioDiagnosticsRef.current.serverRx = true;
      setTimeout(() => {
          if (audioDiagnosticsRef.current) audioDiagnosticsRef.current.serverRx = false;
      }, 150);
  }, []);

  const { status, connect: sessionConnect, disconnect: sessionDisconnect, sendAudio, setStandby } = useGeminiSession({
      onAudioData: handleAudioData,
      onTextData: handleTextData,
      onTurnComplete: handleTurnComplete,
      onError: setError,
      onConnect: handleSessionConnect,
      onDisconnect: () => { audioDiagnosticsRef.current.wsState = 'CLOSED'; },
      onMessageReceived: handleServerMessage
  });

  useEffect(() => {
      if (status === ExtendedStatus.CONNECTING) audioDiagnosticsRef.current.wsState = 'CONNECTING';
      if (status === ExtendedStatus.CONNECTED) audioDiagnosticsRef.current.wsState = 'OPEN';
      if (status === ExtendedStatus.DISCONNECTED) audioDiagnosticsRef.current.wsState = 'CLOSED';
      if (status === ExtendedStatus.STANDBY) audioDiagnosticsRef.current.wsState = 'STANDBY';
  }, [status]);

  const handleStreamingAudio = useCallback((base64Audio: string) => {
      if (status === ExtendedStatus.CONNECTED) {
          if (connectingBufferRef.current.length > 0) {
              console.log(`[Streaming] Flushing ${connectingBufferRef.current.length} buffered chunks after reconnect`);
              connectingBufferRef.current.forEach(chunk => sendAudio(chunk));
              connectingBufferRef.current = [];
          }
          sendAudio(base64Audio);
      } else if (status === ExtendedStatus.CONNECTING || isHandshakingRef.current) {
          connectingBufferRef.current.push(base64Audio);
      }
  }, [status, sendAudio]);

  // 1. Stub connectRef early
  const connectRef = useRef<(isWakeup?: boolean) => Promise<void>>(async () => {});

  // 2. Hoist handlePhraseDetected
  const handlePhraseDetected = useCallback((turn: TurnPackage) => {
      lastSpeechTimeRef.current = Date.now();
      
      if ((status === ExtendedStatus.STANDBY || status === ExtendedStatus.DISCONNECTED) && config.activeMode !== 'off') {
          if (!isHandshakingRef.current) {
              console.log("[GeminiLive] Wake word/Activity detected. Reconnecting...");
              connectRef.current(true); 
          }
      }
      
      if (turn.id === 'temp-start') {
          phraseCounterRef.current += 1;
      }
      enqueueTurn(turn);
      audioDiagnosticsRef.current.queueLength = queueLength + 1; 
      trackSentTurn(turn.id, turn.durationMs);
  }, [status, enqueueTurn, queueLength, trackSentTurn, config.activeMode]); 

  // 3. useAudioInput 
  const { initAudioInput, stopAudioInput, effectiveMinDuration, currentLatency, inputContextRef, triggerTestTone, injectTextAsAudio } = useAudioInput({
      activeMode: config.activeMode,
      vadThreshold: config.vadThreshold,
      minTurnDuration: config.minTurnDuration,
      silenceThreshold: config.silenceThreshold, 
      volMultiplier: config.volMultiplier,  
      inputDeviceId: config.inputDeviceId, // NEW
      isPlaying, 
      busyUntilRef,
      onPhraseDetected: handlePhraseDetected,
      onAudioData: handleStreamingAudio,
      debugMode: config.debugMode,
      audioDiagnosticsRef 
  });

  const disconnect = useCallback(() => {
      sessionDisconnect();
      stopAudioInput(); 
      resetPlayer();
      resetDiagnostics();
      currentTranscriptIdRef.current = null;
      sentPhrasesCountRef.current = 0;
      receivedPhrasesCountRef.current = 0;
      phraseCounterRef.current = 0; 
      connectingBufferRef.current = [];
      isHandshakingRef.current = false;
  }, [sessionDisconnect, resetPlayer, resetDiagnostics, stopAudioInput]); 

  // 4. Define connect 
  // --- ROBUST CONNECT (WARM HANDSHAKE PROTOCOL + HEART START) ---
  const connect = useCallback(async (isWakeup = false) => {
      if (isHandshakingRef.current) return;
      isHandshakingRef.current = true;

      const apiKey = process.env.API_KEY;
      const sysInstruct = customInstRef.current || buildSystemInstruction(targetLanguagesRef.current, aiSpeakingRateRef.current);

      if (isWakeup) {
          setNotification("Vaknar...");
          console.log("[GeminiLive] 🌅 Waking up (Warm Handshake Sequence initiated)");
      } else {
          setNotification("Startar...");
      }

      // STEP 1: FORCE DISCONNECT SESSION (Prevent Zombie Socket)
      sessionDisconnect();
      
      // STEP 2: COOL DOWN 
      await new Promise(r => setTimeout(r, 200));

      try {
          // STEP 3: "HEART START" - ENSURE AUDIO ENGINE IS ALIVE
          // If we are reconnecting (e.g. via "Restart Network"), the audio engine might be dead/null.
          // We must revive it here, otherwise we connect the socket but send no audio (ENGINE STALL).
          if (!inputContextRef.current || inputContextRef.current.state === 'closed') {
              console.log("[GeminiLive] ⚡ Heart Start: Reviving Audio Engine...");
              await initAudioInput(true); // Force Active Mode
          } else if (inputContextRef.current.state === 'suspended') {
              console.log("[GeminiLive] Resuming Suspended Context...");
              await inputContextRef.current.resume();
          }

          // STEP 4: CONNECT SESSION
          await sessionConnect({ apiKey, systemInstruction: sysInstruct, voiceName: 'Puck' });
          
          // STEP 5: BACKEND WARMUP
          if (isWakeup) {
             await new Promise(r => setTimeout(r, 500)); 
          } else {
             await new Promise(r => setTimeout(r, 800));
          }

          setNotification("Ansluten!");
          setTimeout(() => setNotification(null), 2000);
          console.log("[GeminiLive] ✅ Warm Handshake Complete. Engine Ready.");

      } catch (e) {
          console.error("Connection sequence failed", e);
          setError("Kunde inte ansluta.");
      } finally {
          isHandshakingRef.current = false;
      }
  }, [sessionConnect, sessionDisconnect, inputContextRef, initAudioInput]);

  // 5. Update connectRef
  useEffect(() => { connectRef.current = connect; }, [connect]);

  // Watch for activity in standby
  useEffect(() => {
      if (status === ExtendedStatus.STANDBY && lastSpeechTimeRef.current > 0) {
          const now = Date.now();
          if (now - lastSpeechTimeRef.current < 500) {
               if (!isHandshakingRef.current) connect(true);
          }
      }
  }, [lastSpeechTimeRef.current, status, connect]); 

  // --- STATS UPDATE LOOP ---
  useEffect(() => { 
      updateStats(
          sentPhrasesCountRef.current, receivedPhrasesCountRef.current,
          queueLength, inFlightCount, outQueueLength, bufferGap
      );
      
      const timeSinceSpeech = Date.now() - lastSpeechTimeRef.current;

      audioDiagnosticsRef.current.bufferGap = bufferGap;
      audioDiagnosticsRef.current.currentLatency = currentLatency;
      audioDiagnosticsRef.current.activeMode = config.activeMode;
      audioDiagnosticsRef.current.busyRemaining = Math.max(0, busyUntilRef.current - Date.now());
      audioDiagnosticsRef.current.queueLength = queueLength; 
      audioDiagnosticsRef.current.autoSleepCountdown = Math.max(0, 120 - (timeSinceSpeech / 1000));
      
      audioDiagnosticsRef.current.connectingBufferSize = connectingBufferRef.current.length;
      audioDiagnosticsRef.current.inFlightCount = inFlightCount;
      audioDiagnosticsRef.current.timeSinceLastSpeech = timeSinceSpeech;
      
      audioDiagnosticsRef.current.rtt = latestRtt;
      audioDiagnosticsRef.current.volMultiplier = config.volMultiplier;
      audioDiagnosticsRef.current.silenceThreshold = config.silenceThreshold;

  }, [queueLength, inFlightCount, outQueueLength, bufferGap, updateStats, currentLatency, config.activeMode, latestRtt, config.volMultiplier, config.silenceThreshold]);


  const setMode = useCallback(async (mode: 'translate' | 'transcribe' | 'off') => {
      config.setActiveMode(mode);
      
      // MANUAL REF UPDATE: Race Condition Fix
      // We force the Ref to update immediately so initAudioInput sees the correct state
      // before React has time to flush the useState update.
      activeModeRef.current = mode; 

      if (mode === 'off') {
          disconnect();
      } else {
          // --- STRICT INITIALIZATION SEQUENCE ---
          disconnect(); 
          
          // Added delay to ensure disconnection cleanup is finished
          await new Promise(r => setTimeout(r, 100));

          try {
              setNotification("Initierar ljud...");
              await resumeContext();
              
              // Pass 'true' to force active mode internally in audio loop
              await initAudioInput(true);
              
              await connect(false); // False = Manual Start
              
          } catch (e) {
              console.error("[GeminiLive] Startup Failed:", e);
              setError("Kunde inte starta ljudet. Kontrollera mikrofonbehörighet.");
              disconnect();
          }
      }
  }, [disconnect, initAudioInput, inputContextRef, audioContext, connect, config.setActiveMode, resumeContext]);

  useBackgroundMonitor({
      activeMode: config.activeMode,
      status,
      queueLength,
      inFlightCount,
      bufferGap,
      lastSpeechTimeRef,
      actions: {
          setStandby,
          connect: () => connect(true), 
          flushAndSend: () => { 
             const flushed = flushQueue();
             if (flushed.length > 0) {
                 console.log(`[GeminiLive] Cleared ${flushed.length} processed items from queue (Streaming Mode).`);
             }
          },
          setNotification
      },
      isBuffering: audioDiagnosticsRef.current.connectingBufferSize > 0 || audioDiagnosticsRef.current.bufferSize > 0
  });

  return {
    status,
    transcripts, 
    error,
    queueStats,
    currentPlaybackRate,
    paceStatus: currentPlaybackRate > 1.02 ? 'Accelerating' : 'Normal', 
    currentLatency,
    packetEvents,
    notification,
    effectiveMinDuration,
    activeGroupId,
    activePhraseDuration,
    setMode,
    audioDiagnosticsRef, 
    triggerTestTone,
    injectTextAsAudio, 
    initAudioInput, 
    connect,
    disconnect,
    ...config 
  };
}
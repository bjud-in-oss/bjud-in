
import { useRef, useState, useCallback, useEffect } from 'react';
import * as GenAIModule from '@google/genai';
import { ConnectionStatus } from '../types';

// Robust import handling
const GoogleGenAI = GenAIModule.GoogleGenAI || (GenAIModule as any).default?.GoogleGenAI;
const Modality = GenAIModule.Modality || (GenAIModule as any).default?.Modality || { AUDIO: 'AUDIO' };

export const ExtendedStatus = {
    ...ConnectionStatus,
    STANDBY: 'standby'
} as const;

export type ExtendedStatusType = typeof ExtendedStatus[keyof typeof ExtendedStatus];

interface SessionConfig {
    apiKey?: string;
    systemInstruction: string;
    voiceName?: string;
}

interface SessionCallbacks {
    onAudioData: (data: string) => void;
    onTextData: (text: string) => void;
    onTurnComplete: () => void;
    onError: (error: string) => void;
    onConnect: () => void;
    onDisconnect: () => void;
    onMessageReceived?: () => void;
}

export function useGeminiSession(callbacks: SessionCallbacks) {
    const [status, setStatus] = useState<ExtendedStatusType>(ExtendedStatus.DISCONNECTED);
    const sessionRef = useRef<any | null>(null);
    const retryTimeoutRef = useRef<any>(null);
    const activeRef = useRef(false);
    
    // NEW: Track the ID of the current connection attempt to ignore stale events
    const connectionIdRef = useRef<number>(0);

    const connect = useCallback(async (config: SessionConfig) => {
        // TRUTH CHECK: API Key
        if (!config.apiKey || config.apiKey.length < 10) {
            console.error("[Session] ❌ CRITICAL: API_KEY appears invalid or missing.");
            callbacks.onError("API_KEY saknas eller är ogiltig");
            return;
        }
        
        // ZOMBIE CLEANUP: Always ensure previous session is dead before starting new
        if (sessionRef.current) {
            console.log("[Session] Cleaning up existing session before reconnect...");
            try { await sessionRef.current.close(); } catch(e) {}
            sessionRef.current = null;
        }

        // GENERATE TICKET ID
        const myConnectionId = Date.now();
        connectionIdRef.current = myConnectionId;

        setStatus(ExtendedStatus.CONNECTING);
        activeRef.current = true;

        try {
            const ai = new GoogleGenAI({ apiKey: config.apiKey });
            
            const sessionConfig = {
                model: 'gemini-2.5-flash-native-audio-preview-12-2025',
                config: {
                  responseModalities: [Modality.AUDIO], 
                  speechConfig: { 
                      voiceConfig: { prebuiltVoiceConfig: { voiceName: config.voiceName || 'Puck' } } 
                  },
                  outputAudioTranscription: {}, 
                  systemInstruction: config.systemInstruction
                },
            };

            const sessionPromise = ai.live.connect({
                ...sessionConfig,
                callbacks: {
                    onopen: () => {
                        // IGNORE IF STALE
                        if (connectionIdRef.current !== myConnectionId) return;

                        console.log(`[Session ${myConnectionId}] ✅ Socket Connected`);
                        setStatus(ExtendedStatus.CONNECTED);
                        callbacks.onConnect();
                    },
                    onmessage: async (message: any) => {
                        if (connectionIdRef.current !== myConnectionId) return;
                        
                        if (callbacks.onMessageReceived) callbacks.onMessageReceived();

                        const serverContent = message.serverContent;
                        
                        // 1. Handle Audio
                        if (serverContent?.modelTurn?.parts) {
                            for (const part of serverContent.modelTurn.parts) {
                                if (part.inlineData?.data) {
                                    callbacks.onAudioData(part.inlineData.data);
                                }
                            }
                        }

                        // 2. Handle Text (Subtitles)
                        if (serverContent?.outputTranscription?.text) {
                            callbacks.onTextData(serverContent.outputTranscription.text);
                        }
                        
                        // 3. Handle Turn Complete
                        if (serverContent?.turnComplete) {
                            callbacks.onTurnComplete();
                        }
                    },
                    onclose: (e) => {
                        // CRITICAL FIX: Only react if this is the CURRENT session closing
                        if (connectionIdRef.current !== myConnectionId) {
                            console.log(`[Session ${myConnectionId}] 👻 Stale session closed. Ignoring.`);
                            return;
                        }

                        console.log(`[Session ${myConnectionId}] 🔌 Socket Closed`, e);
                        if (activeRef.current && status !== ExtendedStatus.STANDBY) {
                            setStatus(ExtendedStatus.DISCONNECTED);
                            callbacks.onDisconnect();
                        }
                    },
                    onerror: (e: any) => {
                        if (connectionIdRef.current !== myConnectionId) return;

                        const msg = e.message || '';
                        console.error(`[Session ${myConnectionId}] ❌ Error:`, msg);
                        
                        if (msg.includes("Operation is not implemented")) return;

                        // Soft Retry Logic
                        if (msg.includes("unavailable") || msg.includes("503") || msg.includes("Internal error")) {
                             console.warn("[Session] Transient error, retrying...", msg);
                             if (activeRef.current) {
                                 try { sessionRef.current?.close(); } catch(err) {}
                                 sessionRef.current = null;
                                 retryTimeoutRef.current = setTimeout(() => connect(config), 1500);
                             }
                             return;
                        }
                        
                        setStatus(ExtendedStatus.ERROR);
                        callbacks.onError("Anslutningsfel: " + msg);
                    }
                }
            });

            const session = await sessionPromise;
            
            // Assign session only if we haven't started a NEW connection in the meantime
            if (connectionIdRef.current === myConnectionId) {
                sessionRef.current = session;
            } else {
                // If we are stale immediately after creation, close it
                try { session.close(); } catch(e) {}
            }

        } catch (e: any) {
            if (connectionIdRef.current !== myConnectionId) return;

            console.error("[Session] Connection Failed immediately", e);
            setStatus(ExtendedStatus.DISCONNECTED);
            callbacks.onError(e.message);
            
            if (activeRef.current) {
                retryTimeoutRef.current = setTimeout(() => connect(config), 3000);
            }
        }
    }, [status, callbacks]);

    const disconnect = useCallback(() => {
        // Invalidate current ID so no more callbacks fire
        connectionIdRef.current = 0; 
        
        activeRef.current = false;
        if (sessionRef.current) {
            try { sessionRef.current.close(); } catch(e) {}
            sessionRef.current = null;
        }
        if (retryTimeoutRef.current) clearTimeout(retryTimeoutRef.current);
        setStatus(ExtendedStatus.DISCONNECTED);
        callbacks.onDisconnect();
    }, [callbacks]);

    const sendAudio = useCallback((base64Audio: string) => {
        if (sessionRef.current && status === ExtendedStatus.CONNECTED) {
            try {
                // TRUTH LOGGING: Only log big events to save the browser console
                const size = base64Audio.length;
                if (size > 10000) {
                     console.log(`%c[Network] 🚀 FLUSHING BUFFER: ${size} bytes sent`, 'color: orange; font-weight: bold;');
                } 

                sessionRef.current.sendRealtimeInput({ 
                    media: { 
                        mimeType: 'audio/pcm;rate=16000', 
                        data: base64Audio 
                    } 
                });
                return true;
            } catch (e) {
                console.error("[Session] Send Failed", e);
                return false;
            }
        }
        return false;
    }, [status]);

    const setStandby = useCallback(() => {
        if (sessionRef.current) {
            try { sessionRef.current.close(); } catch(e) {}
            sessionRef.current = null;
        }
        setStatus(ExtendedStatus.STANDBY);
    }, []);

    return {
        status,
        connect,
        disconnect,
        sendAudio,
        setStandby,
        isActive: activeRef.current
    };
}

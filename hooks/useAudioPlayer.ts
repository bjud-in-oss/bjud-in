import { useState, useRef, useEffect, useCallback } from 'react';
import { decodeBase64, decodeAudioData } from '../utils/audioUtils';

interface AudioQueueItem {
    id: string; 
    buffer: AudioBuffer;
    groupId: number; 
    duration: number;
    scheduledTime: number; 
}

interface UseAudioPlayerProps {
    sampleRate?: number;
    outputDeviceId?: string; // NEW
}

export function useAudioPlayer({ sampleRate = 24000, outputDeviceId }: UseAudioPlayerProps = {}) {
    const [isPlaying, setIsPlaying] = useState(false);
    const [activeGroupId, setActiveGroupId] = useState<number | null>(null);
    const [activePhraseDuration, setActivePhraseDuration] = useState<number>(0); 
    const [bufferGap, setBufferGap] = useState(0);
    const [currentPlaybackRate, setCurrentPlaybackRate] = useState(1.0);
    const [throttledQueueLength, setThrottledQueueLength] = useState(0);

    const audioContextRef = useRef<AudioContext | null>(null);
    const nextPlayTimeRef = useRef<number>(0);
    const queueRef = useRef<AudioQueueItem[]>([]);
    
    // Tracking active playback
    const currentlyPlayingRef = useRef<{ groupId: number; endTime: number } | null>(null);
    const targetPlaybackRateRef = useRef(1.0);
    const animationFrameRef = useRef<number | null>(null);
    const lastUiUpdateRef = useRef<number>(0);

    // Config for Jitter Buffer
    const TARGET_BUFFER_SEC = 0.25; 
    const MAX_PLAYBACK_RATE = 1.05;
    const MIN_PLAYBACK_RATE = 0.95;

    // Apply Sink ID when context is created or device ID changes
    const applySinkId = useCallback(async (ctx: AudioContext, deviceId?: string) => {
        if (!deviceId || deviceId === 'default') return;
        
        // setSinkId is experimental/standard only in Secure Contexts in Chrome/Edge.
        // It is a method on AudioContext (Web Audio API) or HTMLMediaElement.
        if ('setSinkId' in ctx && typeof (ctx as any).setSinkId === 'function') {
            try {
                await (ctx as any).setSinkId(deviceId);
                console.log(`[AudioPlayer] Output device set to: ${deviceId}`);
            } catch (error) {
                console.warn("[AudioPlayer] Failed to set output device:", error);
            }
        }
    }, []);

    const initContext = useCallback(() => {
        if (!audioContextRef.current) {
            audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate });
            
            // Apply initial device ID if present
            if (outputDeviceId) {
                applySinkId(audioContextRef.current, outputDeviceId);
            }
        }
    }, [sampleRate, outputDeviceId, applySinkId]);

    // React to output device changes dynamically
    useEffect(() => {
        if (audioContextRef.current && outputDeviceId) {
            applySinkId(audioContextRef.current, outputDeviceId);
        }
    }, [outputDeviceId, applySinkId]);

    // NEW: Explicit resume function
    const resumeContext = useCallback(async () => {
        initContext();
        if (audioContextRef.current && audioContextRef.current.state === 'suspended') {
            try {
                await audioContextRef.current.resume();
                console.log("[AudioPlayer] Context resumed successfully");
            } catch (err) {
                console.warn("[AudioPlayer] Failed to resume context:", err);
            }
        }
    }, [initContext]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
                audioContextRef.current.close().catch(() => {});
            }
        };
    }, []);

    const processQueue = useCallback(() => {
        if (audioContextRef.current) {
            const ctx = audioContextRef.current;
            const now = ctx.currentTime;

            // 1. CLEANUP & STATE TRACKING
            if (currentlyPlayingRef.current && now > currentlyPlayingRef.current.endTime) {
                currentlyPlayingRef.current = null;
                if (queueRef.current.length === 0) {
                     setActiveGroupId(null); 
                     setActivePhraseDuration(0);
                     setIsPlaying(false);
                }
            }

            // 2. JITTER BUFFER LOGIC
            const queuedDurationSec = Math.max(0, nextPlayTimeRef.current - now);
            
            // CALC RATE
            let newRate = 1.0;
            if (queuedDurationSec > TARGET_BUFFER_SEC + 0.1) {
                newRate = Math.min(MAX_PLAYBACK_RATE, 1.0 + (queuedDurationSec - TARGET_BUFFER_SEC));
            } else if (queuedDurationSec < TARGET_BUFFER_SEC - 0.1 && queuedDurationSec > 0.05) {
                newRate = Math.max(MIN_PLAYBACK_RATE, 1.0 - (TARGET_BUFFER_SEC - queuedDurationSec));
            }

            const currentRate = targetPlaybackRateRef.current;
            targetPlaybackRateRef.current = currentRate + (newRate - currentRate) * 0.1;

            // THROTTLED UI UPDATES
            const sysNow = Date.now();
            if (sysNow - lastUiUpdateRef.current > 200) { 
                 setBufferGap(queuedDurationSec - TARGET_BUFFER_SEC);
                 setCurrentPlaybackRate(parseFloat(targetPlaybackRateRef.current.toFixed(2)));
                 setThrottledQueueLength(queueRef.current.length); 
                 lastUiUpdateRef.current = sysNow;
            }

            // 3. PLAY NEXT ITEM
            if (queueRef.current.length > 0) {
                const item = queueRef.current[0];
                
                let playAt = Math.max(now, nextPlayTimeRef.current);
                if (now - nextPlayTimeRef.current > 0.5) {
                     playAt = now; 
                }

                if (playAt - now < 0.05) {
                    queueRef.current.shift(); 
                    
                    const source = ctx.createBufferSource();
                    source.buffer = item.buffer;
                    source.playbackRate.value = targetPlaybackRateRef.current;
                    source.connect(ctx.destination);
                    
                    source.start(playAt);
                    
                    const duration = item.duration / source.playbackRate.value;
                    nextPlayTimeRef.current = playAt + duration;

                    currentlyPlayingRef.current = {
                        groupId: item.groupId,
                        endTime: nextPlayTimeRef.current
                    };
                    
                    setActiveGroupId(item.groupId);
                    setActivePhraseDuration(duration); 
                    setIsPlaying(true);
                }
            }
        }

        animationFrameRef.current = requestAnimationFrame(processQueue);
    }, []);

    useEffect(() => {
        animationFrameRef.current = requestAnimationFrame(processQueue);
        return () => {
            if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
        };
    }, [processQueue]);

    const addToQueue = useCallback(async (base64Data: string, groupId: number) => {
        initContext();
        if (audioContextRef.current?.state === 'suspended') {
             audioContextRef.current.resume().catch(() => {});
        }

        if (!audioContextRef.current) return;

        try {
            const pcmData = decodeBase64(base64Data);
            const audioBuffer = await decodeAudioData(pcmData, audioContextRef.current, sampleRate, 1);
            
            const item: AudioQueueItem = {
                id: Date.now().toString() + Math.random().toString(),
                buffer: audioBuffer,
                groupId: groupId,
                duration: audioBuffer.duration,
                scheduledTime: 0 
            };
            
            queueRef.current.push(item);
        } catch (e) {
            console.error("Audio Decode Error:", e);
        }
    }, [initContext, sampleRate]);

    const resetPlayer = useCallback(() => {
        if (audioContextRef.current) {
            queueRef.current = [];
            nextPlayTimeRef.current = 0;
            currentlyPlayingRef.current = null;
            setActiveGroupId(null);
            setActivePhraseDuration(0);
            setIsPlaying(false);
            setThrottledQueueLength(0);
        }
    }, []);

    return {
        addToQueue,
        resetPlayer,
        resumeContext, 
        isPlaying,
        activeGroupId,     
        activePhraseDuration, 
        bufferGap,
        currentPlaybackRate,
        queueLength: throttledQueueLength,
        audioContext: audioContextRef.current
    };
}
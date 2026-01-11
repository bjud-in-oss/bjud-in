
import { useEffect, useRef, MutableRefObject } from 'react';
import { ExtendedStatus, ExtendedStatusType } from './useGeminiSession';
import { VAD_CONFIG } from '../utils/vadLogic';

interface MonitorProps {
    activeMode: 'translate' | 'transcribe' | 'off';
    status: ExtendedStatusType;
    queueLength: number;
    inFlightCount: number;
    bufferGap: number;
    lastSpeechTimeRef: MutableRefObject<number>;
    actions: {
        setStandby: () => void;
        connect: () => void;
        flushAndSend: () => void;
        setNotification: (msg: string | null) => void;
    };
    // NEW: We need to know if there is REAL physical data waiting
    isBuffering: boolean;
}

export function useBackgroundMonitor({
    activeMode,
    status,
    queueLength,
    inFlightCount,
    bufferGap,
    lastSpeechTimeRef,
    actions,
    isBuffering
}: MonitorProps) {
    
    // Auto-Sleep & Lazy Connect Logic
    useEffect(() => {
        const checkActivity = setInterval(() => {
            if (activeMode === 'off') return;

            const now = Date.now();
            const timeSinceSpeech = now - lastSpeechTimeRef.current;

            // Auto Sleep
            // CRITICAL CHANGE: We only sleep if NOT buffering physical audio. 
            // We ignore Q-LOG (queueLength) because it might desync.
            if (status === ExtendedStatus.CONNECTED && timeSinceSpeech > VAD_CONFIG.AUTO_SLEEP_TIMEOUT_MS && !isBuffering) {
                console.log("AutoSleep: Entering Standby Mode.");
                actions.setStandby();
            }

            // Lazy Connect
            // CRITICAL CHANGE: Only wake up if we actually have data in the buffer (isBuffering),
            // OR if the logical queue is very high (safety net), but primarily physical buffer.
            const needsWakeup = isBuffering;

            if ((status === ExtendedStatus.DISCONNECTED || status === ExtendedStatus.STANDBY) && needsWakeup) {
                 console.log("BackgroundMonitor: Waking up due to physical buffer...");
                 actions.connect();
            } else if (status === ExtendedStatus.CONNECTED && needsWakeup && inFlightCount === 0) {
                 // Force flush if we have data but nothing is moving
                 actions.flushAndSend();
            }
        }, 1000);
        return () => clearInterval(checkActivity);
    }, [status, queueLength, inFlightCount, activeMode, actions, lastSpeechTimeRef, isBuffering]); 

    // Buffer Warning Logic
    useEffect(() => {
        const interval = setInterval(() => {
            if (status === ExtendedStatus.CONNECTED && bufferGap > 2.0) {
                 actions.setNotification("Tips: Vi ligger efter. Öka 'AI Talhastighet' i inställningar.");
                 setTimeout(() => actions.setNotification(null), 5000);
            }
        }, 5000);
        return () => clearInterval(interval);
      }, [bufferGap, status, actions]);
}

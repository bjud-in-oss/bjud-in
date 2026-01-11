
import { useState, useRef, useCallback } from 'react';
import { QueueStats } from '../types';
import { DataPoint, PredictionModel, calculateRegressionModel, predictWaitTime } from '../utils/adaptiveLogic';

const MAX_VALID_RTT = 5000;

interface TurnTiming {
    sentAt: number;
    duration: number;
}

interface PacketEvents {
    sending: boolean;
    receiving: boolean;
}

export function useLiveDiagnostics() {
    // --- STATE ---
    const [packetEvents, setPacketEvents] = useState<PacketEvents>({ sending: false, receiving: false });
    const [queueStats, setQueueStats] = useState<QueueStats>({ 
        isBuffering: false, lastBufferDuration: 0, processing: 0, outQueue: 0, 
        efficiencyRatio: 100, confirmedHandshakes: 0, bufferGap: 0,
        modelDiagnostics: { processingRate: 0.5, fixedOverhead: 300, safetyMargin: 100, confidence: 0 }
    });

    // --- REFS ---
    const busyUntilRef = useRef<number>(0); 
    const lastBufferDurationRef = useRef<number>(0);
    const turnTimingsRef = useRef<Map<string, TurnTiming>>(new Map());
    const sentTurnOrderRef = useRef<string[]>([]);
    const rttHistoryRef = useRef<DataPoint[]>([]); 
    const isReceivingStreamRef = useRef<boolean>(false);
    const predictionModelRef = useRef<PredictionModel>({ processingRate: 0.5, fixedOverhead: 300, safetyMargin: 100, confidence: 0 });
    const latestRttRef = useRef<number>(0); // NEW

    // --- ACTIONS ---

    const trackSentTurn = useCallback((turnId: string, durationMs: number) => {
        setPacketEvents(prev => ({ ...prev, sending: !prev.sending }));
        lastBufferDurationRef.current = durationMs;

        const now = Date.now();
        turnTimingsRef.current.set(turnId, { sentAt: now, duration: durationMs });
        sentTurnOrderRef.current.push(turnId);
        
        // Predict how long AI will be busy based on current model
        const predictedWait = predictWaitTime(durationMs, predictionModelRef.current);
        busyUntilRef.current = now + predictedWait;
    }, []);

    const trackStreamPacket = useCallback(() => {
        // Only run RTT logic on the *first* packet of a response stream
        if (!isReceivingStreamRef.current) {
            isReceivingStreamRef.current = true;
            const now = Date.now();
            
            // Cleanup expired entries
            while (sentTurnOrderRef.current.length > 0) {
                const headId = sentTurnOrderRef.current[0];
                const timing = turnTimingsRef.current.get(headId);
                if (!timing) { sentTurnOrderRef.current.shift(); continue; }
                if (now - timing.sentAt > MAX_VALID_RTT) {
                    sentTurnOrderRef.current.shift();
                    turnTimingsRef.current.delete(headId);
                    continue;
                }
                break;
            }
            
            // Calculate RTT for the oldest valid turn
            const oldestTurnId = sentTurnOrderRef.current.shift();
            if (oldestTurnId) {
                const timing = turnTimingsRef.current.get(oldestTurnId);
                if (timing) {
                    const rtt = now - timing.sentAt;
                    latestRttRef.current = rtt; // Store raw network RTT
                    
                    if (rtt <= MAX_VALID_RTT && timing.duration > 500) {
                        const history = rttHistoryRef.current;
                        history.push({ inputDuration: timing.duration, rtt });
                        if (history.length > 20) history.shift();
                        predictionModelRef.current = calculateRegressionModel(history);
                    }
                    turnTimingsRef.current.delete(oldestTurnId);
                }
            }
        }
        
        setPacketEvents(prev => ({ ...prev, receiving: !prev.receiving }));
    }, []);

    const trackTurnComplete = useCallback(() => {
        isReceivingStreamRef.current = false;
        // Cleanup if we missed the start
        if (sentTurnOrderRef.current.length > 0) {
             const completedId = sentTurnOrderRef.current[0];
             sentTurnOrderRef.current.shift();
             turnTimingsRef.current.delete(completedId);
        }
    }, []);

    const resetDiagnostics = useCallback(() => {
        turnTimingsRef.current.clear();
        sentTurnOrderRef.current = [];
        rttHistoryRef.current = [];
        isReceivingStreamRef.current = false;
        predictionModelRef.current = { processingRate: 0.5, fixedOverhead: 300, safetyMargin: 100, confidence: 0 };
        latestRttRef.current = 0;
    }, []);

    const updateStats = useCallback((
        sentPhrases: number, 
        receivedPhrases: number, 
        inQueue: number, 
        inFlight: number, 
        outQueue: number, 
        bufferGap: number
    ) => {
        const ratio = sentPhrases > 0 ? Math.round((receivedPhrases / sentPhrases) * 100) : 100;
        
        setQueueStats({ 
            isBuffering: inQueue > 0 || outQueue > 0,
            lastBufferDuration: lastBufferDurationRef.current,
            processing: inFlight, 
            outQueue: outQueue, 
            efficiencyRatio: ratio,
            confirmedHandshakes: receivedPhrases,
            modelDiagnostics: predictionModelRef.current,
            bufferGap: bufferGap
        });
    }, []);

    return {
        queueStats,
        packetEvents,
        trackSentTurn,
        trackStreamPacket,
        trackTurnComplete,
        resetDiagnostics,
        updateStats,
        busyUntilRef, // Exported to be used by VAD logic
        latestRtt: latestRttRef.current // NEW
    };
}

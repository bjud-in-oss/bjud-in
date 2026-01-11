
import { useState, useRef, useCallback } from 'react';
import { TurnPackage } from '../types';

export function useTurnQueue() {
    const pendingQueueRef = useRef<TurnPackage[]>([]);
    const inFlightIdsRef = useRef<Set<string>>(new Set());
    const [queueLength, setQueueLength] = useState(0);

    const enqueueTurn = useCallback((turn: TurnPackage) => {
        // Simple logic: Add to queue
        pendingQueueRef.current.push(turn);
        setQueueLength(pendingQueueRef.current.length);
        
        // Disabled verbose logging
        // if ((window as any).APP_LOGS_ENABLED) {
        //     console.log(`[Queue] Enqueued turn ${turn.id}. Total pending: ${pendingQueueRef.current.length}`);
        // }
    }, []);

    const flushQueue = useCallback((): TurnPackage[] => {
        if (pendingQueueRef.current.length === 0) return [];
        
        const items = [...pendingQueueRef.current];
        pendingQueueRef.current = [];
        setQueueLength(0);
        
        // Mark all as in-flight
        items.forEach(item => inFlightIdsRef.current.add(item.id));
        
        return items;
    }, []);

    const markTurnAsSent = useCallback((id: string) => {
        inFlightIdsRef.current.add(id);
    }, []);

    const confirmTurnComplete = useCallback((id: string) => {
        if (inFlightIdsRef.current.has(id)) {
            inFlightIdsRef.current.delete(id);
            // Disabled verbose logging
            // if ((window as any).APP_LOGS_ENABLED) {
            //     console.log(`[Queue] Turn ${id} confirmed complete by model.`);
            // }
            return true;
        }
        return false;
    }, []);

    const confirmOldestTurn = useCallback(() => {
        if (inFlightIdsRef.current.size > 0) {
            // Set maintains insertion order. The first value is the oldest.
            const oldestId = inFlightIdsRef.current.values().next().value;
            if (oldestId) {
                inFlightIdsRef.current.delete(oldestId);
                // Disabled verbose logging
                // if ((window as any).APP_LOGS_ENABLED) {
                //     console.log(`[Queue] Oldest turn ${oldestId} confirmed complete by model (FIFO).`);
                // }
                return true;
            }
        }
        return false;
    }, []);

    const isPendingWork = useCallback(() => {
        return inFlightIdsRef.current.size > 0 || pendingQueueRef.current.length > 0;
    }, []);

    return {
        enqueueTurn,
        flushQueue,
        markTurnAsSent,
        confirmTurnComplete,
        confirmOldestTurn,
        isPendingWork,
        queueLength,
        inFlightCount: inFlightIdsRef.current.size
    };
}

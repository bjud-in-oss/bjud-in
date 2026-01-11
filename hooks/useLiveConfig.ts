import { useState, useEffect } from 'react';
import { VAD_CONFIG } from '../utils/vadLogic';

export function useLiveConfig() {
    const [targetLanguages, setTargetLanguages] = useState<string[]>(['Svenska']);
    const [currentRoom, setCurrentRoom] = useState("Stora salen");
    
    // Configurable Parameters
    const [minTurnDuration, setMinTurnDuration] = useState<number>(VAD_CONFIG.MIN_TURN_DURATION_DEFAULT);
    const [vadThreshold, setVadThreshold] = useState<number>(0.6);
    const [silenceThreshold, setSilenceThreshold] = useState<number>(VAD_CONFIG.SILENCE_THRESHOLD_MS); 
    const [volMultiplier, setVolMultiplier] = useState<number>(1.0); 
    
    // DEVICE SELECTION
    const [inputDeviceId, setInputDeviceId] = useState<string>('default');
    const [outputDeviceId, setOutputDeviceId] = useState<string>('default');

    const [debugMode, setDebugMode] = useState<boolean>(false);
    const [aiSpeakingRate, setAiSpeakingRate] = useState<number>(1.0); 
    const [activeMode, setActiveMode] = useState<'translate' | 'transcribe' | 'off'>('off');
    
    // PERSISTENT: Console Log Control (Default FALSE)
    const [enableLogs, setEnableLogs] = useState<boolean>(() => {
        const saved = localStorage.getItem('app_enable_logs');
        return saved === 'true'; // Defaults to false if null/undefined
    });

    // PERSISTENT: Custom System Instruction
    const [customSystemInstruction, setCustomSystemInstruction] = useState<string | null>(() => {
        return localStorage.getItem('app_custom_prompt') || null;
    });

    // Save Logs setting
    useEffect(() => {
        localStorage.setItem('app_enable_logs', String(enableLogs));
        (window as any).APP_LOGS_ENABLED = enableLogs;
        if (enableLogs) {
            console.log("[System] 🟢 Console Logs Enabled");
        } 
    }, [enableLogs]);

    // Save Prompt setting
    useEffect(() => {
        if (customSystemInstruction) {
            localStorage.setItem('app_custom_prompt', customSystemInstruction);
        } else {
            localStorage.removeItem('app_custom_prompt');
        }
    }, [customSystemInstruction]);

    return {
        targetLanguages, setTargetLanguages,
        currentRoom, setCurrentRoom,
        
        // Audio/VAD Config
        minTurnDuration, setMinTurnDuration,
        vadThreshold, setVadThreshold,
        silenceThreshold, setSilenceThreshold,
        volMultiplier, setVolMultiplier,
        
        // Devices
        inputDeviceId, setInputDeviceId,
        outputDeviceId, setOutputDeviceId,

        debugMode, setDebugMode,
        aiSpeakingRate, setAiSpeakingRate,
        activeMode, setActiveMode,
        
        enableLogs, setEnableLogs,
        customSystemInstruction, setCustomSystemInstruction
    };
}
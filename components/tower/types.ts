

export interface DiagnosticData {
    // Audio Layer
    rms: number;           
    framesProcessed: number; 
    audioContextState: string; 
    sampleRate: number; 
    audioContextTime: number; 

    // Logic Layer
    vadProb: number;       
    vadThreshold: number;  
    isSpeaking: boolean;   
    isBuffering: boolean;  
    bufferSize: number;    
    activeMode: string;
    bufferGap: number;
    silenceDuration: number; 
    currentLatency: number; 
    
    // NEW METRICS
    rtt: number;           // Network Round Trip Time (ms)
    volMultiplier: number; // Software Input Gain
    silenceThreshold: number; // NEW
    busyRemaining: number;
    queueLength: number;
    autoSleepCountdown: number;

    // DEBUGGING DEEP DIVE
    connectingBufferSize: number; 
    inFlightCount: number;        
    timeSinceLastSpeech: number;  
    avgVadProb: number; 

    // Network Layer
    networkEvent: 'idle' | 'normal' | 'flush'; 
    serverRx: boolean;
    wsState: string; 

    // Hardware Diagnostics
    trackReadyState: string;
    trackMuted: boolean;
}

export interface LayerProps {
    // A callback to trigger the "Knowledge Base" popup in the parent
    onExplain: (key: string) => void;
    // Callback to show module-level help
    onHelp: (moduleKey: string) => void;
}

// NEW: Knowledge Base Types
export interface Relation {
    id: string;
    desc: string; // Description of HOW it affects/is affected
}

export interface KnowledgeEntry {
    title: string;
    text: string;
    good: string;
    tags?: string[]; // NEW: Tags for Phases (P1, P2, P3, P4) and Logic (Pred)
    affects: Relation[];     // Outgoing (Yellow)
    affectedBy: Relation[];  // Incoming (Blue)
}

export interface ModuleDoc {
    title: string;
    description: string;
    params: { abbr: string; full: string; desc: string }[];
}

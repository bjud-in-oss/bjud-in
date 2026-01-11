
export interface TranscriptItem {
  id: string;
  groupId: number; // For grouping interactions (Input #1 -> Output #1)
  role: 'user' | 'model'; // 'user' is the speaker, 'model' is the interpreter
  text: string;
  timestamp: Date;
  isPartial?: boolean;
  workerIndex?: number; // 0, 1, 2
  workerName?: string; // Puck, Kore, Fenrir
}

export interface AudioConfig {
  sampleRate: number;
}

export interface TurnPackage {
  id: string;
  audioData: string; // Base64 PCM
  timestamp: number;
  durationMs: number;
  confidenceScore: number; // 0-1
}

export interface AudioGroup {
  id: string;
  text: string;
  duration?: number;
}

// Converted to POJO (Plain Old JavaScript Object) for better compatibility
export const ConnectionStatus = {
  DISCONNECTED: 'disconnected',
  CONNECTING: 'connecting',
  CONNECTED: 'connected',
  ERROR: 'error',
} as const;

export type ConnectionStatus = typeof ConnectionStatus[keyof typeof ConnectionStatus];

// Moved here from useGeminiLive.ts
export interface QueueStats {
    isBuffering: boolean;       
    lastBufferDuration: number; 
    processing: number;
    outQueue: number;
    efficiencyRatio: number;
    confirmedHandshakes: number;
    modelDiagnostics: { 
        processingRate: number; 
        fixedOverhead: number; 
        safetyMargin: number; 
        confidence: number; 
    }; 
    bufferGap: number; 
}

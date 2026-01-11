
import { DiagnosticData } from './types';
import { FunctionDeclaration, Type } from '@google/genai';
import { KNOWLEDGE_BASE } from './TowerKnowledge';

export const DOCTOR_TOOLS: { functionDeclarations: FunctionDeclaration[] }[] = [{
  functionDeclarations: [{
    name: 'run_passive_probe',
    description: 'ACTION: "Stethoscope". Measures if AudioFrames are incrementing without injecting audio. Detects Engine Stall.',
    parameters: { type: Type.OBJECT, properties: {}, required: [] }
  }, {
    name: 'inject_test_signal',
    description: 'ACTION: Inject a 440Hz beep to verify AudioContext/Output.',
    parameters: { type: Type.OBJECT, properties: {}, required: [] }
  }, {
    name: 'speak_test_phrase',
    description: 'ACTION: Inject a single TTS phrase to test the pipeline once.',
    parameters: {
        type: Type.OBJECT,
        properties: {
            phrase: { type: Type.STRING, description: 'Text to inject.' }
        },
        required: ['phrase']
    }
  }, {
    name: 'run_stress_test',
    description: 'ACTION: Run a multi-turn conversation loop (3 phrases) to test stability and "unstick" the engine.',
    parameters: { type: Type.OBJECT, properties: {}, required: [] }
  }, {
    name: 'force_flush_buffers',
    description: 'ACTION: Force clear all audio buffers. Use this if the system status is stuck on "Buffering" or "Busy".',
    parameters: { type: Type.OBJECT, properties: {}, required: [] }
  }, {
      name: 'adjust_configuration',
      description: 'ACTION: Change a parameter (Threshold, Latency/Duration, Speed).',
      parameters: {
          type: Type.OBJECT,
          properties: {
              parameter: {
                  type: Type.STRING,
                  enum: ['vadThreshold', 'minTurnDuration', 'aiSpeakingRate'],
              },
              value: { type: Type.NUMBER }
          },
          required: ['parameter', 'value']
      }
  }, {
      name: 'toggle_connection',
      description: 'ACTION: Restart the WebSocket connection.',
      parameters: {
          type: Type.OBJECT,
          properties: {
              action: { type: Type.STRING, enum: ['connect', 'disconnect'] }
          },
          required: ['action']
      }
  }, {
      name: 'generate_full_report',
      description: 'ACTION: Generates a full clipboard report for the developer.',
      parameters: { type: Type.OBJECT, properties: {}, required: [] }
  }, {
      name: 'mark_resolved',
      description: 'ACTION: Mark a subsystem as working.',
      parameters: {
          type: Type.OBJECT,
          properties: {
              system: { type: Type.STRING, enum: ['AUDIO_INPUT', 'AUDIO_OUTPUT', 'NETWORK', 'CONFIG'] }
          },
          required: ['system']
      }
  }]
}];

// --- SERIALIZE KNOWLEDGE BASE ---
const SYSTEM_MAP = Object.entries(KNOWLEDGE_BASE).map(([key, node]) => {
    const affects = node.affects.length > 0 
        ? ` -> Affects: [${node.affects.map(r => r.id).join(', ')}]` 
        : '';
    const dependedOn = node.affectedBy.length > 0
        ? ` <- Depends on: [${node.affectedBy.map(r => r.id).join(', ')}]`
        : '';
        
    return `- ${key} (${node.title}): Ideal="${node.good}".${affects}${dependedOn}`;
}).join('\n');

const PHASE_LOGIC = `
[DIAGNOSTIC PROTOCOL]
1. CHECK AUDIO ENGINE: Use 'run_passive_probe'.
   - If Frames Delta == 0: "ZOMBIE STATE". AudioContext is active but ScriptProcessor is dead.
   - If Frames Delta > 0 but RMS == 0: "MIC MUTE". Engine works, but input is silent.
2. CHECK PIPELINE: If Engine is OK, use 'inject_test_signal'.
3. CHECK NETWORK: If Signal is OK but no response, check WS State.
`;

export function generateDoctorPrompt(
    snapshot: DiagnosticData, 
    history: string[], 
    verifiedSystems: string[],
    hints: string
): string {
    return `
    ROLE: Dr. Tower (System Architect & Diagnostic Co-Pilot).
    
    SYSTEM ARCHITECTURE (DEPENDENCY GRAPH):
    ${SYSTEM_MAP}

    ${PHASE_LOGIC}

    LIVE TELEMETRY (SNAPSHOT):
    - RMS (Vol): ${snapshot.rms.toFixed(4)}
    - Frames Processed: ${snapshot.framesProcessed}
    - Audio Ctx State: ${snapshot.audioContextState}
    - WS State: ${snapshot.wsState}
    - State: ${snapshot.isSpeaking ? 'SPEAKING' : snapshot.busyRemaining > 0 ? 'PROCESSING' : 'IDLE'}
    
    CHECKPOINTS VERIFIED: ${verifiedSystems.length > 0 ? verifiedSystems.join(', ') : "None yet."}
    
    USER QUERY: "${hints}"

    HISTORY:
    ${history.length > 0 ? history.join('\n') : "(Session Start)"}

    INSTRUCTIONS:
    1. If the user complains about "start" or "connection", run the 'run_passive_probe' first to check for Zombie State.
    2. Be concise.
    `;
}

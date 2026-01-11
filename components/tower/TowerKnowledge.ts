
import { KnowledgeEntry, ModuleDoc } from './types';

// --- MODULE DOCUMENTATION ---
export const MODULE_DOCS: Record<string, ModuleDoc> = {
    'MODULE_NETWORK': {
        title: 'Nätverksmodul (Connection)',
        description: 'Hanterar den fysiska kopplingen mot Googles servrar. Här ser du om "sladden sitter i" och om data flödar.',
        params: [
            { abbr: 'WS', full: 'WebSocket', desc: 'Den öppna tunneln mot Google.' },
            { abbr: 'KEY', full: 'API Key', desc: 'Din "biljett" för att få använda tjänsten.' },
            { abbr: 'TX', full: 'Transmit', desc: 'Data som skickas FRÅN oss TILL Google (Mikrofon).' },
            { abbr: 'RX', full: 'Receive', desc: 'Data som kommer FRÅN Google TILL oss (Översättning).' }
        ]
    },
    'MODULE_LOGIC': {
        title: 'Logikmodul (The Brain)',
        description: 'Här fattas besluten. Ska vi skicka ljud? Är det tyst? Ska vi sova? Detta är systemets dirigent.',
        params: [
            // Row 1: Core VAD
            { abbr: 'VAD', full: 'Voice Activity Detection', desc: 'Sannolikhet (0-100%) att nuvarande ljudbuffert innehåller tal.' },
            { abbr: 'THR', full: 'Threshold (Tröskel)', desc: 'Gränsen för när VAD ska trigga "Talar".' },
            { abbr: 'SPK', full: 'Speaking State', desc: 'JA/NEJ - Systemet anser att någon pratar.' },
            { abbr: 'SIL', full: 'Silence Timer', desc: 'Hur länge det varit tyst. Styr när meningar avslutas.' },
            
            // Row 2: System State
            { abbr: 'GAP', full: 'Buffer Gap', desc: 'Tidsskillnad mellan inkommande ljud och uppspelning.' },
            { abbr: 'BUF', full: 'Physical Buffer', desc: 'Antal ljudpaket i kö för att skickas.' },
            { abbr: 'MODE', full: 'Active Mode', desc: 'Systemläge (Translate / Off).' },
            { abbr: 'LTC', full: 'Latency', desc: 'Total fördröjning i millisekunder.' },
            
            // Row 3: Logic Queue
            { abbr: 'BSY', full: 'Busy Prediction', desc: 'Uppskattad tid AI:n är upptagen med att tänka.' },
            { abbr: 'Q_LN', full: 'Queue Length', desc: 'Antal meningar som väntar på att skickas.' },
            { abbr: 'ASLP', full: 'Auto Sleep', desc: 'Nedräkning till strömsparläge.' },
            { abbr: 'V_ST', full: 'VAD State', desc: 'Status: READY, WARM (hör ljud), HOT (hör tal).' },
            
            // Row 4: Deep Debug
            { abbr: 'CN_B', full: 'Connection Buffer', desc: 'Ljud som sparas medan vi väntar på återanslutning.' },
            { abbr: 'INF', full: 'In Flight', desc: 'Paket som skickats men inte fått svar än.' },
            { abbr: 'L_TS', full: 'Last Speech', desc: 'Tid sedan någon sa något senast.' },
            { abbr: 'V_AVG', full: 'VAD Average', desc: 'Genomsnittlig röstsannolikhet över tid.' },

            // Row 5: Lab
            { abbr: 'RTT', full: 'Round Trip Time', desc: 'Tid för signal att nå servern och vända.' },
            { abbr: 'VOL', full: 'Volume Gain', desc: 'Mjukvaruförstärkning av mikrofonen.' }
        ]
    },
    'MODULE_AUDIO': {
        title: 'Ljudmodul (Audio Engine)',
        description: 'Hanterar webbläsarens mikrofon och högtalare. Rådata innan den blir logik.',
        params: [
            { abbr: 'RMS', full: 'Root Mean Square', desc: 'Ljudvolym/Energi.' },
            { abbr: 'SR', full: 'Sample Rate', desc: 'Ljudkvalitet (Hz).' },
            { abbr: 'CTX', full: 'Audio Context', desc: 'Webbläsarens ljudmotor.' },
            { abbr: 'FRM', full: 'Frame Counter', desc: 'Räknare för bearbetade ljudblock.' }
        ]
    },
    'MODULE_CONFIG': {
        title: 'Konfigurationsmodul (Settings)',
        description: 'Dina reglage för att styra systemet. Dessa värden ändrar hur Logikmodulen beter sig.',
        params: [
            { abbr: 'VAD Threshold', full: 'Bruskänslighet', desc: 'Bestämmer hur högt man måste prata.' },
            { abbr: 'Min Turn', full: 'Latens/Buffert', desc: 'Hur mycket ljud vi samlar innan sändning.' },
            { abbr: 'AI Speed', full: 'Talhastighet', desc: 'Hur snabbt AI:n ska läsa upp översättningen.' }
        ]
    }
};

export const KNOWLEDGE_BASE: Record<string, KnowledgeEntry> = {
    // --- AUDIO LAYER ---
    'RMS': { 
        title: 'Energi (RMS)', 
        text: 'Rå signalstyrka från mikrofonen. Första filtret. Låg energi = Ingen processering.', 
        good: '> 0.002',
        tags: ['FAS 1'],
        affects: [
            { id: 'VAD', desc: 'Ger data till modellen' }
        ],
        affectedBy: [
            { id: 'VOL', desc: 'Multipliceras av' }
        ]
    },
    'SR': { 
        title: 'Sample Rate', 
        text: 'Samplingsfrekvens. Måste vara 16kHz eller 24kHz för Gemini.', 
        good: '16000', 
        tags: ['INIT'],
        affects: [{ id: 'CTX', desc: 'Krävs för start' }],
        affectedBy: []
    },
    'CTX': { 
        title: 'Audio Context', 
        text: 'Web Audio API-motorn. Måste vara RUNNING.', 
        good: 'RUN', 
        tags: ['INIT'],
        affects: [{ id: 'FRM', desc: 'Driver loopen' }],
        affectedBy: []
    },
    'FRM': { 
        title: 'Frame Counter', 
        text: 'Hjärtslags-räknare. Visar att loopen lever.', 
        good: 'Ökar', 
        tags: ['SYSTEM'],
        affects: [],
        affectedBy: []
    },
    
    // --- LOGIC LAYER (VAD) ---
    'VAD': { 
        title: 'Neural Probability (VAD)', 
        text: 'Sannolikheten (0-100%) att nuvarande ljudbuffert innehåller tal.', 
        good: '> THR', 
        tags: ['FAS 1', 'AI'],
        affects: [
            { id: 'SPK', desc: 'Triggar tal-status' }
        ],
        affectedBy: [
            { id: 'RMS', desc: 'Kräver insignal' }
        ]
    },
    'THR': { 
        title: 'Threshold (Tröskelvärde)', 
        text: 'Gränsvärdet du ställer in i Konfigurationen. Avgör när VAD blir SPK.', 
        good: 'Justerbar', 
        tags: ['CONFIG'],
        affects: [{ id: 'SPK', desc: 'Agerar brytpunkt' }],
        affectedBy: [] 
    },
    'SPK': { 
        title: 'Speaking State', 
        text: 'Beslutet: Pratar användaren? Styr buffring och tystnadstimer.', 
        good: 'JA vid tal', 
        tags: ['FAS 1', 'LOGIC'],
        affects: [
            { id: 'SIL', desc: 'Nollställer timern' },
            { id: 'BUF', desc: 'Fyller bufferten' }
        ],
        affectedBy: [
            { id: 'VAD', desc: 'Input data' },
            { id: 'THR', desc: 'Gränsvärde' }
        ]
    },
    'SIL': { 
        title: 'Silence Timer', 
        text: 'Sekunder sedan senaste tal. Avgör när meningar avslutas.', 
        good: '< 120s', 
        tags: ['FAS 2', 'LOGIC'],
        affects: [{ id: 'ASLP', desc: 'Driver nedräkning' }],
        affectedBy: [{ id: 'SPK', desc: 'Nollställer' }]
    },

    // --- SYSTEM ---
    'GAP': { 
        title: 'Jitter Buffer Gap', 
        text: 'Skillnad mellan mottaget och uppspelat ljud. Påverkar "hackighet".', 
        good: '~0.25s', 
        tags: ['FAS 4'],
        affects: [{ id: 'LTC', desc: 'Ökar latens' }],
        affectedBy: [{ id: 'RX', desc: 'Fyller på gapet' }]
    },
    'BUF': { 
        title: 'Physical Buffer', 
        text: 'Paket i kö för att skickas till Google.', 
        good: '0', 
        tags: ['FAS 1'],
        affects: [{ id: 'TX', desc: 'Ger data' }],
        affectedBy: [{ id: 'SPK', desc: 'Skapar paket' }]
    },
    'MODE': { 
        title: 'Active Mode', 
        text: 'Systemläge (OFF / TRANSLATE).', 
        good: 'TRANS', 
        tags: ['SYSTEM'],
        affects: [{ id: 'WS', desc: 'Styr anslutning' }],
        affectedBy: []
    },
    'LTC': { 
        title: 'Total Latency', 
        text: 'Total tid från tal till översättning (RTT + AI + Buffer).', 
        good: '< 1s', 
        tags: ['SYSTEM'],
        affects: [],
        affectedBy: [{ id: 'GAP', desc: 'Del av totalen' }]
    },

    // --- QUEUE/DEBUG ---
    'BSY': { title: 'Busy Pred', text: 'AI upptagen-gissning (Prediktiv modell).', good: '0ms', tags:['PRED', 'FAS 3'], affects: [], affectedBy: [] },
    'Q_LN': { title: 'Logical Queue', text: 'Antal turer i kö (logiskt).', good: 'Låg', tags:['LOGIC'], affects: [], affectedBy: [] },
    'ASLP': { title: 'Auto Sleep', text: 'Tid till vila (Strömsparläge).', good: '>0', tags:['SYSTEM'], affects: [{ id: 'WS', desc: 'Stänger' }], affectedBy: [{ id: 'SIL', desc: 'Matar tid' }] },
    'V_ST': { title: 'VAD State', text: 'READY (Tyst) / WARM (Ljud) / HOT (Tal).', good: 'Dyn', tags:['FAS 1'], affects: [], affectedBy: [] },
    
    // --- DEEP DEBUG ---
    'CN_B': { title: 'Conn Buffer', text: 'Ljudbuffert som sparas under uppkoppling.', good: '0', tags:['NET'], affects: [], affectedBy: [] },
    'INF': { title: 'In Flight', text: 'Paket skickade till Google utan svar än.', good: '0', tags:['FAS 2'], affects: [], affectedBy: [] },
    'L_TS': { title: 'Last Speech', text: 'Millisekunder sedan senaste tal-aktivitet.', good: 'ms', tags:['FAS 1'], affects: [], affectedBy: [] },
    'V_AVG': { title: 'VAD Avg', text: 'Medelvärde av röstsannolikhet (utjämning).', good: '<10', tags:['AI'], affects: [], affectedBy: [] },

    // --- LAB METRICS ---
    'RTT': { title: 'Round Trip Time', text: 'Ping-tid. Tid från att vi skickar till att vi får första svaret.', good: '<300ms', tags:['FAS 2', 'PRED'], affects: [{id: 'BSY', desc: 'Input till modell'}], affectedBy: [{id: 'WS', desc: 'Beroende av'}] },
    'VOL': { title: 'Volume Multiplier', text: 'Digital förstärkning av mikrofonen innan VAD.', good: '1.0x', tags:['FAS 1', 'CONFIG'], affects: [{id: 'RMS', desc: 'Ökar signal'}], affectedBy: [] },

    // --- NETWORK ---
    'WS': { title: 'WebSocket', text: 'Koppling mot Google.', good: 'OPEN', tags:['NET'], affects: [{ id: 'BUF', desc: 'Tömmer' }], affectedBy: [] },
    'KEY': { title: 'API Key', text: 'Autentisering.', good: 'OK', tags:['AUTH'], affects: [{ id: 'WS', desc: 'Auth' }], affectedBy: [] },
    'TX': { title: 'Transmit', text: 'Skickar data.', good: 'Blink', tags:['FAS 1'], affects: [], affectedBy: [{ id: 'BUF', desc: 'Källa' }] },
    'RX': { title: 'Receive', text: 'Tar emot data.', good: 'Blink', tags:['FAS 4'], affects: [{ id: 'GAP', desc: 'Fyller' }], affectedBy: [{ id: 'WS', desc: 'Kanal' }] },
};

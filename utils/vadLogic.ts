
export const VAD_CONFIG = {
    RMS_THRESHOLD: 0.015,         // Kept for visualization only
    MIN_SPEECH_DURATION: 150,     // FIXED: Reduced from 350ms to 150ms to capture short words
    MIN_TURN_DURATION_DEFAULT: 600, // Default latency setting (User slider)
    MAX_TURN_DURATION: 15000,     // Max chunk size for continuous streaming
    SILENCE_THRESHOLD_MS: 500,    // TUNED: Reduced to 500ms to flush buffers faster in continuous speech
    AUTO_SLEEP_TIMEOUT_MS: 120000,
    MIN_PHRASE_AVERAGE_RMS: 0.01   
};

export function calculateRMS(data: Float32Array): number {
    let sum = 0;
    for(let i=0; i<data.length; i++) sum += data[i] * data[i];
    return Math.sqrt(sum / data.length);
}

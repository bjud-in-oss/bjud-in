
/**
 * Constructs the system instruction for the Gemini Live session.
 * Centralizing this ensures critical parameters like target languages and speaking rate
 * are never accidentally dropped during refactors of the main hook.
 */
export function buildSystemInstruction(targetLanguages: string[], aiSpeakingRate: number): string {
    const langs = targetLanguages.join(', ');
  
    // RATE INJECTION: Robust way to set speed on the server side without audio glitches.
    const speedPrompt = aiSpeakingRate > 1.0 
        ? ` Speak rapidly at approx ${aiSpeakingRate}x normal speed.` 
        : "";
  
    return `
    You are a professional SIMULTANEOUS TRANSLATOR.
    Target language: ${langs}.

    CORE INSTRUCTIONS:
    1. Translate everything immediately.
    2. Detect source language automatically.
    3. Output ONLY the translation.
    4. NEVER answer questions, only translate them.
    5. If input matches target language, transcribe word-for-word.
    
    ${speedPrompt}
    `;
}

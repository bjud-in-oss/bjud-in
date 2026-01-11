
import React, { useState, useEffect, useRef } from 'react';
import { GoogleGenAI } from '@google/genai';
import { TranscriptItem } from '../types';

interface CalibrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  transcripts: TranscriptItem[];
}

interface TestPhrase {
    id: number;
    text: string;
    type: 'command' | 'question' | 'long' | 'endurance';
    description: string;
}

interface TestResult {
    expected: string;
    received: string;
    matchScore: number; // 0-100
    status: 'pending' | 'recording' | 'done';
}

const CalibrationModal: React.FC<CalibrationModalProps> = ({ isOpen, onClose, transcripts }) => {
  const [step, setStep] = useState<'intro' | 'generating' | 'testing' | 'analyzing' | 'report'>('intro');
  const [phrases, setPhrases] = useState<TestPhrase[]>([]);
  const [currentPhraseIndex, setCurrentPhraseIndex] = useState(0);
  const [results, setResults] = useState<TestResult[]>([]);
  const [analysisReport, setAnalysisReport] = useState<string>('');
  
  const [phraseStartTime, setPhraseStartTime] = useState<number>(0);

  useEffect(() => {
    if (isOpen) {
        setStep('intro');
        setResults([]);
        setPhrases([]);
        setAnalysisReport('');
        setPhraseStartTime(0);
    }
  }, [isOpen]);

  // --- STEP 1: GENERATE TEST PHRASES ---
  const startCalibration = async () => {
    setStep('generating');
    try {
        const apiKey = process.env.API_KEY;
        if (!apiKey) throw new Error("API Key missing");
        
        const ai = new GoogleGenAI({ apiKey });
        
        const prompt = `
            Generate 4 Swedish texts for testing a speech-to-speech AI VAD (Voice Activity Detection).
            Return ONLY a JSON array of objects with keys: "text", "type", "description".
            
            1. Type "command": Very short (1-3 words). Example: "Stoppa nu."
            2. Type "question": Medium length (5-8 words). Example: "Hur mycket är klockan just nu?"
            3. Type "long": Long complex sentence (15+ words). No commas.
            4. Type "endurance": A cohesive paragraph of about 40-50 words. This is to test if the system cuts off the user during breathing pauses.
            
            Do not wrap in markdown code blocks. Just the JSON.
        `;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt
        });

        const text = response.text || "[]";
        const cleanJson = text.replace(/```json|```/g, '').trim();
        const generatedPhrases = JSON.parse(cleanJson);
        
        setPhrases(generatedPhrases);
        setStep('testing');
        setCurrentPhraseIndex(0);
        setPhraseStartTime(Date.now());

    } catch (e) {
        console.error(e);
        alert("Kunde inte generera test. Kontrollera nätverk.");
        setStep('intro');
    }
  };

  // --- STEP 2: TESTING LOOP ---
  const activePhrase = phrases[currentPhraseIndex];

  // Logic: Get all model responses that appeared AFTER we showed the phrase
  const relevantTranscripts = transcripts.filter(t => {
      return t.timestamp.getTime() > phraseStartTime && t.role === 'model';
  });

  const currentReceivedText = relevantTranscripts.map(t => t.text).join(' ').trim();

  // Simple Word Count Ratio for immediate feedback
  const expectedWordCount = activePhrase ? activePhrase.text.split(' ').length : 0;
  const receivedWordCount = currentReceivedText ? currentReceivedText.split(' ').length : 0;
  const wordRatio = expectedWordCount > 0 ? Math.min(100, Math.round((receivedWordCount / expectedWordCount) * 100)) : 0;

  const nextPhrase = (override: boolean = false) => {
      // Save result
      const result: TestResult = {
          expected: activePhrase.text,
          received: override ? "(Manuell bekräftelse: Ljud OK)" : (currentReceivedText || "(Inget svar)"),
          matchScore: override ? 100 : wordRatio, 
          status: 'done'
      };

      const newResults = [...results, result];
      setResults(newResults);
      
      setPhraseStartTime(Date.now());

      if (currentPhraseIndex < phrases.length - 1) {
          setCurrentPhraseIndex(prev => prev + 1);
      } else {
          analyzeResults(newResults);
      }
  };

  // --- STEP 3: ANALYZE ---
  const analyzeResults = async (finalResults: TestResult[]) => {
      setStep('analyzing');
      try {
        const apiKey = process.env.API_KEY;
        const ai = new GoogleGenAI({ apiKey: apiKey! });

        const dataStr = JSON.stringify(finalResults, null, 2);
        const prompt = `
            I have performed a VAD (Voice Activity Detection) stress test on a Speech-to-Speech translation app.
            
            Here are the results (Expected vs Received text):
            ${dataStr}

            Analyze the results focusing on "Barge-In" / Premature Cutoff issues.
            
            DIAGNOSIS LOGIC:
            1. If the 'Endurance' or 'Long' test received text is significantly shorter than the expected text (e.g. < 70% length), it indicates the VAD is cutting off during breathing pauses.
               -> Recommendation: Increase 'SILENCE_THRESHOLD_MS' (e.g. from 550ms to 800ms+).
            
            2. If the 'Command' (short) test failed or was missing start.
               -> Recommendation: Decrease 'VAD_THRESHOLD' (sensitivity) or check 'MIN_TURN_DURATION'.

            3. If 'received' contains "(Manuell bekräftelse)", ignore that specific test case in the analysis.

            Output response in this format:
            ## Analys
            (Summary of the problem, specifically mentioning if sentences were cut off)
            
            ## Rekommenderad Åtgärd
            (Specific advice on VAD settings: SILENCE_THRESHOLD_MS, VAD_THRESHOLD, MIN_TURN_DURATION)
        `;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt
        });

        setAnalysisReport(response.text || "Ingen analys kunde genereras.");
        setStep('report');

      } catch (e) {
          console.error(e);
          setAnalysisReport("Fel vid analys.");
          setStep('report');
      }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[150] bg-black/90 backdrop-blur-xl flex items-center justify-center p-4">
        <div className="w-full max-w-2xl bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            
            {/* HEADER */}
            <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-indigo-900/20">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-indigo-500 rounded-lg text-white">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-white">Systemkalibrering 2.0</h2>
                        <p className="text-xs text-indigo-300">Stress-test för VAD & Barge-in</p>
                    </div>
                </div>
                <button onClick={onClose} className="text-slate-400 hover:text-white">Stäng</button>
            </div>

            {/* CONTENT */}
            <div className="flex-1 overflow-y-auto p-6">
                
                {step === 'intro' && (
                    <div className="text-center py-8">
                        <p className="text-slate-300 mb-6 text-lg">
                            Detta test är designat för att hitta "Barge-in"-problem (när AI:n avbryter dig för tidigt).
                            Du kommer få läsa längre texter. Ta naturliga andningspauser.
                        </p>
                        <div className="bg-yellow-900/20 border border-yellow-700/50 p-4 rounded-lg text-left mb-8 max-w-md mx-auto">
                            <h4 className="text-yellow-400 font-bold mb-2">Viktigt:</h4>
                            <ul className="list-disc list-inside text-slate-300 text-sm space-y-2">
                                <li>Slå PÅ "Översättning" innan du börjar.</li>
                                <li>Läs texten i lugn takt. Ta pauser vid punkter.</li>
                                <li><strong>Använd helst inte manuell bekräftelse</strong> om du vill testa VAD-funktionen.</li>
                            </ul>
                        </div>
                        <button 
                            onClick={startCalibration}
                            className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 px-8 rounded-full shadow-lg shadow-indigo-500/30 transition-all hover:scale-105"
                        >
                            Starta Stress-test
                        </button>
                    </div>
                )}

                {step === 'generating' && (
                    <div className="flex flex-col items-center justify-center py-20">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500 mb-4"></div>
                        <p className="text-slate-400 animate-pulse">Skapar svåra testfraser...</p>
                    </div>
                )}

                {step === 'testing' && activePhrase && (
                    <div className="flex flex-col h-full">
                        <div className="flex justify-between text-xs font-mono text-slate-500 mb-4">
                            <span>TEST {currentPhraseIndex + 1} / {phrases.length}</span>
                            <span className={activePhrase.type === 'endurance' ? 'text-yellow-400 font-bold' : ''}>
                                TYP: {activePhrase.type.toUpperCase()}
                            </span>
                        </div>

                        <div className="flex-1 flex flex-col items-center justify-center text-center">
                            <p className="text-sm text-slate-400 mb-4">{activePhrase.description}</p>
                            
                            <h3 className={`font-bold text-white mb-8 leading-relaxed ${activePhrase.type === 'endurance' ? 'text-lg md:text-xl text-left bg-slate-800/50 p-4 rounded-lg border border-slate-700' : 'text-2xl md:text-4xl'}`}>
                                "{activePhrase.text}"
                            </h3>
                            
                            <div className="w-full max-w-md bg-slate-800 p-4 rounded-xl border border-slate-700 mb-4 min-h-[100px] flex flex-col justify-center relative overflow-hidden">
                                <div className="flex justify-between items-center mb-2 border-b border-slate-700 pb-2">
                                    <p className="text-xs text-slate-500 uppercase tracking-wider">Mottagen text:</p>
                                    <span className={`text-xs font-mono px-2 py-0.5 rounded ${wordRatio < 80 ? 'bg-red-500/20 text-red-400' : 'bg-green-500/20 text-green-400'}`}>
                                        Matchning: {wordRatio}% ({receivedWordCount}/{expectedWordCount} ord)
                                    </span>
                                </div>
                                <p className={`font-mono text-sm transition-all text-left ${currentReceivedText ? 'text-green-400' : 'text-slate-600 italic'}`}>
                                    {currentReceivedText || "Väntar på text..."}
                                </p>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <button 
                                onClick={() => nextPhrase(true)}
                                className="w-full py-4 rounded-xl font-medium border border-slate-700 hover:bg-slate-800 text-slate-400 transition-colors text-xs md:text-sm"
                            >
                                Manuell Bekräftelse (Hoppa över VAD-analys)
                            </button>

                            <button 
                                onClick={() => nextPhrase(false)}
                                disabled={!currentReceivedText}
                                className={`w-full py-4 rounded-xl font-bold transition-all ${
                                    currentReceivedText 
                                    ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-500/30' 
                                    : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                                }`}
                            >
                                {currentReceivedText ? "Analysera Resultat" : "Tala nu..."}
                            </button>
                        </div>
                    </div>
                )}

                {step === 'analyzing' && (
                    <div className="flex flex-col items-center justify-center py-20">
                         <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mb-4"></div>
                         <p className="text-slate-400 animate-pulse">Diagnostiserar avbrott och pauser...</p>
                    </div>
                )}

                {step === 'report' && (
                    <div className="space-y-4">
                        <h3 className="text-xl font-bold text-white">Analysresultat</h3>
                        <div className="bg-slate-950 p-6 rounded-xl border border-slate-800 font-mono text-sm text-slate-300 whitespace-pre-wrap">
                            {analysisReport}
                        </div>
                        <div className="flex gap-4">
                             <button onClick={onClose} className="flex-1 bg-slate-700 hover:bg-slate-600 py-3 rounded-lg text-white">Stäng</button>
                             <button onClick={() => setStep('intro')} className="flex-1 bg-indigo-600 hover:bg-indigo-500 py-3 rounded-lg text-white">Starta om</button>
                        </div>
                    </div>
                )}

            </div>
        </div>
    </div>
  );
};

export default CalibrationModal;

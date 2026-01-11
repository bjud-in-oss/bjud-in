
import React, { useState, useEffect } from 'react';
import { buildSystemInstruction } from '../utils/promptBuilder';

interface SystemPromptModalProps {
  isOpen: boolean;
  onClose: () => void;
  customSystemInstruction: string | null;
  setCustomSystemInstruction: (text: string | null) => void;
  targetLanguages: string[];
  aiSpeakingRate: number;
}

const SystemPromptModal: React.FC<SystemPromptModalProps> = ({
  isOpen,
  onClose,
  customSystemInstruction,
  setCustomSystemInstruction,
  targetLanguages,
  aiSpeakingRate
}) => {
  const [text, setText] = useState('');
  const [defaultPreview, setDefaultPreview] = useState('');

  useEffect(() => {
    if (isOpen) {
      const builtPrompt = buildSystemInstruction(targetLanguages, aiSpeakingRate);
      setDefaultPreview(builtPrompt);
      
      // PRE-FILL LOGIC: Use custom if exists, otherwise fill with default
      if (customSystemInstruction) {
          setText(customSystemInstruction);
      } else {
          setText(builtPrompt);
      }
    }
  }, [isOpen, customSystemInstruction, targetLanguages, aiSpeakingRate]);

  const handleSave = () => {
    // If text matches default exactly or is empty, we can treat it as 'no custom prompt' (null)
    // or we can save it as is. User wanted it pre-filled, so saving it is safer.
    // However, if they clear it completely, we should reset to null (default behavior).
    if (!text.trim()) {
      setCustomSystemInstruction(null);
    } else {
      setCustomSystemInstruction(text);
    }
    onClose();
  };

  const handleReset = () => {
      // Resetting puts the default back in the text box
      setText(defaultPreview);
  };

  const copyToClipboard = () => {
      const txt = text || defaultPreview;
      navigator.clipboard.writeText(txt);
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md p-4"
      onClick={onClose}
    >
      <div 
        className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-in fade-in zoom-in duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-indigo-900/20">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                System Prompt
            </h2>
            <p className="text-xs text-indigo-300">Redigera AI:ns grundinstruktioner</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white">✕</button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
            
            {/* EDITOR */}
            <div className="space-y-2">
                <div className="flex justify-between items-center">
                    <label className="text-xs font-bold text-slate-300 uppercase tracking-wide">
                        Din Anpassade Prompt {customSystemInstruction ? '(Aktiv)' : '(Standard)'}
                    </label>
                    <div className="flex gap-2">
                        <button onClick={handleReset} className="text-[10px] text-red-400 hover:text-red-300 border border-red-500/30 px-2 py-1 rounded">
                            Återställ till Standard
                        </button>
                        <button onClick={copyToClipboard} className="text-[10px] text-blue-400 hover:text-blue-300 border border-blue-500/30 px-2 py-1 rounded">
                            Kopiera
                        </button>
                    </div>
                </div>
                <textarea 
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    placeholder="Lämna tomt för att använda standard-instruktionen nedan..."
                    className="w-full h-48 bg-slate-950 border border-slate-700 rounded-lg p-3 text-sm font-mono text-white focus:border-indigo-500 focus:outline-none resize-y"
                />
            </div>

            {/* DEFAULT REFERENCE */}
            <div className="space-y-2 opacity-60 hover:opacity-100 transition-opacity">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wide flex items-center gap-2">
                    Standard-instruktion (Referens)
                    <span className="text-[9px] font-normal normal-case bg-slate-800 px-1.5 py-0.5 rounded">Baseras på valda språk & hastighet</span>
                </label>
                <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-3 text-[10px] font-mono text-slate-400 whitespace-pre-wrap select-none">
                    {defaultPreview}
                </div>
            </div>

        </div>

        <div className="p-4 border-t border-slate-800 flex justify-end gap-3 bg-slate-900">
            <button onClick={onClose} className="px-4 py-2 rounded-lg text-slate-300 hover:bg-slate-800 text-sm font-medium transition-colors">
                Avbryt
            </button>
            <button onClick={handleSave} className="px-6 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold shadow-lg shadow-indigo-500/20 transition-all transform hover:scale-105">
                Spara & Använd
            </button>
        </div>
      </div>
    </div>
  );
};

export default SystemPromptModal;

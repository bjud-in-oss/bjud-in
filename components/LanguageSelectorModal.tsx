
import React, { useState, useEffect } from 'react';

interface LanguageSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (languages: string[]) => void;
  currentLanguages: string[];
  allLanguages: string[];
  isSingleSelection: boolean; // NEW PROP
}

const LanguageSelectorModal: React.FC<LanguageSelectorModalProps> = ({
  isOpen,
  onClose,
  onSave,
  currentLanguages,
  allLanguages,
  isSingleSelection
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [tempSelectedLangs, setTempSelectedLangs] = useState<string[]>([]);

  // Initialize temp langs when modal opens
  useEffect(() => {
    if (isOpen) {
      // If switching to single mode but have multiple, just keep the first one
      if (isSingleSelection && currentLanguages.length > 1) {
          setTempSelectedLangs([currentLanguages[0]]);
      } else {
          setTempSelectedLangs([...currentLanguages]);
      }
    }
  }, [isOpen, currentLanguages, isSingleSelection]);

  const toggleLanguage = (lang: string) => {
    setTempSelectedLangs(prev => {
      if (isSingleSelection) {
          // In single mode, clicking a new one replaces the old one
          return [lang]; 
      }

      if (prev.includes(lang)) {
        // Prevent deselecting the last one in multi-mode to ensure at least one lang
        if (prev.length === 1) return prev; 
        return prev.filter(l => l !== lang);
      } else {
        return [...prev, lang];
      }
    });
  };

  const handleSave = () => {
    onSave(tempSelectedLangs);
    onClose();
  };

  if (!isOpen) return null;

  const filteredLangs = allLanguages
    .filter(l => l.toLowerCase().includes(searchTerm.toLowerCase()))
    .sort((a, b) => {
       const aSelected = tempSelectedLangs.includes(a);
       const bSelected = tempSelectedLangs.includes(b);
       if (aSelected === bSelected) return 0;
       return aSelected ? -1 : 1;
    });

  return (
    <div 
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md p-4"
      onClick={onClose}
    >
      <div 
        className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md shadow-2xl flex flex-col max-h-[80vh] overflow-hidden animate-in fade-in zoom-in duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-4 border-b border-slate-800 flex justify-between items-center">
          <div>
            <h2 className="text-lg font-bold text-white">Välj Språk</h2>
            <p className="text-xs text-slate-400">
                {isSingleSelection ? "Endast ett språk (Fysiskt rum)" : "Flerval möjligt (Lokalt)"}
            </p>
          </div>
          <button onClick={handleSave} className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-1.5 rounded-lg text-sm font-bold transition-colors">
            KLAR
          </button>
        </div>
        
        <div className="p-4 border-b border-slate-800">
          <input 
            type="text" 
            placeholder="Sök språk..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-indigo-500"
          />
        </div>

        <div className="flex-1 overflow-y-auto p-2 scrollbar-hide">
          {filteredLangs.map(lang => {
            const isSelected = tempSelectedLangs.includes(lang);
            return (
              <button
                key={lang}
                onClick={() => toggleLanguage(lang)}
                className={`w-full text-left px-4 py-3 rounded-lg mb-1 flex justify-between items-center transition-all ${
                  isSelected ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/30' : 'text-slate-300 hover:bg-slate-800 border border-transparent'
                }`}
              >
                <span>{lang}</span>
                {isSelected && (
                  <div className="bg-indigo-500 rounded-full p-1">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-white" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default LanguageSelectorModal;

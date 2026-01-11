
import React from 'react';

const TechnicalDictionary: React.FC = () => {
  return (
    <div className="space-y-4 pt-6 border-t border-slate-800">
        <h4 className="text-sm font-bold text-white flex items-center gap-2">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
        Teknisk Ordbok
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-slate-400">
        <div className="bg-slate-950/50 p-3 rounded-lg border border-slate-800">
            <strong className="text-indigo-400 block mb-1">RMS (Energi)</strong>
            Mäter ljudets volymstyrka. Används för den visuella indikatorn och grovsortering av tystnad.
        </div>
        <div className="bg-slate-950/50 p-3 rounded-lg border border-slate-800">
            <strong className="text-indigo-400 block mb-1">Neural VAD</strong>
            AI som skiljer på mänskligt tal och ljud (t.ex. knapptryckningar). Tröskelvärdet bestämmer hur "sträng" den är.
        </div>
        <div className="bg-slate-950/50 p-3 rounded-lg border border-slate-800">
            <strong className="text-indigo-400 block mb-1">Latens (Min Turn)</strong>
            Hur länge vi samlar ljud innan vi skickar. Kort tid ger snabbare översättning men riskerar att klippa första stavelsen.
        </div>
        <div className="bg-slate-950/50 p-3 rounded-lg border border-slate-800">
            <strong className="text-indigo-400 block mb-1">Paus-detektion</strong>
            Systemet väntar ca 550ms på tystnad innan det avgör att en mening är slut. Detta är "bromsen" som förhindrar att meningar hackas upp.
        </div>
        </div>
    </div>
  );
};

export default TechnicalDictionary;

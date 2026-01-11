
import React from 'react';

interface ControlBarProps {
  activeMode: 'translate' | 'transcribe' | 'off';
  setMode: (mode: 'translate' | 'transcribe' | 'off') => void;
}

const ControlBar: React.FC<ControlBarProps> = ({
  activeMode,
  setMode
}) => {
  const isOn = activeMode === 'translate';

  return (
    <div className="absolute bottom-8 left-0 right-0 z-40 flex items-center justify-center pointer-events-none px-6">
      
      <div className="relative w-full max-w-xs flex items-center justify-center">

        {/* THE TOGGLE SWITCH */}
        <div className="pointer-events-auto relative bg-slate-900 border border-slate-700 p-1.5 rounded-full h-16 w-64 shadow-2xl flex items-center justify-between z-20">
            
            {/* Sliding Indicator */}
            <div 
              className={`absolute top-1.5 bottom-1.5 w-[48%] rounded-full transition-all duration-300 ease-out shadow-inner border 
              ${isOn 
                  ? 'left-[50%] bg-indigo-600 border-indigo-400 shadow-[0_0_15px_rgba(79,70,229,0.4)]' 
                  : 'left-1.5 bg-slate-800 border-slate-600'
              }`}
            />

            {/* OFF BUTTON */}
            <button 
              onClick={() => setMode('off')}
              className={`relative z-10 w-1/2 h-full flex items-center justify-center font-bold tracking-wider text-sm transition-colors duration-300 ${!isOn ? 'text-white' : 'text-slate-500 hover:text-slate-300'}`}
            >
                AV
            </button>

            {/* ON / TRANSLATE BUTTON */}
            <button 
              onClick={() => setMode('translate')}
              className={`relative z-10 w-1/2 h-full flex items-center justify-center space-x-2 transition-colors duration-300 ${isOn ? 'text-white' : 'text-slate-500 hover:text-slate-300'}`}
            >
                <span className="font-bold tracking-wider text-sm">PÅ</span>
                {/* Translation Icon */}
                 <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
                 </svg>
            </button>
        </div>

      </div>
    </div>
  );
};

export default ControlBar;

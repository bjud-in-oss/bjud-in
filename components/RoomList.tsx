
import React from 'react';
import { LOCAL_NAME, ListOption } from '../utils/roomData';

interface RoomListProps {
  options: ListOption[];
  tempSelection: string;
  currentRoom: string;
  onSelect: (roomName: string) => void;
  onConfirm: () => void;
  setMobileFocus: (focus: 'list' | 'map') => void;
}

const RoomList: React.FC<RoomListProps> = ({ 
    options, 
    tempSelection, 
    currentRoom, 
    onSelect, 
    onConfirm,
    setMobileFocus 
}) => {
  
  const hasChanged = tempSelection !== currentRoom;

  return (
    <div 
        className="p-3 overflow-y-auto flex-1 scrollbar-hide space-y-1"
        onClick={() => setMobileFocus('list')}
    >
      {options.map((opt) => {
          const isActive = tempSelection === opt.name;
          const isSelectedRoom = currentRoom === opt.name;
          
          if (opt.type === 'local') {
              return (
                  <div key={opt.name}>
                      <button 
                        onClick={() => onSelect(LOCAL_NAME)}
                        className={`w-full text-left px-4 py-4 rounded-xl flex justify-between items-center transition-all border ${
                          isActive 
                          ? 'bg-indigo-600/20 border-indigo-500 text-white shadow-lg' 
                          : 'bg-transparent border-transparent text-slate-400 hover:bg-slate-800'
                        }`}
                      >
                        <div className="flex items-center">
                           <div className={`p-1.5 rounded-md mr-3 ${isActive ? 'bg-indigo-500 text-white' : 'bg-slate-800 text-slate-500'}`}>
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                              </svg>
                           </div>
                           <div>
                              <span className="font-bold block text-sm">Personligt läge</span>
                              <span className="text-[10px] opacity-60 block">Ingen rumskoppling</span>
                           </div>
                        </div>
                        
                        {isActive && hasChanged && (
                            <div onClick={(e) => { e.stopPropagation(); onConfirm(); }} className="ml-2 w-8 h-8 rounded-full bg-green-500 text-white flex items-center justify-center shadow-lg hover:scale-110 transition-transform cursor-pointer">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                            </div>
                        )}
                      </button>
                      <div className="h-px bg-slate-800 my-2 mx-2"></div>
                  </div>
              );
          }

          return (
              <button
                key={opt.id}
                onClick={() => onSelect(opt.name)}
                className={`w-full text-left px-4 py-3 rounded-lg flex justify-between items-center transition-all border ${
                  isActive ? 'bg-indigo-600/10 border-indigo-500/50 text-white font-medium' : 'border-transparent text-slate-400 hover:bg-slate-800'
                }`}
              >
                <span className="flex items-center">
                  <span className="font-mono text-xs opacity-40 mr-3 w-6 text-right">{opt.id}</span>
                  {opt.name}
                </span>
                {isActive && hasChanged && (
                    <div onClick={(e) => { e.stopPropagation(); onConfirm(); }} className="ml-2 w-8 h-8 rounded-full bg-green-500 text-white flex items-center justify-center shadow-lg hover:scale-110 transition-transform cursor-pointer">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                    </div>
                )}
                {isActive && !hasChanged && <div className="w-2 h-2 rounded-full bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.6)]"></div>}
              </button>
          );
      })}
    </div>
  );
};

export default RoomList;

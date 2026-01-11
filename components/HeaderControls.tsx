
import React, { useState } from 'react';
import RoomSelectorModal from './RoomSelectorModal';

interface HeaderControlsProps {
  currentRoom: string;
  onRoomChange: (room: string) => void;
  userLanguage: string;
  onOpenLangModal: () => void;
  onToggleTower: () => void;
  status: string;
}

const HeaderControls: React.FC<HeaderControlsProps> = ({
  currentRoom,
  onRoomChange,
  userLanguage,
  onOpenLangModal,
  onToggleTower,
  status
}) => {
  const [showRoomModal, setShowRoomModal] = useState(false);
  
  const [expandedControl, setExpandedControl] = useState<'lang' | 'room'>('lang');

  const handleLangClick = () => {
    setExpandedControl('lang');
    onOpenLangModal();
  };

  const handleRoomClick = () => {
    setExpandedControl('room');
    setShowRoomModal(true);
  };

  const getCogColor = () => {
      switch (status) {
          case 'connected': return 'text-green-500 border-green-500/50 shadow-[0_0_10px_rgba(34,197,94,0.3)]';
          case 'connecting': return 'text-yellow-500 border-yellow-500/50 animate-pulse';
          case 'error': return 'text-red-500 border-red-500/50';
          case 'standby': return 'text-blue-400 border-blue-400/50 animate-pulse';
          default: return 'text-slate-400 border-slate-700'; 
      }
  };

  return (
    <>
      <div className="relative w-full max-w-7xl mx-auto px-4 py-4 z-50 flex items-center justify-between gap-2 md:gap-4">
        
        {/* LEFT: BRANDING */}
        <div className="hidden lg:flex items-center w-48 shrink-0">
            <div className="bg-indigo-600/20 p-2 rounded-lg border border-indigo-500/30 mr-3">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                </svg>
            </div>
            <span className="font-bold text-lg tracking-wide text-slate-200">Mötesbryggan</span>
        </div>

        {/* CENTER: CONTROLS */}
        <div className="flex justify-center items-center gap-2 md:gap-4 flex-1 max-w-3xl mx-auto transition-all">
            
            {/* LANGUAGE SELECTOR */}
            <button 
               onClick={handleLangClick}
               className={`
                  relative flex items-center bg-slate-800/80 backdrop-blur border border-slate-700 rounded-xl text-white shadow-lg group transition-all duration-300 overflow-hidden
                  hover:bg-slate-700 hover:border-indigo-500/50
                  ${expandedControl === 'lang' ? 'flex-[10] px-4 py-2' : 'flex-[2] px-0 py-2 justify-center'}
                  md:flex-1 md:px-4 md:py-3 md:justify-start
               `}
            >
               <div className={`
                   w-8 h-8 rounded-full flex items-center justify-center
                   bg-indigo-500/20 text-indigo-300 group-hover:text-white group-hover:bg-indigo-500 transition-colors shrink-0
                   ${expandedControl === 'lang' ? '' : 'mx-auto'}
                   md:mx-0
               `}>
                   <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
                   </svg>
               </div>

               <div className={`
                  flex flex-col items-start whitespace-nowrap transition-all duration-300 overflow-hidden
                  ${expandedControl === 'lang' ? 'opacity-100 max-w-full ml-3' : 'opacity-0 max-w-0 ml-0'}
                  md:opacity-100 md:max-w-full md:ml-3
               `}>
                   <span className="text-[10px] uppercase text-slate-500 font-bold tracking-wider leading-none mb-0.5">Översätt till</span>
                   <span className="font-medium text-sm leading-none truncate block w-full text-left">{userLanguage}</span>
               </div>
            </button>


            {/* ROOM SELECTOR */}
             <button 
              onClick={handleRoomClick}
              className={`
                  relative flex items-center bg-slate-800/80 backdrop-blur border border-slate-700 rounded-xl text-white shadow-lg group transition-all duration-300 overflow-hidden
                  hover:bg-slate-700 hover:border-indigo-500/50
                  ${expandedControl === 'room' ? 'flex-[10] px-4 py-2' : 'flex-[2] px-0 py-2 justify-center'}
                  md:flex-1 md:px-4 md:py-3 md:justify-start
              `}
            >
               <div className={`
                   w-8 h-8 rounded-full flex items-center justify-center
                   bg-indigo-500/20 text-indigo-300 group-hover:text-white group-hover:bg-indigo-500 transition-colors shrink-0
                   ${expandedControl === 'room' ? '' : 'mx-auto'}
                   md:mx-0
               `}>
                   {currentRoom === 'Lokalt i min mobil' ? (
                       <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                         <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                       </svg>
                   ) : (
                       <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                         <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                       </svg>
                   )}
               </div>
               
               <div className={`
                  flex flex-col items-start whitespace-nowrap transition-all duration-300 overflow-hidden
                  ${expandedControl === 'room' ? 'opacity-100 max-w-full ml-3' : 'opacity-0 max-w-0 ml-0'}
                  md:opacity-100 md:max-w-full md:ml-3
               `}>
                   <span className="text-[10px] uppercase text-slate-500 font-bold tracking-wider leading-none mb-0.5">Plats</span>
                   <span className="font-medium text-sm leading-none truncate block w-full text-left">{currentRoom}</span>
               </div>
            </button>

        </div>

        {/* RIGHT: ACTION BUTTONS */}
        <div className="flex-none flex items-center gap-2">
            
            {/* TOWER TOGGLE */}
            <button 
                onClick={onToggleTower}
                className={`p-3 bg-slate-800/90 backdrop-blur border rounded-full transition-all shadow-lg group ${getCogColor()}`}
                title="Öppna Testpanelen"
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 group-hover:scale-110 transition-transform duration-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                </svg>
            </button>
        </div>

      </div>

      <RoomSelectorModal 
        isOpen={showRoomModal}
        onClose={() => setShowRoomModal(false)}
        currentRoom={currentRoom}
        onSelectRoom={onRoomChange}
      />
    </>
  );
};

export default HeaderControls;

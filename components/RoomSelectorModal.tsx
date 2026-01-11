
import React, { useRef, useState, useEffect } from 'react';
import { MAP_POINTS, LOCAL_NAME, ListOption } from '../utils/roomData';
import RoomList from './RoomList';
import RoomMap, { RoomMapRef } from './RoomMap';

interface RoomSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentRoom: string;
  onSelectRoom: (room: string) => void;
}

const RoomSelectorModal: React.FC<RoomSelectorModalProps> = ({
  isOpen,
  onClose,
  currentRoom,
  onSelectRoom
}) => {
  const [tempSelection, setTempSelection] = useState(currentRoom);
  const [mapImgUrl, setMapImgUrl] = useState<string | null>(null);
  const [mobileFocus, setMobileFocus] = useState<'list' | 'map' | 'neutral'>('neutral');

  const mapRef = useRef<RoomMapRef>(null);

  // --- IMAGE LOADING & MEMORY CLEANUP ---
  useEffect(() => {
    if (!isOpen) {
        // Cleanup when modal closes to save memory
        if (mapImgUrl) {
            URL.revokeObjectURL(mapImgUrl);
            setMapImgUrl(null);
        }
        return;
    }

    let active = true;
    let loadedUrl: string | null = null;

    const loadMapImage = async () => {
        try {
            const response = await fetch('/kapellet.png');
            if (!response.ok) throw new Error("Failed");
            const blob = await response.blob();
            
            if (active) {
                loadedUrl = URL.createObjectURL(blob);
                setMapImgUrl(loadedUrl);
            }
        } catch (error) {
            console.error("Map load error:", error);
        }
    };

    if (!mapImgUrl) loadMapImage();

    return () => { 
        active = false;
        // Note: We normally revoke here, but since React StrictMode double-invokes,
        // preventing flicker often requires keeping it until the modal actually closes (handled in the top if(!isOpen) block).
        // However, strictly cleaning up on unmount is best practice.
        // For this implementation, the top-level check handles the main lifecycle leak.
    };
  }, [isOpen]); 

  // Reset temp selection on open
  useEffect(() => {
    if (isOpen) {
        setTempSelection(currentRoom);
        setMobileFocus('neutral');
    }
  }, [isOpen, currentRoom]);

  // --- INTERACTION LOGIC ---
  const handleListClick = (roomName: string) => {
      setTempSelection(roomName);
      const point = MAP_POINTS.find(p => p.name === roomName);
      if (point) {
          if (mapRef.current) mapRef.current.panToPoint(point.x, point.y);
          if (window.innerWidth < 768) setMobileFocus('map');
      } else {
          setMobileFocus('neutral');
      }
  };

  const confirmSelection = () => {
      onSelectRoom(tempSelection);
      onClose();
  };

  // --- HELPER FOR MOBILE LAYOUT ---
  const getMobileHeightClass = (section: 'list' | 'map') => {
      if (mobileFocus === 'neutral') return 'h-[50%]';
      if (section === 'list') return mobileFocus === 'list' ? 'h-[60%]' : 'h-[40%]';
      return mobileFocus === 'map' ? 'h-[60%]' : 'h-[40%]';
  };

  // --- SORTING LOGIC ---
  const getSortedOptions = (): ListOption[] => {
      const localOpt: ListOption = { type: 'local', name: LOCAL_NAME };
      const mapOpts: ListOption[] = MAP_POINTS.map(p => ({ type: 'room', name: p.name, id: p.id, x: p.x, y: p.y }));
      const allOptions = [localOpt, ...mapOpts];

      return allOptions.sort((a, b) => {
          if (a.name === tempSelection) return -1;
          if (b.name === tempSelection) return 1;
          return 0;
      });
  };

  const sortedOptions = getSortedOptions();

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-sm p-0 md:p-6 animate-in fade-in duration-200"
      onClick={onClose}
    >
        {/* CLOSE BUTTON */}
        <button
            onClick={onClose}
            className="absolute top-6 right-6 z-[120] text-slate-400 hover:text-white transition-colors bg-black/40 rounded-full p-2 backdrop-blur-md border border-white/10"
        >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
        </button>

      <div 
        className="relative bg-slate-900 border border-slate-700 md:rounded-2xl w-full max-w-6xl h-full md:h-[90vh] flex flex-col md:flex-row shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* --- LEFT PANEL (LIST) --- */}
        <div 
            className={`w-full md:w-80 shrink-0 bg-slate-900 border-b md:border-b-0 md:border-r border-slate-800 flex flex-col z-10 transition-all duration-300 ease-in-out ${getMobileHeightClass('list')} md:h-full`}
        >
          <div className="p-6 border-b border-slate-800 shrink-0">
             <h2 className="text-2xl font-bold text-white mb-1">Utforska</h2>
             <p className="text-sm text-slate-400">Välj ett rum för att se det på kartan.</p>
          </div>

          <RoomList 
            options={sortedOptions}
            tempSelection={tempSelection}
            currentRoom={currentRoom}
            onSelect={handleListClick}
            onConfirm={confirmSelection}
            setMobileFocus={setMobileFocus}
          />
        </div>

        {/* --- RIGHT PANEL (MAP) --- */}
        <div 
            className={`w-full md:flex-1 relative bg-slate-950 overflow-hidden transition-all duration-300 ease-in-out ${getMobileHeightClass('map')} md:h-full`}
        >
           <div className="absolute top-4 left-4 z-10 bg-black/60 backdrop-blur px-3 py-1.5 rounded-full text-xs text-white border border-white/10 pointer-events-none flex items-center gap-2">
             <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" /></svg>
             Pinch & Zoom
           </div>

           <RoomMap 
              ref={mapRef}
              imgUrl={mapImgUrl}
              tempSelection={tempSelection}
              currentRoom={currentRoom}
              onSelect={(name) => { setTempSelection(name); setMobileFocus('map'); }}
              onConfirm={confirmSelection}
              setMobileFocus={setMobileFocus}
           />
        </div>

      </div>
    </div>
  );
};

export default RoomSelectorModal;

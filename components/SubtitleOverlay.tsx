
import React, { useMemo, useEffect, useRef } from 'react';
import { AudioGroup } from '../types';

interface SubtitleOverlayProps {
  activeGroup: AudioGroup | null;
  history: AudioGroup[];
  queue: AudioGroup[];
}

export const SubtitleOverlay: React.FC<SubtitleOverlayProps> = ({ activeGroup, history }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  // 1. UNIFIED LIST STRATEGY
  // Vi slår ihop historik och det aktiva segmentet till en enda lista.
  // Detta gör att React kan återanvända samma DOM-noder när ett objekt
  // går från "Active" till "History", vilket eliminerar "hoppet".
  const allItems = useMemo(() => {
    const items = [...history];
    if (activeGroup) {
      items.push(activeGroup);
    }
    return items;
  }, [history, activeGroup]);

  // Auto-scroll logic: Keep the view anchored to the bottom
  useEffect(() => {
    if (containerRef.current) {
      const el = containerRef.current;
      // En mjuk scroll till botten när listan växer
      el.scrollTo({
        top: el.scrollHeight,
        behavior: 'smooth'
      });
    }
  }, [allItems.length, activeGroup?.id]);

  return (
    <div 
      ref={containerRef}
      className="absolute inset-0 z-30 overflow-y-auto overflow-x-hidden scrollbar-hide px-6 md:px-32 py-20 flex flex-col"
    >
      {/* 
         Spacer div to ensure content starts at bottom initially.
         'mt-auto' in flex container pushes content down.
      */}
      <div className="mt-auto flex flex-col items-center gap-6 pb-[30vh]">
        {allItems.map((group) => {
          const isActive = activeGroup?.id === group.id;

          return (
            <UnifiedSubtitleItem 
              key={group.id} 
              group={group} 
              isActive={isActive} 
            />
          );
        })}
      </div>
    </div>
  );
};

// --- SUB-COMPONENT FOR PERFORMANCE ---
// Vi bryter ut detta för att isolera "Syllabic Weighting"-beräkningarna 
// till endast det aktiva elementet och undvika onödig omräkning av historik.
const UnifiedSubtitleItem: React.FC<{ group: AudioGroup; isActive: boolean }> = ({ group, isActive }) => {
  
  // Beräkna ord-timing ENDAST om detta är det aktiva elementet.
  // För historik visar vi bara ren text för prestanda.
  const wordTimings = useMemo(() => {
    if (!isActive) return null;

    const words = group.text.trim().split(/\s+/);
    const totalChars = words.reduce((acc, w) => acc + w.length + 2, 0);
    const totalDuration = group.duration || 2.0; 

    let cumulativeDelay = 0;

    return words.map((word) => {
      const weight = (word.length + 2) / totalChars; 
      const duration = totalDuration * weight;
      const start = cumulativeDelay;
      cumulativeDelay += duration;
      return { word, start, duration };
    });
  }, [group, isActive]);

  return (
    <div 
      className={`
        relative w-full text-center transition-all duration-700 ease-out origin-center
        ${isActive 
          ? 'scale-105 opacity-100 py-4 my-4' // Active State: Stor, luftig
          : 'scale-95 opacity-50 py-0 my-0 blur-[0.5px] grayscale' // History State: Kompakt, grå
        }
      `}
    >
      {isActive && wordTimings ? (
        // --- ACTIVE RENDER (KARAOKE) ---
        <div className="flex flex-wrap justify-center gap-x-3 gap-y-2 leading-tight">
          {wordTimings.map((item, i) => (
            <span
              key={i}
              className="text-3xl md:text-5xl lg:text-6xl font-black tracking-tight relative inline-block"
              style={{
                // @ts-ignore
                '--word-duration': `${item.duration}s`,
                '--word-delay': `${item.start}s`,
              }}
            >
               {/* Bakgrund (Ghost) */}
              <span className="text-slate-800 absolute inset-0 select-none" aria-hidden="true">
                {item.word}
              </span>
              {/* Fyllning (Gradient) */}
              <span className="relative z-10 text-transparent bg-clip-text bg-gradient-to-r from-white via-white/90 to-white/20 karaoke-word opacity-0 animate-word-reveal will-change-[background-position,opacity]">
                {item.word}
              </span>
            </span>
          ))}
        </div>
      ) : (
        // --- HISTORY RENDER (STATIC) ---
        <div className="text-lg md:text-2xl font-medium text-slate-400 transition-colors duration-1000">
          {group.text}
        </div>
      )}

      <style>{`
        .karaoke-word {
          background-size: 300% 100%;
          background-position: 100% 0;
          animation: 
            fadeIn 0.2s ease-out forwards var(--word-delay),
            fillGradient var(--word-duration) linear forwards var(--word-delay);
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes fillGradient {
          0% { background-position: 100% 0; }
          100% { background-position: 0% 0; }
        }
      `}</style>
    </div>
  );
};

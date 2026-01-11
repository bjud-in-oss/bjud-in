
import React, { useEffect, useRef } from 'react';
import { TranscriptItem } from '../types';

interface TranscriptViewProps {
  transcripts: TranscriptItem[];
  activeGroupId: number | null;
  isAiBusy: boolean; 
}

const TranscriptView: React.FC<TranscriptViewProps> = ({ transcripts, activeGroupId, isAiBusy }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const userScrolledRef = useRef(false);

  const handleScroll = () => {
      if (containerRef.current) {
          const { scrollTop, scrollHeight, clientHeight } = containerRef.current;
          // Tolerance of 100px from bottom
          if (scrollHeight - scrollTop - clientHeight > 100) {
              userScrolledRef.current = true;
          } else {
              userScrolledRef.current = false;
          }
      }
  };

  useEffect(() => {
    // Only auto-scroll if user hasn't manually scrolled up
    if (!userScrolledRef.current && bottomRef.current) {
        bottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [transcripts]);

  if (transcripts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-slate-500 opacity-60">
        <p className="text-sm font-light tracking-wide uppercase">Väntar på tal...</p>
      </div>
    );
  }
  
  return (
    <div 
        ref={containerRef} 
        onScroll={handleScroll}
        className="h-full overflow-y-auto scrollbar-hide px-4 md:px-0 pt-24 pb-48"
        style={{ overflowAnchor: 'auto' }} // Helps browser stabilize content
    >
      <div className="max-w-2xl mx-auto flex flex-col space-y-4"> 
        {transcripts.map((item, index) => {
            const cleanText = item.text.replace(/<noise>/gi, '').trim();
            if (!cleanText) return null;
            
            // Highlight the latest transcript
            const isLatest = index === transcripts.length - 1;

            return (
                <div 
                    key={item.id} 
                    className={`relative py-1 pl-4 border-l-2 transition-all duration-300 ${
                        isLatest
                            ? 'border-indigo-500' 
                            : 'border-transparent opacity-60'
                    }`}
                >
                    <p className={`text-lg md:text-xl leading-relaxed transition-colors ${
                        isLatest ? 'text-white font-medium' : 'text-slate-400'
                    }`}>
                        {cleanText}
                    </p>
                </div>
            );
        })}
        
        {/* Animation removed as requested to reduce visual noise and performance impact */}
        <div ref={bottomRef} className="h-4" />
      </div>
    </div>
  );
};

export default TranscriptView;

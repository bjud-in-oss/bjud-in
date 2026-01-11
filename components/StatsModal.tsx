
import React from 'react';

interface StatsModalProps {
  onClose: () => void;
  status: string;
  queueStats: {
    isBuffering: boolean;
    lastBufferDuration: number;
    processing: number;
    outQueue: number;
    confirmedHandshakes: number;
  };
  currentPlaybackRate: number;
  paceStatus: string;
}

const StatsModal: React.FC<StatsModalProps> = ({ 
  onClose, 
  status, 
  queueStats, 
  currentPlaybackRate,
  paceStatus
}) => {
  return (
    <div 
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm transition-opacity"
      onClick={onClose}
    >
      <div 
        className="bg-slate-900/90 border border-slate-700 p-6 rounded-2xl shadow-2xl backdrop-blur-md w-full max-w-sm animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()} 
      >
          
          <div className="flex justify-between items-center mb-4 border-b border-slate-700 pb-2">
              <h3 className="text-white font-mono font-bold text-sm uppercase tracking-wider">System Diagnostik</h3>
              <button onClick={onClose} className="text-slate-400 hover:text-white">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
              </button>
          </div>

          <div className="space-y-3 text-xs font-mono">
              <div className="flex justify-between">
                  <span className="text-slate-500">Status:</span>
                  <span className={
                      status === 'connected' ? "text-green-400" : 
                      status === 'standby' ? "text-blue-400 animate-pulse" :
                      "text-yellow-400"
                  }>{status.toUpperCase()}</span>
              </div>

              {status === 'standby' && (
                  <div className="text-center bg-blue-500/10 text-blue-300 p-2 rounded mb-2 border border-blue-500/20">
                      Auto-Sleep Active. Listening for wake word...
                  </div>
              )}
              
              <div className="flex justify-between items-center">
                  <span className="text-slate-500">Handshake Receipts:</span>
                  <span className="text-green-400 font-bold text-sm bg-green-900/30 px-2 rounded border border-green-500/30">
                      ✓ {queueStats.confirmedHandshakes}
                  </span>
              </div>

              <div className="grid grid-cols-3 gap-2 text-center py-2">
                  <div className="bg-slate-800/50 p-2 rounded border border-slate-700">
                      <div className="text-slate-500 text-[9px] mb-1">BUFFER</div>
                      <div className={`font-bold ${queueStats.isBuffering ? 'text-yellow-400 animate-pulse' : 'text-slate-500'}`}>
                          {queueStats.isBuffering ? "ACTIVE" : "IDLE"}
                      </div>
                  </div>
                  <div className="bg-slate-800/50 p-2 rounded border border-slate-700">
                      <div className="text-slate-500 text-[9px] mb-1">LAST PKT</div>
                      <div className="text-purple-400 font-bold">{(queueStats.lastBufferDuration / 1000).toFixed(1)}s</div>
                  </div>
                  <div className="bg-slate-800/50 p-2 rounded border border-slate-700">
                      <div className="text-slate-500 text-[9px] mb-1">PLAYING</div>
                      <div className="text-green-400 font-bold">{queueStats.outQueue}</div>
                  </div>
              </div>

              <div className="flex justify-between pt-2 border-t border-slate-800">
                  <span className="text-slate-500">Playback Rate:</span>
                  <span className="text-blue-400">{currentPlaybackRate}x</span>
              </div>
          </div>
      </div>
    </div>
  );
};

export default StatsModal;

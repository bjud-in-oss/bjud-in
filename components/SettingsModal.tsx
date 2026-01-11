import React from 'react';
import { PredictionModel } from '../utils/adaptiveLogic';
import SystemInstructionCard from './settings/SystemInstructionCard';
import AudioConfiguration from './settings/AudioConfiguration';
import RealtimeDiagnostics from './settings/RealtimeDiagnostics';
import TechnicalDictionary from './settings/TechnicalDictionary';
import MaintenanceGuide from './settings/MaintenanceGuide';

interface SettingsModalProps {
  onClose: () => void;
  onOpenCalibration: () => void;
  status: string;
  queueStats: {
    isBuffering: boolean;
    lastBufferDuration: number;
    processing: number;
    outQueue: number;
    confirmedHandshakes: number;
    efficiencyRatio: number;
    modelDiagnostics: PredictionModel;
    bufferGap: number;
  };
  currentPlaybackRate: number;
  minTurnDuration: number;
  setMinTurnDuration: (ms: number) => void;
  vadThreshold: number;
  setVadThreshold: (val: number) => void;
  currentLatency: number;
  debugMode: boolean;
  setDebugMode: (enabled: boolean) => void;
  aiSpeakingRate: number;
  setAiSpeakingRate: (rate: number) => void;
  triggerTestTone: () => void; 
  // NEW: Devices
  inputDeviceId?: string;
  setInputDeviceId?: (val: string) => void;
  outputDeviceId?: string;
  setOutputDeviceId?: (val: string) => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ 
  onClose,
  onOpenCalibration,
  status, 
  queueStats, 
  currentPlaybackRate,
  minTurnDuration,
  setMinTurnDuration,
  vadThreshold,
  setVadThreshold,
  currentLatency,
  debugMode,
  setDebugMode,
  aiSpeakingRate,
  setAiSpeakingRate,
  triggerTestTone,
  inputDeviceId,
  setInputDeviceId,
  outputDeviceId,
  setOutputDeviceId
}) => {
  return (
    <div 
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm transition-opacity"
      onClick={onClose}
    >
      <div 
        className="bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col animate-in zoom-in-95 duration-200 overflow-hidden"
        onClick={(e) => e.stopPropagation()} 
      >
          
          {/* HEADER */}
          <div className="flex justify-between items-center px-6 py-4 border-b border-slate-800 bg-slate-900 shrink-0">
              <div className="flex items-center gap-2">
                  <h3 className="text-white font-bold text-lg">Systeminställningar</h3>
                  <span className="text-[10px] bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded-full border border-indigo-500/30">v3.8</span>
              </div>
              <div className="flex gap-2">
                <button 
                    onClick={onOpenCalibration}
                    title="Starta Kalibrering"
                    className="p-2 bg-slate-800 text-indigo-400 hover:text-white rounded-full border border-slate-700 hover:bg-slate-700 transition-colors"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                    </svg>
                </button>
                <button onClick={onClose} className="p-2 text-slate-400 hover:text-white bg-slate-800 rounded-full hover:bg-slate-700 transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                </button>
              </div>
          </div>

          {/* SCROLLABLE CONTENT */}
          <div className="overflow-y-auto p-6 space-y-8 scrollbar-hide">
              <SystemInstructionCard />
              
              <AudioConfiguration 
                aiSpeakingRate={aiSpeakingRate}
                setAiSpeakingRate={setAiSpeakingRate}
                minTurnDuration={minTurnDuration}
                setMinTurnDuration={setMinTurnDuration}
                vadThreshold={vadThreshold}
                setVadThreshold={setVadThreshold}
                inputDeviceId={inputDeviceId}
                setInputDeviceId={setInputDeviceId}
                outputDeviceId={outputDeviceId}
                setOutputDeviceId={setOutputDeviceId}
              />

              <RealtimeDiagnostics 
                queueStats={queueStats}
                currentPlaybackRate={currentPlaybackRate}
                currentLatency={currentLatency}
                debugMode={debugMode}
                setDebugMode={setDebugMode}
                triggerTestTone={triggerTestTone}
              />

              <TechnicalDictionary />

              <MaintenanceGuide />
          </div>
      </div>
    </div>
  );
};

export default SettingsModal;
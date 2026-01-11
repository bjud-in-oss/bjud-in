import React, { useState, useEffect } from 'react';
import { useGeminiLive } from './hooks/useGeminiLive';
import { useWakeLock } from './hooks/useWakeLock';
import { SubtitleOverlay } from './components/SubtitleOverlay';
import OnboardingModal from './components/OnboardingModal';
import HeaderControls from './components/HeaderControls';
import CalibrationModal from './components/CalibrationModal';
import LanguageSelectorModal from './components/LanguageSelectorModal';
import ControlBar from './components/ControlBar';
import Tower from './components/Tower';
import SystemPromptModal from './components/SystemPromptModal'; 
import { AudioGroup } from './types';

const ALL_LANGUAGES = [
  "Afrikaans", "Albanska", "Amhariska", "Arabiska", "Armeniska", "Azerbajdzjanska", "Baskiska", "Vitryska", "Bengali", "Bosniska", "Bulgariska", "Katalanska", "Cebuano", "Kinesiska (Förenklad)", "Kinesiska (Traditionell)", "Korsikanska", "Kroatiska", "Tjeckiska", "Danska", "Nederländska", "Engelska", "Esperanto", "Estniska", "Finska", "Franska", "Frisiska", "Galiciska", "Georgiska", "Tyska", "Grekiska", "Gujarati", "Haitisk kreol", "Hausa", "Hawaiiska", "Hebreiska", "Hindi", "Hmong", "Ungerska", "Isländska", "Igbo", "Indonesiska", "Irländska", "Italienska", "Japanska", "Javanesiska", "Kannada", "Kazakiska", "Khmer", "Koreanska", "Kurdiska", "Kirgiziska", "Lao", "Latin", "Lettiska", "Litauiska", "Luxemburgska", "Makedonska", "Madagaskiska", "Malajiska", "Malayalam", "Maltesiska", "Maori", "Marathi", "Mongoliska", "Burmesiska", "Nepalesiska", "Norska", "Nyanja", "Pashto", "Persiska", "Polska", "Portugisiska", "Punjabi", "Rumänska", "Ryska", "Samoanska", "Skotsk gäliska", "Serbiska", "Sesotho", "Shona", "Sindhi", "Singalesiska", "Slovakiska", "Slovenska", "Somaliska", "Spanska", "Sundanesiska", "Swahili", "Svenska", "Tagalog (Filipino)", "Tadzjikiska", "Tamil", "Telugu", "Thailändska", "Turkiska", "Ukrainska", "Urdu", "Uzbekiska", "Vietnamesiska", "Walesiska", "Xhosa", "Jiddisch", "Yoruba", "Zulu"
];

const LOCAL_MODE_NAME = "Lokalt i min mobil";

const App: React.FC = () => {
  const { requestLock, releaseLock } = useWakeLock();

  useEffect(() => {
    console.log("App Component Mounted Successfully");
  }, []);

  const { 
    status, 
    transcripts, 
    error,
    setTargetLanguages,
    targetLanguages,
    queueStats,
    currentPlaybackRate,
    currentLatency,
    activeMode,
    setMode,
    currentRoom,
    setCurrentRoom,
    packetEvents,
    minTurnDuration,
    setMinTurnDuration,
    vadThreshold,
    setVadThreshold,
    silenceThreshold,
    setSilenceThreshold,
    volMultiplier,
    setVolMultiplier,
    // DEVICES
    inputDeviceId,
    setInputDeviceId,
    outputDeviceId,
    setOutputDeviceId,
    
    notification,
    effectiveMinDuration,
    debugMode,
    setDebugMode,
    aiSpeakingRate,
    setAiSpeakingRate,
    activeGroupId,
    activePhraseDuration,
    audioDiagnosticsRef,
    triggerTestTone,
    injectTextAsAudio,
    initAudioInput, 
    connect,
    disconnect,
    customSystemInstruction, 
    setCustomSystemInstruction, 
    enableLogs, 
    setEnableLogs 
  } = useGeminiLive();

  useEffect(() => {
    if (activeMode !== 'off') {
        requestLock();
    } else {
        releaseLock();
    }
  }, [activeMode, requestLock, releaseLock]);

  const [showLangModal, setShowLangModal] = useState(false);
  const [showCalibrationModal, setShowCalibrationModal] = useState(false);
  const [showPromptModal, setShowPromptModal] = useState(false); 

  const handleSaveLanguages = (langs: string[]) => setTargetLanguages(langs);
  const handleOnboardingComplete = (lang: string) => setTargetLanguages([lang]);

  const handleRoomChange = (room: string) => {
      setCurrentRoom(room);
      if (room !== LOCAL_MODE_NAME && targetLanguages.length > 1) {
          setTargetLanguages([targetLanguages[0]]);
      }
  };

  const activeItem = transcripts.find(t => t.groupId === activeGroupId);
  const activeGroup: AudioGroup | null = activeItem ? { 
      id: activeItem.id, 
      text: activeItem.text, 
      duration: activePhraseDuration 
  } : null;

  const history: AudioGroup[] = transcripts
    .filter(t => !activeItem || t.groupId < activeItem.groupId)
    .sort((a, b) => a.groupId - b.groupId) 
    .map(t => ({ id: t.id, text: t.text }));
  
  const queue: AudioGroup[] = transcripts
    .filter(t => activeItem && t.groupId > activeItem.groupId)
    .sort((a, b) => a.groupId - b.groupId)
    .map(t => ({ id: t.id, text: t.text }));

  return (
    <div className="h-screen w-screen bg-slate-950 text-white overflow-hidden font-sans relative flex flex-col items-center justify-center">
      
      {/* 1. BACKGROUND LAYER */}
      <div className="absolute inset-0 bg-gradient-to-b from-slate-900 to-slate-950 z-0"></div>
      
      {/* 2. MODAL LAYER */}
      <OnboardingModal 
        allLanguages={ALL_LANGUAGES} 
        onComplete={handleOnboardingComplete} 
      />

      <div className="absolute top-0 left-0 w-full z-50">
        <HeaderControls 
            currentRoom={currentRoom}
            onRoomChange={handleRoomChange}
            userLanguage={targetLanguages.length > 1 ? `${targetLanguages.length} Språk` : targetLanguages[0] || 'Välj'}
            onOpenLangModal={() => setShowLangModal(true)}
            onToggleTower={() => setDebugMode(!debugMode)} 
            status={status}
        />
      </div>

      <LanguageSelectorModal 
        isOpen={showLangModal}
        onClose={() => setShowLangModal(false)}
        onSave={handleSaveLanguages}
        currentLanguages={targetLanguages} 
        allLanguages={ALL_LANGUAGES}
        isSingleSelection={currentRoom !== LOCAL_MODE_NAME}
      />

      {showCalibrationModal && (
          <CalibrationModal 
            isOpen={showCalibrationModal}
            onClose={() => setShowCalibrationModal(false)}
            transcripts={transcripts}
          />
      )}

      <SystemPromptModal 
        isOpen={showPromptModal}
        onClose={() => setShowPromptModal(false)}
        customSystemInstruction={customSystemInstruction}
        setCustomSystemInstruction={setCustomSystemInstruction}
        targetLanguages={targetLanguages}
        aiSpeakingRate={aiSpeakingRate}
      />

      {/* 3. NOTIFICATION LAYER */}
      {notification && (
          <div className="absolute top-24 left-1/2 transform -translate-x-1/2 bg-slate-800/80 border border-slate-700 px-4 py-2 rounded-full backdrop-blur-md z-30 animate-in fade-in slide-in-from-top-4 duration-200">
              <p className="text-slate-300 text-xs font-mono flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-slate-500" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM14.657 2.929a1 1 0 011.414 0A9.972 9.972 0 0119 10a9.972 9.972 0 01-2.929 7.071 1 1 0 01-1.414-1.414A7.971 7.971 0 0017 10c0-2.21-.894-4.208-2.343-5.657a1 1 0 010-1.414zm-2.829 2.828a1 1 0 011.415 0A5.983 5.983 0 0115 10a5.984 5.984 0 01-1.757 4.243 1 1 0 01-1.415-1.415A3.984 3.984 0 0013 10a3.983 3.983 0 00-1.172-2.828 1 1 0 010-1.415z" clipRule="evenodd" />
                  </svg>
                  {notification}
              </p>
          </div>
      )}

      {error && (
          <div className="absolute top-32 left-4 right-4 bg-red-500/10 border border-red-500/50 rounded-lg p-3 z-30 text-center backdrop-blur-md">
              <p className="text-red-400 text-sm font-medium">{error}</p>
          </div>
      )}

      {/* 4. MAIN CONTENT LAYER */}
      <div className="flex-1 w-full relative z-10 flex flex-col">
          <SubtitleOverlay 
            activeGroup={activeGroup}
            history={history}
            queue={queue}
          />
      </div>
      
      {/* 5. DIAGNOSTICS LAYER */}
      {debugMode && (
          <Tower 
              diagnosticsRef={audioDiagnosticsRef} 
              isConnected={status === 'connected'}
              triggerTestTone={triggerTestTone} 
              injectTextAsAudio={injectTextAsAudio}
              initAudioInput={initAudioInput} 
              
              aiSpeakingRate={aiSpeakingRate}
              setAiSpeakingRate={setAiSpeakingRate}
              minTurnDuration={minTurnDuration}
              setMinTurnDuration={setMinTurnDuration}
              vadThreshold={vadThreshold}
              setVadThreshold={setVadThreshold}
              silenceThreshold={silenceThreshold}
              setSilenceThreshold={setSilenceThreshold}
              volMultiplier={volMultiplier}
              setVolMultiplier={setVolMultiplier}

              // PASS DEVICES
              inputDeviceId={inputDeviceId}
              setInputDeviceId={setInputDeviceId}
              outputDeviceId={outputDeviceId}
              setOutputDeviceId={setOutputDeviceId}

              debugMode={debugMode}
              setDebugMode={setDebugMode}
              onOpenCalibration={() => setShowCalibrationModal(true)}

              connect={connect}
              disconnect={disconnect}
              setCustomSystemInstruction={setCustomSystemInstruction}

              enableLogs={enableLogs}
              setEnableLogs={setEnableLogs}
              
              onOpenPromptModal={() => setShowPromptModal(true)}
          />
      )}

      <ControlBar 
        activeMode={activeMode}
        setMode={setMode}
      />
    </div>
  );
};

export default App;
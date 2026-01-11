
import React, { useEffect, useRef } from 'react';

interface DoctorLogViewProps {
    logs: string[];
}

const DoctorLogView: React.FC<DoctorLogViewProps> = ({ logs }) => {
    const scrollRef = useRef<HTMLDivElement>(null);

    // Auto-scroll logic
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [logs]);

    return (
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 font-mono text-[10px] leading-relaxed bg-black/40 scrollbar-hide space-y-2 border-b border-slate-800">
            {logs.length === 0 && (
                <div className="text-slate-500 text-center mt-10 italic px-8">
                    <p className="mb-2">👋 Välkommen till DIAGNOS LAB.</p>
                    <p>Jag kan köra tester åt dig. Prova skriv:</p>
                    <code className="block bg-slate-900/50 p-1 rounded mt-2">"Kör ett stresstest"</code>
                    <code className="block bg-slate-900/50 p-1 rounded mt-1">"Testa ljudet"</code>
                </div>
            )}
            {logs.map((log, i) => {
                let style = "border-slate-700 text-slate-400";
                if (log.includes('[ACTION]')) style = "bg-blue-900/10 border-blue-500 text-blue-300";
                if (log.includes('[SUCCESS]')) style = "bg-green-900/10 border-green-500 text-green-300";
                if (log.includes('[ERROR]')) style = "bg-red-900/10 border-red-500 text-red-300";
                if (log.includes('[WARNING]')) style = "bg-yellow-900/10 border-yellow-500 text-yellow-300";
                if (log.includes('[USER]')) style = "bg-slate-700/30 border-slate-500 text-white text-right";
                if (log.includes('[AI]')) style = "bg-indigo-900/20 border-indigo-500 text-indigo-200";

                return (
                    <div key={i} className={`p-2 rounded border-l-2 ${style} break-words`}>
                        {log.replace(/\[.*?\] /, '')}
                    </div>
                );
            })}
        </div>
    );
};

export default DoctorLogView;

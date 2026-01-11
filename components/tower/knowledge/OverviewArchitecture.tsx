
import React from 'react';

const OverviewArchitecture: React.FC = () => {
    return (
        <section className="mb-8 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-200">
            <h3 className="text-emerald-400 font-bold text-xs uppercase tracking-widest mb-3 border-b border-emerald-500/30 pb-1">
                3. Lösningar & Hybridmotor
            </h3>
            
            <div className="space-y-4 bg-slate-900/30 p-4 rounded-xl border border-slate-800">
                <div className="flex gap-3">
                    <div className="shrink-0 w-8 h-8 bg-slate-800 rounded-full flex items-center justify-center font-bold text-slate-500 text-xs">A</div>
                    <div>
                        <h4 className="text-xs font-bold text-white">Lokal Neural VAD (Voice Activity Detection)</h4>
                        <p className="text-[10px] text-slate-400 mt-1 leading-relaxed">
                            Innan ljud ens skickas till Google, analyserar en lokal AI-modell (ONNX Silero) ljudvågorna i webbläsaren. 
                            Den avgör millisekund för millisekund: <em>"Är detta mänskligt tal eller bara en tappad psalmbok?"</em>. 
                            Detta sparar bandbredd och förhindrar att AI:n försöker översätta tystnad.
                        </p>
                    </div>
                </div>

                <div className="flex gap-3">
                    <div className="shrink-0 w-8 h-8 bg-slate-800 rounded-full flex items-center justify-center font-bold text-slate-500 text-xs">B</div>
                    <div>
                        <h4 className="text-xs font-bold text-white">Hybrid Buffering & Latensstyrning</h4>
                        <p className="text-[10px] text-slate-400 mt-1 leading-relaxed">
                            Vi använder en adaptiv "Jitter Buffer". Om nätverket hackar, ökar vi bufferten något. 
                            När nätverket är bra, spelar vi upp ljudet snabbare (t.ex. 1.05x hastighet) för att "springa ikapp" talaren utan att tonläget (pitch) ändras.
                        </p>
                    </div>
                </div>

                <div className="flex gap-3">
                    <div className="shrink-0 w-8 h-8 bg-slate-800 rounded-full flex items-center justify-center font-bold text-slate-500 text-xs">C</div>
                    <div>
                        <h4 className="text-xs font-bold text-white">WebSocket Full-Duplex</h4>
                        <p className="text-[10px] text-slate-400 mt-1 leading-relaxed">
                            Vi håller en öppen "tunnel" (WebSocket) mot Gemini. Vi strömmar 16kHz PCM-ljud upp och tar emot PCM-ljud ner.
                        </p>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default OverviewArchitecture;

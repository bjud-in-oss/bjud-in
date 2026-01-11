import React from 'react';

const BargeInDeepDive: React.FC = () => {
    return (
        <section className="mb-8 animate-in fade-in slide-in-from-bottom-5 duration-500 delay-300">
            <h3 className="text-yellow-400 font-bold text-xs uppercase tracking-widest mb-3 border-b border-yellow-500/30 pb-1">
                4. Barge-In Logik & Flödeskontroll
            </h3>

            <div className="space-y-6 text-slate-300 font-sans text-xs leading-relaxed bg-slate-900/50 p-4 rounded-xl border border-slate-800">
                
                {/* DEFINITIONER */}
                <div>
                    <h4 className="text-white font-bold mb-2">Huvudproblemet: Gemini lyssnar INTE när den pratar</h4>
                    <p className="mb-3">
                        Gemini Live API är konversativt. Det betyder att det fungerar som en walkie-talkie: 
                        <strong>Antingen sänder vi, eller så sänder Gemini. Inte båda samtidigt.</strong>
                    </p>
                    <div className="bg-red-900/20 p-2 rounded border-l-2 border-red-500 text-[11px]">
                        <strong>Felaktigt antagande:</strong> "Vi sänder tills vi hör att Gemini svarar."<br/>
                        <strong>Korrekt logik:</strong> "Gemini KOMMER INTE att svara förrän vi slutar sända (markerar 'Turn Complete')."
                    </div>
                </div>

                {/* METODIK */}
                <div>
                    <h4 className="text-indigo-400 font-bold uppercase tracking-widest mb-4">
                        Lösning: "Micro-Turns" Protokollet
                    </h4>
                    
                    <p className="mb-4 text-[11px] text-slate-400">
                        För att få detta att kännas som "streaming" måste vi snabbt växla mellan att sända och ta emot. 
                        Vi använder vår lokala <strong>Neurala VAD</strong> för att hitta minsta lilla paus i talet.
                    </p>
                    
                    <div className="space-y-6 relative pl-4 border-l-2 border-slate-700 ml-2">
                        
                        {/* STATE A */}
                        <div className="relative">
                            <div className="absolute -left-[21px] top-0 w-3 h-3 rounded-full bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]"></div>
                            <h5 className="font-bold text-white mb-1">Fas 1: Responsiv Streaming (Sänder)</h5>
                            <p className="text-slate-400">
                                Vi är säkra på att kusten är klar (Prediktionsmodellen säger "Idle"). 
                                Vi skickar ljudpaket direkt när de kommer från mikrofonen för minimal latens.
                            </p>
                        </div>

                        {/* STATE B */}
                        <div className="relative">
                            <div className="absolute -left-[21px] top-0 w-3 h-3 rounded-full bg-yellow-500 shadow-[0_0_10px_rgba(234,179,8,0.5)]"></div>
                            <h5 className="font-bold text-white mb-1">Fas 2: VAD-Paus (Växlingen)</h5>
                            <p className="text-slate-400">
                                VAD upptäcker en tystnad &gt; 200ms. Vi skickar omedelbart signalen <code>TurnComplete</code> till Gemini. 
                                <strong>Detta är nyckeln.</strong> Nu slutar vi sända till nätverket och börjar istället buffra mikrofonljudet lokalt i minnet.
                            </p>
                        </div>

                        {/* STATE C */}
                        <div className="relative">
                            <div className="absolute -left-[21px] top-0 w-3 h-3 rounded-full bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]"></div>
                            <h5 className="font-bold text-white mb-1">Fas 3: AI Bearbetar (Buffring)</h5>
                            <p className="text-slate-400">
                                Gemini tar emot vår <code>TurnComplete</code>, tänker, och börjar strömma svar. 
                                Under hela denna tid (Prediktionstid + Svarstid) ligger vi kvar i buffringsläge. 
                                Om vi skulle sända nu, skulle Gemini tystna ("Barge-in").
                            </p>
                        </div>

                        {/* STATE D */}
                        <div className="relative">
                            <div className="absolute -left-[21px] top-0 w-3 h-3 rounded-full bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]"></div>
                            <h5 className="font-bold text-white mb-1">Fas 4: Burst & Catch-up</h5>
                            <p className="text-slate-400">
                                När Gemini är klar (skickar <code>TurnComplete</code> tillbaka), eller om vår Prediktionsmodell (se nedan) 
                                säger att "Nu borde den vara klar", öppnar vi dammluckorna. 
                                Hela den lokala bufferten skickas som en "Burst". Vi är tillbaka i Fas 1.
                            </p>
                        </div>

                    </div>
                </div>

            </div>
        </section>
    );
};

export default BargeInDeepDive;


import React from 'react';

const FutureOptimizationPlan: React.FC = () => {
    return (
        <section className="mb-12 animate-in fade-in slide-in-from-bottom-8 duration-500 delay-600">
            <h3 className="text-cyan-400 font-bold text-xs uppercase tracking-widest mb-3 border-b border-cyan-500/30 pb-1">
                7. Åtgärdsplan & Kritisk Analys
            </h3>

            <div className="bg-slate-900/80 p-4 rounded-xl border border-cyan-500/20 text-slate-300 text-xs">
                <p className="mb-4 text-[11px] text-slate-400">
                    Här utvärderas potentiella lösningar på "Paus-paradoxen" (att AI svarar för tidigt). 
                    Varje plan utsätts för en rekursiv teknisk kritik för att avgöra dess faktiska viabilitet.
                </p>

                <div className="space-y-6">
                    
                    {/* PLAN 1 */}
                    <div className="space-y-2">
                        <div className="flex gap-2 items-center">
                            <div className="text-cyan-400 font-bold text-[10px] border border-cyan-500/30 px-1.5 rounded bg-cyan-900/30">PLAN A</div>
                            <strong className="text-white text-[11px]">Comfort Noise Injection (Anti-Silence)</strong>
                        </div>
                        <p className="text-[10px] text-slate-400 ml-1">
                            <strong>Teori:</strong> Skicka svagt brus under korta pauser för att lura Geminis VAD att vi fortfarande pratar.
                        </p>
                        
                        <div className="ml-2 pl-3 border-l border-red-500/30 space-y-2">
                            <div>
                                <strong className="text-red-400 text-[9px] uppercase tracking-wide">Kritik Nivå 1 (Funktion):</strong>
                                <p className="text-[10px] text-slate-500">
                                    Om vi skickar brus, tror Gemini att vi pratar ("User Turn" är aktiv). Då kommer den <em>aldrig</em> att svara. 
                                    Vi byter ett problem (svarar för tidigt) mot ett annat (svarar aldrig).
                                </p>
                            </div>
                            <div>
                                <strong className="text-red-400 text-[9px] uppercase tracking-wide">Kritik Nivå 2 (Latens):</strong>
                                <p className="text-[10px] text-slate-500">
                                    För att Gemini ska svara måste vi till slut sluta sända bruset. 
                                    Hur vet systemet när pausen är en "riktig" paus? Vi är tillbaka på ruta ett: Vi måste gissa pausens längd. 
                                    Dessutom ökar vi bandbreddsanvändningen genom att streama tystnad.
                                </p>
                            </div>
                            <div className="bg-red-950/30 p-2 rounded border border-red-500/10">
                                <strong className="text-red-300 text-[9px]">SLUTSATS:</strong>
                                <span className="text-[10px] text-slate-400"> Förkastad. Skapar "Deadlock" där AI väntar på oss för evigt.</span>
                            </div>
                        </div>
                    </div>

                    {/* PLAN 2 */}
                    <div className="space-y-2">
                        <div className="flex gap-2 items-center">
                            <div className="text-cyan-400 font-bold text-[10px] border border-cyan-500/30 px-1.5 rounded bg-cyan-900/30">PLAN B</div>
                            <strong className="text-white text-[11px]">Lokal Semantisk Detektion (LLM)</strong>
                        </div>
                        <p className="text-[10px] text-slate-400 ml-1">
                            <strong>Teori:</strong> Analysera texten lokalt. Skicka bara "TurnComplete" om meningen är grammatiskt komplett.
                        </p>
                        
                        <div className="ml-2 pl-3 border-l border-red-500/30 space-y-2">
                            <div>
                                <strong className="text-red-400 text-[9px] uppercase tracking-wide">Kritik Nivå 1 (Prestanda):</strong>
                                <p className="text-[10px] text-slate-500">
                                    Att köra en lokal Whisper/LLM i webbläsaren samtidigt som ljudprocessering drar enormt med CPU/Batteri på mobiler. 
                                    Det skulle kunna krascha ljudtråden (AudioContext).
                                </p>
                            </div>
                            <div>
                                <strong className="text-red-400 text-[9px] uppercase tracking-wide">Kritik Nivå 2 (Synk):</strong>
                                <p className="text-[10px] text-slate-500">
                                    Gemini streamar ljud, inte text. Vi har ingen text att analysera förrän Gemini skickat transkriptionen, 
                                    vilket sker <em>efter</em> ljudet skickats. Vi kan inte analysera det vi inte skickat än.
                                </p>
                            </div>
                            <div className="bg-yellow-950/30 p-2 rounded border border-yellow-500/10">
                                <strong className="text-yellow-300 text-[9px]">SLUTSATS:</strong>
                                <span className="text-[10px] text-slate-400"> Tekniskt omöjligt i nuvarande arkitektur utan extrem latens.</span>
                            </div>
                        </div>
                    </div>

                    {/* PLAN 3 */}
                    <div className="space-y-2">
                        <div className="flex gap-2 items-center">
                            <div className="text-cyan-400 font-bold text-[10px] border border-cyan-500/30 px-1.5 rounded bg-cyan-900/30">PLAN C</div>
                            <strong className="text-white text-[11px]">Dynamisk Prompt-Styrning (Prompt Engineering)</strong>
                        </div>
                        <p className="text-[10px] text-slate-400 ml-1">
                            <strong>Teori:</strong> Beordra Gemini via systeminstruktionen att ignorera korta pauser och invänta minst 1 sek tystnad.
                        </p>
                        
                        <div className="ml-2 pl-3 border-l border-green-500/30 space-y-2">
                            <div>
                                <strong className="text-red-400 text-[9px] uppercase tracking-wide">Kritik Nivå 1 (API-begränsning):</strong>
                                <p className="text-[10px] text-slate-500">
                                    Geminis interna VAD styrs inte direkt av prompten. Den styrs av serverns "End of Turn"-detektion som vi inte har API-tillgång till.
                                </p>
                            </div>
                            <div>
                                <strong className="text-green-400 text-[9px] uppercase tracking-wide">Mot-Kritik (Möjlighet):</strong>
                                <p className="text-[10px] text-slate-500">
                                    Men vi kan instruera den att <em>när</em> den svarar, ska den börja med en "tanke-paus" eller filler-word ("Hmm..."). 
                                    Om vi då upptäcker att användaren fortsätter prata, kan vi klippa bort AI:s "Hmm..." lokalt utan att användaren märkte avbrottet.
                                </p>
                            </div>
                            <div className="bg-green-950/30 p-2 rounded border border-green-500/10">
                                <strong className="text-green-300 text-[9px]">SLUTSATS:</strong>
                                <span className="text-[10px] text-slate-400"> Mest lovande. Kräver smartare klient-logik som "tystar" AI:n om användaren återupptar tal (Barge-In prioritet).</span>
                            </div>
                        </div>
                    </div>

                    {/* PLAN 4: MONOLOGUE PROTECTION (Moved from Code to Docs) */}
                    <div className="space-y-2">
                        <div className="flex gap-2 items-center">
                            <div className="text-cyan-400 font-bold text-[10px] border border-cyan-500/30 px-1.5 rounded bg-cyan-900/30">PLAN D</div>
                            <strong className="text-white text-[11px]">Monolog-vakten (Force Split)</strong>
                        </div>
                        <p className="text-[10px] text-slate-400 ml-1">
                            <strong>Teori:</strong> Vid långa tal (20min+): Klipp ljudströmmen artificiellt var 15:e sekund för att tvinga fram en översättning.
                        </p>
                        
                        <div className="ml-2 pl-3 border-l border-red-500/30 space-y-2">
                            <div>
                                <strong className="text-red-400 text-[9px] uppercase tracking-wide">Kritik Nivå 1 (Krockrisk):</strong>
                                <p className="text-[10px] text-slate-500">
                                    När vi klipper strömmen tolkar Gemini det som en paus och börjar svara. 
                                    Men användaren pratar ju fortfarande! Detta garanterar en "Barge-in"-kollision var 15:e sekund.
                                </p>
                            </div>
                            <div>
                                <strong className="text-red-400 text-[9px] uppercase tracking-wide">Kritik Nivå 2 (Ljudkvalitet):</strong>
                                <p className="text-[10px] text-slate-500">
                                    Att klippa mitt i ett ord eller en mening gör översättningen fragmenterad och konstig. 
                                    Det kan skapa "hallucinationer" hos AI:n eftersom kontexten bryts onaturligt.
                                </p>
                            </div>
                            <div className="bg-yellow-950/30 p-2 rounded border border-yellow-500/10">
                                <strong className="text-yellow-300 text-[9px]">SLUTSATS:</strong>
                                <span className="text-[10px] text-slate-400"> Bör endast användas som "Nödutgång" om minnet riskerar att ta slut, inte som standardmetod.</span>
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </section>
    );
};

export default FutureOptimizationPlan;

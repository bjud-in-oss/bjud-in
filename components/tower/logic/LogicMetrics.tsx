
import React, { forwardRef } from 'react';

// Define the shape of refs this component exposes
export interface LogicMetricsRefs {
    // Row 1: Core VAD
    vadRef: HTMLSpanElement | null;
    thrRef: HTMLSpanElement | null;
    spkRef: HTMLSpanElement | null;
    silRef: HTMLSpanElement | null;
    // Row 2: System State
    gapRef: HTMLSpanElement | null;
    bufRef: HTMLSpanElement | null;
    modeRef: HTMLSpanElement | null;
    latRef: HTMLSpanElement | null;
    // Row 3: Logic Queue
    bsyRef: HTMLSpanElement | null; // Busy
    qlnRef: HTMLSpanElement | null; // Queue Len (Logical)
    aslpRef: HTMLSpanElement | null; // Auto Sleep
    vstRef: HTMLSpanElement | null; // VAD State
    // Row 4: Network Buffer (Deep Debug)
    cnbRef: HTMLSpanElement | null; // Connecting Buffer (Raw Audio)
    infRef: HTMLSpanElement | null; // In Flight
    ltsRef: HTMLSpanElement | null; // Last Speech Delta (ms)
    avgRef: HTMLSpanElement | null; // Avg VAD Prob (NEW)
    // Row 5: Lab Metrics (NEW)
    rttRef: HTMLSpanElement | null; // Round Trip Time
    volRef: HTMLSpanElement | null; // Volume Multiplier
}

interface LogicMetricsProps {
    onExplain: (key: string) => void;
}

const LogicMetrics = forwardRef<LogicMetricsRefs, LogicMetricsProps>(({ onExplain }, ref) => {
    
    // Helper to assign refs
    const setRef = (key: keyof LogicMetricsRefs) => (el: any) => {
        if (ref && typeof ref === 'object' && ref.current) {
            ref.current[key] = el;
        }
    };

    const MetricItem = ({ id, label, rKey, color = "text-white" }: { id: string, label: string, rKey: keyof LogicMetricsRefs, color?: string }) => (
        <div className="hover:bg-slate-800 rounded p-0.5 cursor-pointer flex flex-col items-center justify-center min-h-[28px]" onClick={() => onExplain(id)}>
            <div className="text-slate-500 text-[7px] uppercase tracking-wider">{label}</div>
            <span ref={setRef(rKey)} className={`${color} text-[9px] font-mono leading-none mt-0.5`}>---</span>
        </div>
    );

    return (
        <div className="p-2 grid grid-cols-4 gap-y-2 gap-x-1 bg-slate-900/50">
            {/* ROW 1: CORE VAD */}
            <MetricItem id="VAD" label="Prob" rKey="vadRef" />
            <MetricItem id="THR" label="Thr" rKey="thrRef" color="text-indigo-300" />
            <MetricItem id="SPK" label="Speak" rKey="spkRef" />
            <MetricItem id="SIL" label="Silence" rKey="silRef" />

            {/* ROW 2: SYSTEM STATE */}
            <MetricItem id="GAP" label="Gap" rKey="gapRef" />
            <MetricItem id="BUF" label="Buff" rKey="bufRef" />
            <MetricItem id="MODE" label="Mode" rKey="modeRef" />
            <MetricItem id="LTC" label="Total" rKey="latRef" />

            {/* ROW 3: LOGIC QUEUE */}
            <MetricItem id="BSY" label="Busy" rKey="bsyRef" />
            <MetricItem id="Q_LN" label="Q-Log" rKey="qlnRef" />
            <MetricItem id="ASLP" label="Sleep" rKey="aslpRef" color="text-yellow-500" />
            <MetricItem id="V_ST" label="State" rKey="vstRef" />

            {/* ROW 4: PHYSICAL BUFFER (NEW) */}
            <MetricItem id="CN_B" label="Cn-Buf" rKey="cnbRef" color="text-purple-300" />
            <MetricItem id="INF" label="In-Fly" rKey="infRef" />
            <MetricItem id="L_TS" label="Last-S" rKey="ltsRef" />
            <MetricItem id="V_AVG" label="V-Avg" rKey="avgRef" color="text-blue-300" />

            {/* ROW 5: LAB METRICS (NEW) */}
            <MetricItem id="RTT" label="Ping" rKey="rttRef" color="text-emerald-400" />
            <MetricItem id="VOL" label="Gain" rKey="volRef" color="text-orange-300" />
            <div className="col-span-2"></div> 
        </div>
    );
});

export default LogicMetrics;

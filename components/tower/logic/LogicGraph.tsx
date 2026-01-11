
import React, { forwardRef } from 'react';

interface LogicGraphProps {
    // No specific props needed, controlled via Ref
}

const LogicGraph = forwardRef<HTMLCanvasElement, LogicGraphProps>((props, ref) => {
    return (
        <div className="relative h-10 w-full bg-slate-950 border-b border-slate-800">
            <canvas ref={ref} width={288} height={40} className="w-full h-full opacity-60" />
            <div className="absolute top-0 right-1 text-slate-600 pointer-events-none text-[8px]">PROB vs THR</div>
        </div>
    );
});

export default LogicGraph;

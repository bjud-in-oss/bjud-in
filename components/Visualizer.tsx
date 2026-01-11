
import React, { useEffect, useRef } from 'react';

interface VisualizerProps {
  // Changed from number value to Ref to prevent parent Re-renders
  audioVolRef: React.MutableRefObject<number>;
  isActive: boolean;
}

const Visualizer: React.FC<VisualizerProps> = ({ audioVolRef, isActive }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    
    // Config
    const bars = 30;
    const barWidth = canvas.width / bars;
    const baseHeight = 4;

    const render = () => {
      // Read directly from Ref - No React State involved!
      const currentVol = audioVolRef.current; 

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      if (!isActive) {
        ctx.fillStyle = '#334155'; // slate-700
        for (let i = 0; i < bars; i++) {
           ctx.fillRect(i * barWidth, canvas.height / 2 - 1, barWidth - 2, 2);
        }
        animationFrameId = requestAnimationFrame(render);
        return;
      }

      const center = canvas.height / 2;
      for (let i = 0; i < bars; i++) {
        const offset = Math.sin(Date.now() / 200 + i * 0.5) * 0.5 + 0.5; 
        const dynamicVol = currentVol * (0.5 + Math.random() * 0.5); 
        
        const distanceFromCenter = Math.abs(i - bars / 2) / (bars / 2);
        const scale = 1 - distanceFromCenter * 0.5; 
        
        const h = Math.max(baseHeight, dynamicVol * canvas.height * 0.8 * scale * offset);
        
        const hue = 210 + (h / canvas.height) * 60; 
        ctx.fillStyle = `hsl(${hue}, 80%, 60%)`;
        
        ctx.fillRect(i * barWidth, center - h / 2, barWidth - 2, h);
      }
      
      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [isActive, audioVolRef]); // Depend on ref object, not value

  return (
    <canvas 
      ref={canvasRef} 
      width={300} 
      height={60} 
      className="w-full h-16 rounded-lg bg-slate-900/50"
    />
  );
};

export default Visualizer;

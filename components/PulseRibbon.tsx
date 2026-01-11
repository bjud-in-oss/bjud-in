
import React, { useEffect, useRef } from 'react';

interface PulseRibbonProps {
    isActive: boolean;
}

const PulseRibbon: React.FC<PulseRibbonProps> = ({ isActive }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let animationFrameId: number;
        let time = 0;

        // Resize handler
        const resize = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        };
        window.addEventListener('resize', resize);
        resize();

        const render = () => {
            ctx.fillStyle = '#020617'; // Match Slate-950
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            const centerY = canvas.height * 0.55; // Slightly lower than center
            const amplitude = isActive ? 60 : 10;
            const speed = isActive ? 0.05 : 0.01;
            
            time += speed;

            // Draw multiple waves for "Ribbon" effect
            for (let i = 0; i < 5; i++) {
                ctx.beginPath();
                const offset = i * 20;
                const colorAlpha = 0.1 - (i * 0.015);
                
                ctx.strokeStyle = `rgba(99, 102, 241, ${colorAlpha})`; // Indigo
                ctx.lineWidth = 2;

                for (let x = 0; x < canvas.width; x += 5) {
                    // Sine wave logic
                    const y = centerY + 
                              Math.sin(x * 0.003 + time + i) * amplitude * Math.sin(time * 0.5) +
                              Math.cos(x * 0.01 - time) * (amplitude * 0.5);
                    
                    if (x === 0) ctx.moveTo(x, y);
                    else ctx.lineTo(x, y);
                }
                ctx.stroke();
            }

            // Simple particles if active
            if (isActive) {
                for(let p=0; p<3; p++) {
                    const px = Math.random() * canvas.width;
                    const py = centerY + (Math.random() - 0.5) * 150;
                    ctx.fillStyle = `rgba(165, 180, 252, ${Math.random() * 0.3})`;
                    ctx.beginPath();
                    ctx.arc(px, py, Math.random() * 2, 0, Math.PI * 2);
                    ctx.fill();
                }
            }

            animationFrameId = requestAnimationFrame(render);
        };

        render();

        return () => {
            window.removeEventListener('resize', resize);
            cancelAnimationFrame(animationFrameId);
        };
    }, [isActive]);

    return (
        <canvas 
            ref={canvasRef} 
            className="absolute inset-0 w-full h-full pointer-events-none z-0"
        />
    );
};

export default PulseRibbon;

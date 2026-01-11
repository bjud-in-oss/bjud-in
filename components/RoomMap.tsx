
import React, { useRef, useState, useEffect, useImperativeHandle, forwardRef } from 'react';
import { MAP_WIDTH, MAP_HEIGHT, MAP_POINTS } from '../utils/roomData';

interface RoomMapProps {
  imgUrl: string | null;
  tempSelection: string;
  currentRoom: string;
  onSelect: (roomName: string) => void;
  onConfirm: () => void;
  setMobileFocus: (focus: 'map') => void;
}

export interface RoomMapRef {
    panToPoint: (x: number, y: number) => void;
}

const RoomMap = forwardRef<RoomMapRef, RoomMapProps>(({ 
    imgUrl, 
    tempSelection, 
    currentRoom, 
    onSelect, 
    onConfirm,
    setMobileFocus 
}, ref) => {
    
  const [transform, setTransform] = useState({ x: 0, y: 0, scale: 1 });
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Interaction Refs
  const isDraggingRef = useRef(false);
  const lastPosRef = useRef({ x: 0, y: 0 });
  const lastDistRef = useRef<number | null>(null);

  const hasChanged = tempSelection !== currentRoom;

  // --- EXPOSE PAN METHOD ---
  useImperativeHandle(ref, () => ({
    panToPoint: (pointX: number, pointY: number) => {
      if (!containerRef.current) return;
      const { clientWidth, clientHeight } = containerRef.current;
      const targetScale = transform.scale < 1 ? 1 : transform.scale;
      setTransform({
          x: (clientWidth / 2) - (pointX * targetScale),
          y: (clientHeight / 2) - (pointY * targetScale),
          scale: targetScale
      });
    }
  }));

  // --- INITIAL CENTER ---
  useEffect(() => {
    if (containerRef.current) {
        const { clientWidth, clientHeight } = containerRef.current;
        
        // Default center
        const initialX = (clientWidth - MAP_WIDTH) / 2;
        const initialY = (clientHeight - MAP_HEIGHT) / 2;
        
        const point = MAP_POINTS.find(p => p.name === currentRoom);
        if (point) {
            setTransform({
                x: (clientWidth / 2) - point.x,
                y: (clientHeight / 2) - point.y,
                scale: 1 
            });
        } else {
            setTransform({ x: initialX, y: initialY, scale: 0.8 });
        }
    }
  }, []); // Run once on mount

  // --- PAN & ZOOM LOGIC ---
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    if (!containerRef.current) return;

    const zoomIntensity = 0.001;
    const newScale = Math.min(Math.max(0.2, transform.scale - e.deltaY * zoomIntensity), 4);
    
    const rect = containerRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const scaleRatio = newScale / transform.scale;
    
    const newX = mouseX - (mouseX - transform.x) * scaleRatio;
    const newY = mouseY - (mouseY - transform.y) * scaleRatio;

    setTransform({ x: newX, y: newY, scale: newScale });
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    setMobileFocus('map');
    isDraggingRef.current = true;
    
    if (e.touches.length === 2) {
        const dist = Math.hypot(
            e.touches[0].clientX - e.touches[1].clientX,
            e.touches[0].clientY - e.touches[1].clientY
        );
        lastDistRef.current = dist;
    } else {
        lastPosRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDraggingRef.current) return;
    
    if (e.touches.length === 2 && lastDistRef.current !== null) {
        const newDist = Math.hypot(
            e.touches[0].clientX - e.touches[1].clientX,
            e.touches[0].clientY - e.touches[1].clientY
        );
        
        const zoomFactor = newDist / lastDistRef.current;
        const newScale = Math.min(Math.max(0.2, transform.scale * zoomFactor), 4);
        
        const centerX = (e.touches[0].clientX + e.touches[1].clientX) / 2;
        const centerY = (e.touches[0].clientY + e.touches[1].clientY) / 2;
        
        const rect = containerRef.current!.getBoundingClientRect();
        const relativeX = centerX - rect.left;
        const relativeY = centerY - rect.top;

        const scaleRatio = newScale / transform.scale;
        const newX = relativeX - (relativeX - transform.x) * scaleRatio;
        const newY = relativeY - (relativeY - transform.y) * scaleRatio;

        setTransform({ x: newX, y: newY, scale: newScale });
        lastDistRef.current = newDist;

    } else if (e.touches.length === 1) {
        const dx = e.touches[0].clientX - lastPosRef.current.x;
        const dy = e.touches[0].clientY - lastPosRef.current.y;
        
        setTransform(prev => ({ ...prev, x: prev.x + dx, y: prev.y + dy }));
        lastPosRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    }
  };

  const handleTouchEnd = () => {
    isDraggingRef.current = false;
    lastDistRef.current = null;
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    setMobileFocus('map');
    isDraggingRef.current = true;
    lastPosRef.current = { x: e.clientX, y: e.clientY };
  };
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDraggingRef.current) return;
    const dx = e.clientX - lastPosRef.current.x;
    const dy = e.clientY - lastPosRef.current.y;
    setTransform(prev => ({ ...prev, x: prev.x + dx, y: prev.y + dy }));
    lastPosRef.current = { x: e.clientX, y: e.clientY };
  };
  const handleMouseUp = () => {
    isDraggingRef.current = false;
  };

  return (
    <div 
        ref={containerRef}
        className="w-full h-full relative bg-[#0f172a] cursor-grab active:cursor-grabbing touch-none"
        style={{ touchAction: 'none' }} 
        onWheel={handleWheel}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseUp}
        onClick={() => setMobileFocus('map')}
    >
        {/* TRANSFORM CONTAINER */}
        <div 
        style={{ 
            width: MAP_WIDTH, 
            height: MAP_HEIGHT,
            transform: `translate3d(${transform.x}px, ${transform.y}px, 0) scale(${transform.scale})`,
            transformOrigin: '0 0',
            transition: isDraggingRef.current ? 'none' : 'transform 0.1s ease-out'
        }}
        className="relative will-change-transform"
        >
            {/* Background Color Placeholder */}
            <div className="absolute inset-0 bg-slate-900 flex items-center justify-center">
            {!imgUrl && <span className="text-slate-700 text-lg font-mono">Laddar karta...</span>}
            </div>

            {/* Background Image */}
            {imgUrl && (
                <img 
                src={imgUrl} 
                alt="Karta över kapellet" 
                className="absolute inset-0 w-full h-full object-fill select-none pointer-events-none"
                draggable={false}
                />
            )}

            {/* SVG Overlay */}
            <svg 
            width={MAP_WIDTH} 
            height={MAP_HEIGHT} 
            viewBox={`0 0 ${MAP_WIDTH} ${MAP_HEIGHT}`} 
            xmlns="http://www.w3.org/2000/svg"
            className="absolute inset-0 pointer-events-none"
            >
                {MAP_POINTS.map((point) => {
                    const isActive = tempSelection === point.name;
                    return (
                        <g 
                        key={point.id}
                        onClick={(e) => { e.stopPropagation(); onSelect(point.name); setMobileFocus('map'); }}
                        style={{ cursor: 'pointer', pointerEvents: 'auto' }}
                        >
                            {isActive && <circle cx={point.x} cy={point.y} r="32" fill="rgba(220,38,38,0.2)" stroke="rgba(220,38,38,0.4)" strokeWidth="1"/>}
                            <circle cx={point.x} cy={point.y} r={isActive ? 25 : 18} fill={isActive ? "#dc2626" : "#1e293b"} stroke={isActive ? "white" : "#475569"} strokeWidth="3" className="transition-all duration-300 ease-out" />
                            <text x={point.x} y={point.y} dy=".35em" textAnchor="middle" fill={isActive ? "white" : "#94a3b8"} fontSize={isActive ? "14" : "10"} fontWeight="bold" fontFamily="monospace" pointerEvents="none">{point.id}</text>
                            
                            <g transform={`translate(${point.x}, ${point.y - (isActive ? 45 : 30)})`} opacity={isActive ? 1 : 0} className="transition-opacity duration-300">
                                {isActive && (
                                    <>
                                    <rect x="-60" y="-15" width="120" height="30" rx="4" fill="rgba(0,0,0,0.8)" stroke="rgba(255,255,255,0.2)"/>
                                    <text x="0" y="5" textAnchor="middle" fill="white" fontSize="12" fontWeight="500">{point.name}</text>
                                    </>
                                )}
                            </g>

                            {isActive && hasChanged && (
                                <g transform={`translate(${point.x + 45}, ${point.y})`} onClick={(e) => { e.stopPropagation(); onConfirm(); }} className="cursor-pointer animate-in zoom-in duration-300">
                                    <circle r="22" fill="#22c55e" stroke="white" strokeWidth="2" filter="drop-shadow(0px 4px 6px rgba(0,0,0,0.5))" />
                                    <path d="M-8 0 L-2 6 L8 -6" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                                </g>
                            )}
                        </g>
                    );
                })}
            </svg>
        </div>
    </div>
  );
});

export default RoomMap;

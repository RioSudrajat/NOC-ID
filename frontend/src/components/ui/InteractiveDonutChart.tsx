"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface ChartData {
  id: string;
  label: string;
  value: number;
  color: string;
}

const defaultData: ChartData[] = [
  { id: "e-wallet", label: "E-Wallet", value: 45, color: "#5EEAD4" },
  { id: "bank", label: "Bank Transfer", value: 30, color: "#2DD4BF" },
  { id: "investment", label: "Staking", value: 15, color: "#14B8A6" },
  { id: "other", label: "Others", value: 10, color: "#0F766E" },
];

export function InteractiveDonutChart({ data = defaultData }: { data?: ChartData[] }) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [rotationOffset, setRotationOffset] = useState(0);

  const radius = 80;
  const strokeWidth = 30; // 3D thickness look
  const circumference = 2 * Math.PI * radius;
  
  const total = data.reduce((sum, item) => sum + item.value, 0);

  let currentAccumulated = 0;
  const segments = data.map((item, index) => {
    const percentage = item.value / total;
    const dashLength = percentage * circumference;
    const dashGap = circumference - dashLength;
    const offset = (-currentAccumulated / total) * circumference;
    
    // Calculate mid angle for label positioning
    const startAngle = (currentAccumulated / total) * 360;
    const endAngle = ((currentAccumulated + item.value) / total) * 360;
    const midAngle = startAngle + (endAngle - startAngle) / 2;
    // We adjust it by -90 deg because the SVG starts at top
    const trueMidAngle = midAngle - 90;
    
    // eslint-disable-next-line react-hooks/immutability
    currentAccumulated += item.value;

    return { ...item, percentage, dashLength, dashGap, offset, trueMidAngle, index };
  });

  return (
    <div className="relative w-full flex justify-center py-8">
      {/* Container to allow rotation dragging */}
      <motion.div 
        className="relative"
        style={{ width: 300, height: 300 }}
        drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.2}
        onDrag={(e, info) => {
          setRotationOffset(prev => prev + info.delta.x * 0.5);
        }}
        animate={{ rotate: rotationOffset }}
        transition={{ type: "spring", stiffness: 50, damping: 20 }}
      >
        <svg viewBox="0 0 300 300" className="w-full h-full drop-shadow-2xl overflow-visible">
          <filter id="shadow">
            <feDropShadow dx="0" dy="8" stdDeviation="12" floodOpacity="0.3" floodColor="#000" />
          </filter>

          {/* Background circle */}
          <circle 
            cx="150" cy="150" r={radius} 
            fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth={strokeWidth} 
          />

          {segments.map((seg) => {
            const isActive = activeIndex === seg.index;
            // Pop out effect: calculate dx, dy from center based on midAngle
            const angleRad = (seg.trueMidAngle * Math.PI) / 180;
            const popOutDist = isActive ? 12 : 0;
            const dx = Math.cos(angleRad) * popOutDist;
            const dy = Math.sin(angleRad) * popOutDist;

            // Line coordinates
            const labelRadius = radius + strokeWidth/2 + 20;
            const lineStartX = 150 + Math.cos(angleRad) * (radius + strokeWidth/2 + popOutDist);
            const lineStartY = 150 + Math.sin(angleRad) * (radius + strokeWidth/2 + popOutDist);
            const lineEndX = 150 + Math.cos(angleRad) * labelRadius;
            const lineEndY = 150 + Math.sin(angleRad) * labelRadius;
            const isRightSide = Math.cos(angleRad) > 0;
            const elbowX = lineEndX + (isRightSide ? 20 : -20);
            
            return (
              <g key={seg.id} style={{ transformOrigin: "150px 150px" }}>
                <motion.circle
                  cx="150" cy="150" r={radius}
                  fill="none"
                  stroke={seg.color}
                  strokeWidth={isActive ? strokeWidth + 6 : strokeWidth}
                  strokeDasharray={`${seg.dashLength} ${seg.dashGap}`}
                  strokeDashoffset={seg.offset}
                  // The -90 ensures standard SVG coordinate alignment at top
                  transform={`rotate(-90 150 150)`}
                  filter="url(#shadow)"
                  className="cursor-pointer transition-all duration-300 hover:brightness-110"
                  animate={{ x: dx, y: dy }}
                  onClick={() => setActiveIndex(isActive ? null : seg.index)}
                />
                
                {/* L-shaped line (Visible only when not heavily rotated to simplify layout) */}
                <AnimatePresence>
                  {isActive && (
                    <motion.g
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                    >
                      <polyline 
                        points={`${lineStartX},${lineStartY} ${lineEndX},${lineEndY} ${elbowX},${lineEndY}`} 
                        fill="none" 
                        stroke={seg.color} 
                        strokeWidth="2"
                        className="opacity-70"
                      />
                      {/* We counter-rotate the text so it stays upright despite the parent container's rotation */}
                      <g transform={`translate(${elbowX + (isRightSide ? 5 : -5)}, ${lineEndY}) rotate(${-rotationOffset})`}>
                        <text 
                          x={isRightSide ? 0 : -80} 
                          y="4" 
                          fill="white" 
                          fontSize="12" 
                          fontWeight="bold"
                          className="drop-shadow-md"
                        >
                          {seg.label}
                        </text>
                        <text 
                          x={isRightSide ? 0 : -80} 
                          y="18" 
                          fill="var(--solana-text-muted)" 
                          fontSize="10"
                        >
                          {(seg.percentage * 100).toFixed(1)}%
                        </text>
                      </g>
                    </motion.g>
                  )}
                </AnimatePresence>
              </g>
            );
          })}
        </svg>

        {/* Center Label */}
        <div 
          className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none"
          // Counter rotate the center text so it never spins
          style={{ transform: `rotate(${-rotationOffset}deg)` }}
        >
          <span className="text-sm" style={{ color: "var(--solana-text-muted)" }}>Total Balance</span>
          <span className="text-2xl font-bold gradient-text">1,248</span>
        </div>
      </motion.div>
    </div>
  );
}

'use client';
import React, { useEffect, useRef } from 'react';

interface NeuralSphereProps {
  isListening: boolean;
  isSpeaking: boolean;
  audioLevel: number; // 0–100
}

export function NeuralSphere({ isListening, isSpeaking, audioLevel }: NeuralSphereProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const frameRef = useRef<number>(0);
  const timeRef = useRef(0);

  const glowColor = isSpeaking ? '#3ecf8e' : isListening ? '#4f8ef7' : '#334155';
  const coreGrad = isSpeaking
    ? 'radial-gradient(circle at 38% 32%, #a7f3d0 0%, #3ecf8e 40%, #065f46 90%)'
    : isListening
    ? 'radial-gradient(circle at 38% 32%, #bae6fd 0%, #4f8ef7 40%, #0c1a3d 90%)'
    : 'radial-gradient(circle at 38% 32%, #64748b 0%, #1e293b 55%, #0f172a 100%)';

  // Animated noise ring on canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const SIZE = 170;
    canvas.width = SIZE;
    canvas.height = SIZE;
    const cx = SIZE / 2;
    const cy = SIZE / 2;

    const draw = () => {
      timeRef.current += 0.025;
      const t = timeRef.current;
      const al = audioLevel / 100;

      ctx.clearRect(0, 0, SIZE, SIZE);

      // Outer ambient ring
      const points = 64;
      const baseR = 72 + (isSpeaking ? 4 * al : isListening ? 2 * al : 0);

      if (isListening || isSpeaking) {
        // Draw animated waveform ring
        const color = isSpeaking ? '62,207,142' : '79,142,247';
        ctx.beginPath();
        for (let i = 0; i <= points; i++) {
          const angle = (i / points) * Math.PI * 2;
          const noise = isSpeaking
            ? Math.sin(angle * 5 + t * 2.2) * (8 + al * 16) + Math.cos(angle * 3 + t * 1.5) * (4 + al * 10)
            : Math.sin(angle * 4 + t * 1.4) * (3 + al * 8) + Math.cos(angle * 7 + t * 0.9) * (2 + al * 4);
          const r = baseR + noise;
          const x = cx + Math.cos(angle) * r;
          const y = cy + Math.sin(angle) * r;
          i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
        }
        ctx.closePath();
        ctx.strokeStyle = `rgba(${color},${isSpeaking ? 0.5 + al * 0.35 : 0.3 + al * 0.2})`;
        ctx.lineWidth = isSpeaking ? 2.5 : 1.5;
        ctx.stroke();

        // Second inner ring
        ctx.beginPath();
        for (let i = 0; i <= points; i++) {
          const angle = (i / points) * Math.PI * 2;
          const noise2 = Math.sin(angle * 6 - t * 1.8) * (2 + al * 6) + Math.cos(angle * 2 - t * 2.4) * (1 + al * 3);
          const r = baseR - 12 + noise2;
          const x = cx + Math.cos(angle) * r;
          const y = cy + Math.sin(angle) * r;
          i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
        }
        ctx.closePath();
        ctx.strokeStyle = `rgba(${color},${0.15 + al * 0.15})`;
        ctx.lineWidth = 1;
        ctx.stroke();

        // Ambient glow gradient
        const grad = ctx.createRadialGradient(cx, cy, baseR - 10, cx, cy, baseR + 30);
        grad.addColorStop(0, `rgba(${color},${0.12 + al * 0.1})`);
        grad.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.beginPath();
        ctx.arc(cx, cy, baseR + 30, 0, Math.PI * 2);
        ctx.fillStyle = grad;
        ctx.fill();
      } else {
        // Subtle idle dashed orbit
        ctx.beginPath();
        ctx.arc(cx, cy, baseR, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(100,116,139,0.18)';
        ctx.lineWidth = 1;
        ctx.setLineDash([4, 8]);
        ctx.stroke();
        ctx.setLineDash([]);
      }

      // Orbiting dot(s)
      if (isListening || isSpeaking) {
        const color = isSpeaking ? '62,207,142' : '79,142,247';
        const orbitR = baseR + 4;
        for (let d = 0; d < (isSpeaking ? 2 : 1); d++) {
          const orbitAngle = t * (isSpeaking ? 1.8 : 1.2) + d * Math.PI;
          const dx = cx + Math.cos(orbitAngle) * orbitR;
          const dy = cy + Math.sin(orbitAngle) * orbitR;
          ctx.beginPath();
          ctx.arc(dx, dy, isSpeaking ? 3.5 : 2.5, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(${color},0.85)`;
          ctx.fill();
        }
      }

      frameRef.current = requestAnimationFrame(draw);
    };

    frameRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(frameRef.current);
  }, [isListening, isSpeaking, audioLevel]);

  const scale = isSpeaking ? 1.12 + (audioLevel / 400) : isListening ? 1.04 + (audioLevel / 600) : 0.97;

  return (
    <div style={{ position: 'relative', width: '140px', height: '140px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      {/* Canvas animated rings */}
      <canvas
        ref={canvasRef}
        style={{
          position: 'absolute',
          inset: '-15px',
          width: '170px',
          height: '170px',
          pointerEvents: 'none',
        }}
      />

      {/* Core sphere */}
      <div style={{
        width: '80px',
        height: '80px',
        borderRadius: '50%',
        background: coreGrad,
        boxShadow: `0 0 ${isSpeaking ? 40 + audioLevel / 3 : isListening ? 28 + audioLevel / 5 : 12}px ${glowColor}55,
                    0 0 ${isSpeaking ? 80 + audioLevel / 2 : isListening ? 50 : 20}px ${glowColor}18,
                    inset 0 -10px 20px rgba(0,0,0,0.5),
                    inset 0 8px 16px rgba(255,255,255,0.18)`,
        transform: `scale(${scale})`,
        transition: 'transform 0.1s cubic-bezier(0.34, 1.56, 0.64, 1), background 0.4s ease, box-shadow 0.3s ease',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'default',
        position: 'relative',
        zIndex: 2,
      }}>
        {/* Specular highlight */}
        <div style={{
          position: 'absolute',
          top: '14px',
          left: '18px',
          width: '22px',
          height: '14px',
          borderRadius: '50%',
          background: 'rgba(255,255,255,0.25)',
          filter: 'blur(3px)',
          transform: 'rotate(-20deg)',
        }} />

        {/* Glyph */}
        <span style={{
          fontSize: '20px',
          fontWeight: '800',
          color: 'rgba(255,255,255,0.92)',
          textShadow: `0 0 12px ${glowColor}`,
          letterSpacing: '-0.02em',
          position: 'relative',
          zIndex: 1,
          transition: 'all 0.3s',
          userSelect: 'none',
        }}>
          {isSpeaking ? '▲' : isListening ? 'Ψ' : '■'}
        </span>
      </div>

      {/* Ping on speech */}
      {isSpeaking && (
        <div style={{
          position: 'absolute',
          inset: '-8px',
          borderRadius: '50%',
          border: `2px solid ${glowColor}60`,
          animation: 'ping 1.2s cubic-bezier(0, 0, 0.2, 1) infinite',
          pointerEvents: 'none',
        }} />
      )}
    </div>
  );
}

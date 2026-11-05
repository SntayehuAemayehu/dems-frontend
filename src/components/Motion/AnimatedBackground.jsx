// frontend/src/components/Motion/AnimatedBackground.jsx
import React, { useRef, useEffect } from 'react';

/**
 * Canvas-based animated background: floating particles, connected lines,
 * and a slow parallax mouse drift. Pure canvas = GPU-friendly, zero deps.
 */
const AnimatedBackground = ({ dark = false, density = 70, showLines = true }) => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let raf;
    let particles = [];
    let mouse = { x: -1000, y: -1000 };
    let w = 0, h = 0;
    const DPR = Math.min(window.devicePixelRatio || 1, 2);

    const resize = () => {
      w = canvas.clientWidth;
      h = canvas.clientHeight;
      canvas.width = w * DPR;
      canvas.height = h * DPR;
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
      const count = Math.min(density, Math.floor((w * h) / 14000));
      particles = Array.from({ length: count }, () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.4,
        vy: (Math.random() - 0.5) * 0.4,
        r: Math.random() * 2 + 1,
      }));
    };

    const tick = () => {
      ctx.clearRect(0, 0, w, h);

      // gradient wash
      const g = ctx.createLinearGradient(0, 0, w, h);
      if (dark) {
        g.addColorStop(0, 'rgba(15,23,42,0.4)');
        g.addColorStop(1, 'rgba(3,7,18,0.6)');
      } else {
        g.addColorStop(0, 'rgba(238,242,255,0.4)');
        g.addColorStop(1, 'rgba(224,242,254,0.4)');
      }
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);

      // particles
      for (const p of particles) {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0 || p.x > w) p.vx *= -1;
        if (p.y < 0 || p.y > h) p.vy *= -1;

        const dx = p.x - mouse.x, dy = p.y - mouse.y;
        const d2 = dx * dx + dy * dy;
        if (d2 < 22000) {
          p.x += dx * 0.002;
          p.y += dy * 0.002;
        }

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = dark ? 'rgba(129,140,248,0.6)' : 'rgba(79,70,229,0.5)';
        ctx.fill();
      }

      if (showLines) {
        for (let i = 0; i < particles.length; i++) {
          for (let j = i + 1; j < particles.length; j++) {
            const a = particles[i], b = particles[j];
            const dx = a.x - b.x, dy = a.y - b.y;
            const d = Math.sqrt(dx * dx + dy * dy);
            if (d < 130) {
              ctx.beginPath();
              ctx.strokeStyle = dark
                ? `rgba(129,140,248,${0.12 * (1 - d / 130)})`
                : `rgba(79,70,229,${0.1  * (1 - d / 130)})`;
              ctx.lineWidth = 1;
              ctx.moveTo(a.x, a.y);
              ctx.lineTo(b.x, b.y);
              ctx.stroke();
            }
          }
        }
      }
      raf = requestAnimationFrame(tick);
    };

    const onMove = (e) => { mouse.x = e.clientX; mouse.y = e.clientY; };
    resize();
    window.addEventListener('resize', resize);
    window.addEventListener('mousemove', onMove);
    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', onMove);
    };
  }, [dark, density, showLines]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed', inset: 0, width: '100%', height: '100%',
        zIndex: -1, pointerEvents: 'none',
      }}
      aria-hidden="true"
    />
  );
};

export default AnimatedBackground;
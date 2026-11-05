// frontend/src/components/Motion/MotionPrimitives.jsx
import React, { useRef, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useSpring, animated, config } from '@react-spring/web';

/* ============================================================
   FadeIn — plays every time the element enters the viewport
   ============================================================ */
export const FadeIn = ({ children, delay = 0, y = 24, className = '' }) => (
  <motion.div
    className={className}
    initial={{ opacity: 0, y }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, amount: 0.15 }}
    transition={{ duration: 0.6, delay, ease: [0.4, 0, 0.2, 1] }}
  >
    {children}
  </motion.div>
);

/* ============================================================
   Stagger — wraps a list and staggers children
   ============================================================ */
export const Stagger = ({ children, stagger = 0.08, className = '' }) => (
  <motion.div
    className={className}
    initial="hidden"
    whileInView="show"
    viewport={{ once: true, amount: 0.1 }}
    variants={{
      hidden: {},
      show: { transition: { staggerChildren: stagger } },
    }}
  >
    {children}
  </motion.div>
);

export const StaggerItem = ({ children, className = '' }) => (
  <motion.div
    className={className}
    variants={{
      hidden: { opacity: 0, y: 20 },
      show:   { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.4,0,0.2,1] } },
    }}
  >
    {children}
  </motion.div>
);

/* ============================================================
   3D Tilt card — pointer-based parallax
   ============================================================ */
export const TiltCard = ({ children, className = '', intensity = 12, glare = true }) => {
  const ref = useRef(null);
  const [{ rx, ry, gx, gy }, api] = useSpring(() => ({
    rx: 0, ry: 0, gx: 50, gy: 50, config: { mass: 1, tension: 280, friction: 24 },
  }));

  const handleMove = (e) => {
    const el = ref.current; if (!el) return;
    const r = el.getBoundingClientRect();
    const x = e.clientX - r.left;
    const y = e.clientY - r.top;
    api.start({
      rx: -((y - r.height / 2) / r.height) * intensity,
      ry:  ((x - r.width  / 2) / r.width ) * intensity,
      gx: (x / r.width) * 100,
      gy: (y / r.height) * 100,
    });
  };
  const handleLeave = () => api.start({ rx: 0, ry: 0, gx: 50, gy: 50 });

  return (
    <animated.div
      ref={ref}
      onMouseMove={handleMove}
      onMouseLeave={handleLeave}
      className={className}
      style={{
        transformStyle: 'preserve-3d',
        transform: rx.to((v) => `perspective(1000px) rotateX(${v}deg) rotateY(${ry.get()}deg)`),
        position: 'relative',
      }}
    >
      {children}
      {glare && (
        <animated.div
          style={{
            position: 'absolute', inset: 0, borderRadius: 'inherit',
            pointerEvents: 'none',
            background: gx.to(
              (x) => `radial-gradient(400px circle at ${x}% ${gy.get()}%, rgba(255,255,255,.18), transparent 40%)`
            ),
          }}
        />
      )}
    </animated.div>
  );
};

/* ============================================================
   NumberTicker — animated count up
   ============================================================ */
export const NumberTicker = ({ value = 0, duration = 1200, className = '', prefix = '', suffix = '' }) => {
  const [display, setDisplay] = useState(0);
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    const start = performance.now();
    const from = 0;
    const to = Number(value) || 0;
    const raf = (t) => {
      const p = Math.min((t - start) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      setDisplay(from + (to - from) * eased);
      if (p < 1) requestAnimationFrame(raf);
    };
    requestAnimationFrame(raf);
  }, [value, duration]);

  const shown = Number.isInteger(value) ? Math.round(display) : display.toFixed(1);
  return <span className={className}>{prefix}{shown.toLocaleString()}{suffix}</span>;
};

/* ============================================================
   PageTransition — used as a wrapper on routed pages
   ============================================================ */
export const PageTransition = ({ children }) => (
  <motion.div
    initial={{ opacity: 0, y: 16 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -16 }}
    transition={{ duration: 0.45, ease: [0.4, 0, 0.2, 1] }}
  >
    {children}
  </motion.div>
);

/* ============================================================
   RevealOnScroll — IntersectionObserver + class
   ============================================================ */
export const RevealOnScroll = ({ children, className = '', delay = 0 }) => {
  const ref = useRef(null);
  const [seen, setSeen] = useState(false);

  useEffect(() => {
    const el = ref.current; if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setSeen(true); io.disconnect(); } },
      { threshold: 0.12 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={`dems-reveal ${seen ? 'in' : ''} ${className}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
};
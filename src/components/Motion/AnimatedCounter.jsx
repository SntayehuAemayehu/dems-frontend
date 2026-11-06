import React, { useEffect, useState } from 'react';
import { motion, useAnimation } from 'motion/react';

export function AnimatedCounter({ value, label, icon, color = 'blue' }) {
  const controls = useAnimation();
  const [prevValue, setPrevValue] = useState(value);

  useEffect(() => {
    if (prevValue !== value && value !== undefined) {
      // Trigger the "pop" animation when the value changes
      controls.start({
        scale: [1, 1.3, 1],
        color: ['#000', '#2563eb', '#000'],
        transition: { duration: 0.5, ease: "easeInOut" }
      });
      setPrevValue(value);
    }
  }, [value, prevValue, controls]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className={`p-6 rounded-2xl bg-white shadow-lg border border-gray-100 flex items-center gap-4 hover:shadow-xl transition-shadow`}
    >
      <div className={`text-4xl p-3 rounded-xl bg-${color}-50 text-${color}-600`}>
        {icon}
      </div>
      <div>
        <p className="text-sm text-gray-500 font-medium uppercase tracking-wide">{label}</p>
        <motion.p
          animate={controls}
          className="text-3xl font-bold text-gray-800"
        >
          {value !== undefined && value !== null ? value.toLocaleString() : '—'}
        </motion.p>
      </div>
    </motion.div>
  );
}
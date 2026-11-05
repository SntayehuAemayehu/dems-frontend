// frontend/src/components/Motion/SmartStatCard.jsx
import React, { useState } from 'react';
import { TiltCard, NumberTicker } from './MotionPrimitives';

const SmartStatCard = ({
  icon: Icon, label, value, suffix = '', trend, color = '#4f46e5', onClick,
}) => {
  const [hover, setHover] = useState(false);
  const up = (trend || 0) >= 0;

  return (
    <TiltCard>
      <div
        onClick={onClick}
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
        style={{
          background: 'var(--dems-surface)',
          borderRadius: '20px',
          padding: '22px',
          border: `1px solid var(--dems-border)`,
          boxShadow: hover ? '0 20px 40px -20px rgba(79,70,229,.4)' : 'var(--dems-shadow-sm)',
          transition: 'box-shadow .4s ease, border-color .4s ease',
          cursor: onClick ? 'pointer' : 'default',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* animated accent orb */}
        <div
          style={{
            position: 'absolute', top: '-40px', right: '-40px',
            width: '140px', height: '140px', borderRadius: '50%',
            background: `radial-gradient(circle, ${color}30 0%, transparent 70%)`,
            transform: hover ? 'scale(1.4)' : 'scale(1)',
            transition: 'transform .6s ease',
          }}
        />

        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div
            style={{
              width: 52, height: 52, borderRadius: 14,
              background: `linear-gradient(135deg, ${color}, ${color}cc)`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'white',
              boxShadow: `0 8px 20px -6px ${color}80`,
              transform: hover ? 'rotate(-8deg) scale(1.06)' : 'none',
              transition: 'transform .5s cubic-bezier(.34,1.56,.64,1)',
            }}
          >
            {Icon && <Icon size={24} />}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, color: 'var(--dems-muted)', fontWeight: 500 }}>
              {label}
            </div>
            <div style={{
              fontSize: 30, fontWeight: 800, color: 'var(--dems-text)',
              lineHeight: 1.15, letterSpacing: '-0.5px',
            }}>
              <NumberTicker value={value} />{suffix}
            </div>
          </div>
        </div>

        {trend !== undefined && (
          <div
            style={{
              marginTop: 14,
              display: 'inline-flex', alignItems: 'center', gap: 6,
              padding: '4px 10px', borderRadius: 20,
              background: up ? '#dcfce7' : '#fee2e2',
              color: up ? '#16a34a' : '#dc2626',
              fontSize: 12, fontWeight: 600,
            }}
          >
            {up ? '▲' : '▼'} {Math.abs(trend)}% this month
          </div>
        )}
      </div>
    </TiltCard>
  );
};

export default SmartStatCard;
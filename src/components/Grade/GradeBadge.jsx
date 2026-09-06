// src/components/Grade/GradeBadge.jsx
// COMPLETE GRADE BADGE COMPONENT

import React from 'react';

const GradeBadge = ({ grade, percentage, size = 'md' }) => {
    if (!grade || grade === 'NON') {
        return (
            <span style={{
                display: 'inline-flex',
                padding: size === 'sm' ? '2px 8px' : '4px 12px',
                borderRadius: '4px',
                fontSize: size === 'sm' ? '11px' : '14px',
                fontWeight: 600,
                background: '#f3f4f6',
                color: '#6b7280',
            }}>
                NON
            </span>
        );
    }

    const gradeColors = {
        'A+': { bg: '#dcfce7', color: '#166534' },
        'A': { bg: '#dcfce7', color: '#166534' },
        'A-': { bg: '#dcfce7', color: '#166534' },
        'B+': { bg: '#dbeafe', color: '#1e40af' },
        'B': { bg: '#dbeafe', color: '#1e40af' },
        'B-': { bg: '#dbeafe', color: '#1e40af' },
        'C+': { bg: '#fef3c7', color: '#92400e' },
        'C': { bg: '#fef3c7', color: '#92400e' },
        'C-': { bg: '#fef3c7', color: '#92400e' },
        'D+': { bg: '#fef3c7', color: '#92400e' },
        'D': { bg: '#fef3c7', color: '#92400e' },
        'F': { bg: '#fee2e2', color: '#991b1b' },
    };

    const colors = gradeColors[grade] || gradeColors['F'];

    return (
        <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
            padding: size === 'sm' ? '2px 8px' : '4px 12px',
            borderRadius: '4px',
            fontSize: size === 'sm' ? '11px' : '14px',
            fontWeight: 600,
            background: colors.bg,
            color: colors.color,
        }}>
            {grade}
            {percentage !== undefined && percentage !== null && (
                <span style={{
                    fontSize: size === 'sm' ? '9px' : '11px',
                    opacity: 0.7,
                    fontWeight: 400,
                }}>
                    ({percentage.toFixed(1)}%)
                </span>
            )}
        </span>
    );
};

export default GradeBadge;
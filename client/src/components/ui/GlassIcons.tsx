import React from 'react';

interface GlassIconItem {
    icon: React.ReactNode;
    color: string;
    label: string;
    onClick?: () => void;
}

interface GlassIconsProps {
    items: GlassIconItem[];
    className?: string;
    colorful?: boolean;
}

const colorMap: Record<string, { bg: string; border: string; text: string; glow: string }> = {
    blue: {
        bg: 'rgba(59, 130, 246, 0.15)',
        border: 'rgba(59, 130, 246, 0.3)',
        text: '#3b82f6',
        glow: '0 0 20px rgba(59, 130, 246, 0.4)',
    },
    purple: {
        bg: 'rgba(139, 92, 246, 0.15)',
        border: 'rgba(139, 92, 246, 0.3)',
        text: '#8b5cf6',
        glow: '0 0 20px rgba(139, 92, 246, 0.4)',
    },
    red: {
        bg: 'rgba(239, 68, 68, 0.15)',
        border: 'rgba(239, 68, 68, 0.3)',
        text: '#ef4444',
        glow: '0 0 20px rgba(239, 68, 68, 0.4)',
    },
    indigo: {
        bg: 'rgba(99, 102, 241, 0.15)',
        border: 'rgba(99, 102, 241, 0.3)',
        text: '#6366f1',
        glow: '0 0 20px rgba(99, 102, 241, 0.4)',
    },
    orange: {
        bg: 'rgba(249, 115, 22, 0.15)',
        border: 'rgba(249, 115, 22, 0.3)',
        text: '#f97316',
        glow: '0 0 20px rgba(249, 115, 22, 0.4)',
    },
    green: {
        bg: 'rgba(34, 197, 94, 0.15)',
        border: 'rgba(34, 197, 94, 0.3)',
        text: '#22c55e',
        glow: '0 0 20px rgba(34, 197, 94, 0.4)',
    },
    pink: {
        bg: 'rgba(236, 72, 153, 0.15)',
        border: 'rgba(236, 72, 153, 0.3)',
        text: '#ec4899',
        glow: '0 0 20px rgba(236, 72, 153, 0.4)',
    },
    amber: {
        bg: 'rgba(245, 158, 11, 0.15)',
        border: 'rgba(245, 158, 11, 0.3)',
        text: '#f59e0b',
        glow: '0 0 20px rgba(245, 158, 11, 0.4)',
    },
};

const defaultColor = {
    bg: 'rgba(255, 255, 255, 0.1)',
    border: 'rgba(255, 255, 255, 0.2)',
    text: '#ffffff',
    glow: '0 0 20px rgba(255, 255, 255, 0.2)',
};

export default function GlassIcons({ items, className = '', colorful = true }: GlassIconsProps) {
    return (
        <div className={`grid grid-cols-3 gap-4 p-4 ${className}`}>
            {items.map((item, index) => {
                const colors = colorful ? (colorMap[item.color] || defaultColor) : defaultColor;

                return (
                    <button
                        key={index}
                        onClick={item.onClick}
                        className="group relative flex flex-col items-center justify-center p-6 rounded-2xl transition-all duration-300 hover:scale-105 active:scale-95"
                        style={{
                            background: colorful ? colors.bg : 'rgba(255, 255, 255, 0.08)',
                            backdropFilter: 'blur(12px)',
                            WebkitBackdropFilter: 'blur(12px)',
                            border: `1px solid ${colorful ? colors.border : 'rgba(255, 255, 255, 0.15)'}`,
                            boxShadow: `
                0 4px 30px rgba(0, 0, 0, 0.1),
                inset 0 1px 0 rgba(255, 255, 255, 0.1)
              `,
                        }}
                        onMouseEnter={(e) => {
                            if (colorful) {
                                e.currentTarget.style.boxShadow = `
                  ${colors.glow},
                  0 4px 30px rgba(0, 0, 0, 0.1),
                  inset 0 1px 0 rgba(255, 255, 255, 0.1)
                `;
                            }
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.boxShadow = `
                0 4px 30px rgba(0, 0, 0, 0.1),
                inset 0 1px 0 rgba(255, 255, 255, 0.1)
              `;
                        }}
                    >
                        {/* Icon */}
                        <div
                            className="text-3xl mb-2 transition-transform duration-300 group-hover:scale-110"
                            style={{ color: colorful ? colors.text : 'rgba(255, 255, 255, 0.9)' }}
                        >
                            {item.icon}
                        </div>

                        {/* Label */}
                        <span
                            className="text-sm font-medium transition-opacity duration-300"
                            style={{ color: colorful ? colors.text : 'rgba(255, 255, 255, 0.7)' }}
                        >
                            {item.label}
                        </span>

                        {/* Shine effect */}
                        <div
                            className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
                            style={{
                                background: 'linear-gradient(135deg, rgba(255,255,255,0.2) 0%, transparent 50%, transparent 100%)',
                            }}
                        />
                    </button>
                );
            })}
        </div>
    );
}

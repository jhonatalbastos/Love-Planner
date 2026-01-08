import React from 'react';

interface CardProps {
    children: React.ReactNode;
    className?: string;
    onClick?: () => void;
    hoverEffect?: boolean;
}

export const Card: React.FC<CardProps> = ({ children, className = '', onClick, hoverEffect = false }) => {
    return (
        <div
            onClick={onClick}
            className={`
        bg-white dark:bg-card-dark rounded-2xl shadow-sm border border-gray-100 dark:border-white/5 
        ${hoverEffect ? 'hover:shadow-md hover:border-primary/20 cursor-pointer transition-all active:scale-[0.98]' : ''}
        ${className}
      `}
        >
            {children}
        </div>
    );
};

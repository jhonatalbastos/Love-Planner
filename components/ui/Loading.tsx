import React from 'react';

interface LoadingProps {
    fullScreen?: boolean;
    message?: string;
    className?: string;
}

export const Loading: React.FC<LoadingProps> = ({ fullScreen = false, message, className = '' }) => {
    const content = (
        <div className={`flex flex-col items-center justify-center gap-4 ${className}`}>
            <div className="relative size-12">
                <span className="absolute inset-0 border-4 border-primary/20 rounded-full"></span>
                <span className="absolute inset-0 border-4 border-primary border-t-transparent rounded-full animate-spin"></span>
            </div>
            {message && (
                <p className="text-sm font-bold text-primary animate-pulse">{message}</p>
            )}
        </div>
    );

    if (fullScreen) {
        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/80 dark:bg-black/80 backdrop-blur-sm animate-[fadeIn_0.2s]">
                {content}
            </div>
        );
    }

    return content;
};

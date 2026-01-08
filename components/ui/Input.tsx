import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    error?: string;
    leftIcon?: React.ReactNode;
    rightIcon?: React.ReactNode;
    containerClassName?: string;
}

export const Input: React.FC<InputProps> = ({
    label,
    error,
    leftIcon,
    rightIcon,
    className = '',
    containerClassName = '',
    id,
    ...props
}) => {
    const inputId = id || props.name || Math.random().toString(36).substr(2, 9);

    return (
        <div className={`flex flex-col gap-1.5 ${containerClassName}`}>
            {label && (
                <label htmlFor={inputId} className="text-xs font-bold text-text-muted uppercase tracking-wider ml-1">
                    {label}
                </label>
            )}

            <div className="relative group">
                {leftIcon && (
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary transition-colors pointer-events-none">
                        {leftIcon}
                    </div>
                )}

                <input
                    id={inputId}
                    className={`
            w-full bg-gray-50 dark:bg-white/5 border border-transparent 
            focus:border-primary focus:bg-white dark:focus:bg-black/20 
            outline-none rounded-xl text-text-main dark:text-text-light 
            transition-all placeholder:text-gray-400
            ${leftIcon ? 'pl-10' : 'pl-4'}
            ${rightIcon ? 'pr-10' : 'pr-4'}
            ${props.disabled ? 'opacity-60 cursor-not-allowed' : ''}
            ${error ? 'border-red-400 focus:border-red-500 bg-red-50/50' : ''}
            p-3
            ${className}
          `}
                    {...props}
                />

                {rightIcon && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                        {rightIcon}
                    </div>
                )}
            </div>

            {error && (
                <span className="text-xs text-red-500 ml-1 font-medium animate-[fadeIn_0.2s]">{error}</span>
            )}
        </div>
    );
};

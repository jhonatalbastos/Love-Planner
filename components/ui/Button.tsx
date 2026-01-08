import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline';
    size?: 'sm' | 'md' | 'lg' | 'icon';
    isLoading?: boolean;
    leftIcon?: React.ReactNode;
    rightIcon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
    children,
    className = '',
    variant = 'primary',
    size = 'md',
    isLoading = false,
    leftIcon,
    rightIcon,
    disabled,
    ...props
}) => {
    const baseStyles = "inline-flex items-center justify-center font-bold rounded-xl transition-all active:scale-95 disabled:opacity-50 disabled:pointer-events-none focus:outline-none focus:ring-2 focus:ring-primary/20";

    const variants = {
        primary: "bg-primary text-white shadow-lg shadow-primary/30 hover:bg-primary-hover",
        secondary: "bg-white dark:bg-card-dark text-text-main dark:text-text-light border border-gray-100 dark:border-white/10 shadow-sm hover:border-primary/30",
        ghost: "bg-transparent hover:bg-black/5 dark:hover:bg-white/5 text-text-main dark:text-text-light",
        danger: "bg-red-50 text-red-500 hover:bg-red-100 dark:bg-red-900/20 dark:hover:bg-red-900/30",
        outline: "bg-transparent border-2 border-primary text-primary hover:bg-primary/5"
    };

    const sizes = {
        sm: "text-xs px-3 py-1.5 gap-1.5",
        md: "text-sm px-4 py-3 gap-2",
        lg: "text-base px-6 py-4 gap-3",
        icon: "p-2 aspect-square"
    };

    return (
        <button
            className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
            disabled={disabled || isLoading}
            {...props}
        >
            {isLoading ? (
                <span className="animate-spin material-symbols-rounded text-[1.2em]">progress_activity</span>
            ) : (
                <>
                    {leftIcon}
                    {children}
                    {rightIcon}
                </>
            )}
        </button>
    );
};

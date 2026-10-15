'use client';

import React from 'react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  className = '',
  disabled,
  ...props
}) => {
  const baseStyle =
    'inline-flex items-center justify-center font-semibold rounded-lg transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer';

  const variants = {
    primary:
      'bg-[#2F7D4F] text-white hover:bg-[#25663f] focus:ring-[#2F7D4F] shadow-sm hover:shadow',
    secondary:
      'bg-[#7A5A3A] text-white hover:bg-[#63482e] focus:ring-[#7A5A3A] shadow-sm',
    outline:
      'border border-[#2F7D4F] text-[#2F7D4F] bg-white hover:bg-[#E4F1E8] focus:ring-[#2F7D4F]',
    danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-600 shadow-sm',
    ghost: 'text-stone-700 hover:bg-stone-200/60 focus:ring-stone-400',
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-xs min-h-[36px]',
    md: 'px-4 py-2.5 text-sm min-h-[44px]',
    lg: 'px-6 py-3.5 text-base min-h-[50px]',
  };

  return (
    <button
      className={`${baseStyle} ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <span className="inline-flex items-center gap-2">
          <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></span>
          <span>Loading...</span>
        </span>
      ) : (
        children
      )}
    </button>
  );
};

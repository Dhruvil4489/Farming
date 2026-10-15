import React from 'react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  whyAsk?: string;
  rightElement?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helperText, whyAsk, rightElement, className = '', id, ...props }, ref) => {
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);
    const [showWhy, setShowWhy] = React.useState(false);

    return (
      <div className="w-full space-y-1.5">
        {label && (
          <div className="flex items-center justify-between">
            <label htmlFor={inputId} className="block text-sm font-semibold text-stone-800">
              {label}
            </label>
            {whyAsk && (
              <button
                type="button"
                onClick={() => setShowWhy(!showWhy)}
                className="text-xs text-[#2F7D4F] hover:underline font-medium focus:outline-none cursor-pointer"
              >
                Why we ask
              </button>
            )}
          </div>
        )}

        {showWhy && whyAsk && (
          <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-900 leading-relaxed mb-1">
            {whyAsk}
          </div>
        )}

        <div className="relative flex items-center">
          <input
            id={inputId}
            ref={ref}
            className={`w-full px-3.5 py-2.5 bg-white border ${
              error ? 'border-red-500 focus:ring-red-500' : 'border-stone-300 focus:ring-[#2F7D4F]'
            } rounded-xl text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-2 focus:border-transparent text-sm transition-all min-h-[46px] ${
              rightElement ? 'pr-11' : ''
            } ${className}`}
            {...props}
          />
          {rightElement && (
            <div className="absolute right-3 flex items-center justify-center text-stone-500 pointer-events-auto">
              {rightElement}
            </div>
          )}
        </div>

        {error && <p className="text-xs font-medium text-red-600 mt-1">{error}</p>}
        {!error && helperText && <p className="text-xs text-stone-500 mt-1">{helperText}</p>}
      </div>
    );
  }
);

Input.displayName = 'Input';

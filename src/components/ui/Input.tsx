import React from 'react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  whyAsk?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helperText, whyAsk, className = '', id, ...props }, ref) => {
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);
    const [showWhy, setShowWhy] = React.useState(false);

    return (
      <div className="w-full space-y-1">
        {label && (
          <div className="flex items-center justify-between">
            <label htmlFor={inputId} className="block text-sm font-semibold text-stone-800">
              {label}
            </label>
            {whyAsk && (
              <button
                type="button"
                onClick={() => setShowWhy(!showWhy)}
                className="text-xs text-[#2F7D4F] hover:underline font-medium focus:outline-none"
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

        <input
          id={inputId}
          ref={ref}
          className={`w-full px-3.5 py-2.5 bg-white border ${
            error ? 'border-red-500 focus:ring-red-500' : 'border-stone-300 focus:ring-[#2F7D4F]'
          } rounded-lg text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-2 focus:border-transparent text-sm transition-all min-h-[44px] ${className}`}
          {...props}
        />

        {error && <p className="text-xs font-medium text-red-600 mt-1">{error}</p>}
        {!error && helperText && <p className="text-xs text-stone-500 mt-1">{helperText}</p>}
      </div>
    );
  }
);

Input.displayName = 'Input';

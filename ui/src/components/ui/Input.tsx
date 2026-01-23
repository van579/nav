
import React from 'react';
import { cn } from './Button'; // Reuse cn utility

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    error?: string;
    textarea?: boolean;
    rows?: number;
}

export const Input = React.forwardRef<HTMLInputElement | HTMLTextAreaElement, InputProps & { textarea?: boolean }>(
    ({ className, label, error, textarea, ...props }, ref) => {
        const Comp = textarea ? 'textarea' : 'input';
        return (
            <div className="w-full">
                {label && (
                    <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                        {label}
                    </label>
                )}
                {/* @ts-ignore */}
                <Comp
                    ref={ref as any}
                    className={cn(
                        'flex w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:focus:ring-offset-gray-900',
                        textarea ? 'min-h-[80px]' : 'h-10',
                        error && 'border-red-500 focus:ring-red-500',
                        className
                    )}
                    {...props}
                />
                {error && <p className="mt-1 text-sm text-red-500">{error}</p>}
            </div>
        );
    }
);

import React, { createContext, useContext, useState, useCallback, Fragment } from 'react';
import { Transition } from '@headlessui/react';
import { CheckCircleIcon, ExclamationCircleIcon, XMarkIcon, InformationCircleIcon } from '@heroicons/react/24/outline';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

interface Toast {
    id: string;
    message: string;
    type: ToastType;
}

interface ToastContextType {
    toast: (message: string, type?: ToastType) => void;
    success: (message: string) => void;
    error: (message: string) => void;
    info: (message: string) => void;
    warning: (message: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const useToast = () => {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error('useToast must be used within a ToastProvider');
    }
    return context;
};

export const ToastProvider = ({ children }: { children: React.ReactNode }) => {
    const [toasts, setToasts] = useState<Toast[]>([]);

    const removeToast = useCallback((id: string) => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
    }, []);

    const toast = useCallback((message: string, type: ToastType = 'info') => {
        const id = Date.now().toString() + Math.random().toString();
        setToasts((prev) => [...prev, { id, message, type }]);
        setTimeout(() => removeToast(id), 3000);
    }, [removeToast]);

    const success = useCallback((msg: string) => toast(msg, 'success'), [toast]);
    const error = useCallback((msg: string) => toast(msg, 'error'), [toast]);
    const info = useCallback((msg: string) => toast(msg, 'info'), [toast]);
    const warning = useCallback((msg: string) => toast(msg, 'warning'), [toast]);

    return (
        <ToastContext.Provider value={{ toast, success, error, info, warning }}>
            {children}
            <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2 w-full max-w-sm pointer-events-none">
                {toasts.map((t) => (
                    <ToastItem key={t.id} toast={t} onClose={() => removeToast(t.id)} />
                ))}
            </div>
        </ToastContext.Provider>
    );
};

const ToastItem = ({ toast, onClose }: { toast: Toast; onClose: () => void }) => {
    const icons = {
        success: <CheckCircleIcon className="h-6 w-6 text-green-500" />,
        error: <ExclamationCircleIcon className="h-6 w-6 text-red-500" />,
        warning: <ExclamationCircleIcon className="h-6 w-6 text-yellow-500" />,
        info: <InformationCircleIcon className="h-6 w-6 text-blue-500" />,
    };

    return (
        <Transition
            show={true}
            appear={true}
            as={Fragment}
            enter="transform ease-out duration-300 transition"
            enterFrom="translate-y-2 opacity-0 sm:translate-y-0 sm:translate-x-2"
            enterTo="translate-y-0 opacity-100 sm:translate-x-0"
            leave="transition ease-in duration-100"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
        >
            <div className="pointer-events-auto w-full max-w-sm overflow-hidden rounded-lg bg-white shadow-lg ring-1 ring-black ring-opacity-5 dark:bg-gray-800 dark:ring-white dark:ring-opacity-10">
                <div className="p-4">
                    <div className="flex items-start">
                        <div className="flex-shrink-0">{icons[toast.type]}</div>
                        <div className="ml-3 w-0 flex-1 pt-0.5">
                            <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{toast.message}</p>
                        </div>
                        <div className="ml-4 flex flex-shrink-0">
                            <button
                                type="button"
                                className="inline-flex rounded-md bg-white text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:bg-gray-800 dark:text-gray-500 dark:hover:text-gray-400"
                                onClick={onClose}
                            >
                                <span className="sr-only">Close</span>
                                <XMarkIcon className="h-5 w-5" aria-hidden="true" />
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </Transition>
    );
};

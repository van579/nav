
import React, { Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { XMarkIcon } from '@heroicons/react/24/outline'; // Need heroicons installed

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title?: React.ReactNode;
    children: React.ReactNode;
    footer?: React.ReactNode;
    panelClassName?: string;
}

export function Modal({ isOpen, onClose, title, children, footer, panelClassName }: ModalProps) {
    return (
        <Transition appear show={isOpen} as={Fragment}>
            <Dialog as="div" className="relative z-50" onClose={onClose}>
                <Transition.Child
                    as={Fragment}
                    enter="ease-out duration-300"
                    enterFrom="opacity-0"
                    enterTo="opacity-100"
                    leave="ease-in duration-200"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                >
                    <div className="fixed inset-0 bg-black/25 backdrop-blur-sm" />
                </Transition.Child>

                <div className="fixed inset-0 overflow-y-auto">
                    <div className="flex min-h-full items-center justify-center p-4 text-center">
                        <Transition.Child
                            as={Fragment}
                            enter="ease-out duration-300"
                            enterFrom="opacity-0 scale-95"
                            enterTo="opacity-100 scale-100"
                            leave="ease-in duration-200"
                            leaveFrom="opacity-100 scale-100"
                            leaveTo="opacity-0 scale-95"
                        >
                            <Dialog.Panel className={`w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all dark:bg-gray-800 ${panelClassName || ''}`}>
                                <div className="flex items-center justify-between mb-4">
                                    {title && (
                                        <Dialog.Title
                                            as="h3"
                                            className="text-lg font-medium leading-6 text-gray-900 dark:text-white"
                                        >
                                            {title}
                                        </Dialog.Title>
                                    )}
                                    <button
                                        onClick={onClose}
                                        className="rounded-full p-1 hover:bg-gray-100 dark:hover:bg-gray-700"
                                    >
                                        <XMarkIcon className="h-5 w-5 text-gray-500" />
                                    </button>
                                </div>

                                <div className="mt-2 text-sm text-gray-500 dark:text-gray-300">
                                    {children}
                                </div>

                                {footer && <div className="mt-6 flex justify-end gap-3">{footer}</div>}
                            </Dialog.Panel>
                        </Transition.Child>
                    </div>
                </div>
            </Dialog>
        </Transition>
    );
}

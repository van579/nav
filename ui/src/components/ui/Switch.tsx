
import { Switch as HeadlessSwitch } from '@headlessui/react';
import { clsx } from 'clsx';

interface SwitchProps {
    checked: boolean;
    onChange: (checked: boolean) => void;
    label?: string;
}

export function Switch({ checked, onChange, label }: SwitchProps) {
    return (
        <HeadlessSwitch.Group as="div" className="flex items-center">
            <HeadlessSwitch
                checked={checked}
                onChange={onChange}
                className={clsx(
                    checked ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-700',
                    'relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2 dark:focus:ring-offset-gray-900'
                )}
            >
                <span
                    aria-hidden="true"
                    className={clsx(
                        checked ? 'translate-x-5' : 'translate-x-0',
                        'pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out'
                    )}
                />
            </HeadlessSwitch>
            {label && (
                <HeadlessSwitch.Label as="span" className="ml-3 text-sm font-medium text-gray-900 dark:text-gray-100">
                    {label}
                </HeadlessSwitch.Label>
            )}
        </HeadlessSwitch.Group>
    );
}

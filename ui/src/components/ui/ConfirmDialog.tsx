
import { Modal } from './Modal';
import { Button } from './Button';

interface ConfirmDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    description?: string;
    confirmText?: string;
    cancelText?: string;
    isDestructive?: boolean;
}

export function ConfirmDialog({
    isOpen,
    onClose,
    onConfirm,
    title,
    description,
    confirmText = 'Confirm',
    cancelText = 'Cancel',
    isDestructive = false,
}: ConfirmDialogProps) {
    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={title}
            footer={
                <>
                    <Button variant="outline" onClick={onClose}>
                        {cancelText}
                    </Button>
                    <Button
                        variant={isDestructive ? 'danger' : 'primary'}
                        onClick={() => {
                            onConfirm();
                            onClose();
                        }}
                    >
                        {confirmText}
                    </Button>
                </>
            }
        >
            <div className="mt-2">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                    {description}
                </p>
            </div>
        </Modal>
    );
}

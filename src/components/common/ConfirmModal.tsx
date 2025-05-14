import { Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { AlertCircle, X } from 'lucide-react';

interface ConfirmModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    type?: 'warning' | 'danger' | 'info';
}

const ConfirmModal = ({
    isOpen,
    onClose,
    onConfirm,
    title,
    message,
    confirmText = 'Confirmar',
    cancelText = 'Cancelar',
    type = 'warning'
}: ConfirmModalProps) => {
    // Definir cores com base no tipo
    const getTypeStyles = () => {
        switch (type) {
            case 'danger':
                return {
                    icon: 'text-danger-500 dark:text-danger-400',
                    bg: 'bg-danger-50 dark:bg-danger-900/30',
                    button: 'bg-danger-600 hover:bg-danger-700 dark:bg-danger-600 dark:hover:bg-danger-700'
                };
            case 'info':
                return {
                    icon: 'text-blue-500 dark:text-blue-400',
                    bg: 'bg-blue-50 dark:bg-blue-900/30',
                    button: 'bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-700'
                };
            case 'warning':
            default:
                return {
                    icon: 'text-amber-500 dark:text-amber-400',
                    bg: 'bg-amber-50 dark:bg-amber-900/30',
                    button: 'bg-amber-600 hover:bg-amber-700 dark:bg-amber-600 dark:hover:bg-amber-700'
                };
        }
    };

    const styles = getTypeStyles();

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
                    <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm dark:bg-gray-900/70" />
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
                            <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white dark:bg-gray-800 p-6 text-left align-middle shadow-xl transition-all">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="flex items-center">
                                        <div className={`p-2 rounded-full ${styles.bg} mr-3`}>
                                            <AlertCircle className={`h-6 w-6 ${styles.icon}`} />
                                        </div>
                                        <Dialog.Title as="h3" className="text-lg font-semibold text-gray-900 dark:text-white">
                                            {title}
                                        </Dialog.Title>
                                    </div>
                                    <button
                                        type="button"
                                        className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                                        onClick={onClose}
                                    >
                                        <X size={18} />
                                    </button>
                                </div>

                                <div className="mt-2 mb-6">
                                    <p className="text-gray-600 dark:text-gray-300">
                                        {message}
                                    </p>
                                </div>

                                <div className="flex justify-end space-x-3">
                                    <button
                                        type="button"
                                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-transparent rounded-md hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-blue-500"
                                        onClick={onClose}
                                    >
                                        {cancelText}
                                    </button>
                                    <button
                                        type="button"
                                        className={`px-4 py-2 text-sm font-medium text-white ${styles.button} border border-transparent rounded-md focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-blue-500`}
                                        onClick={() => {
                                            onConfirm();
                                            onClose();
                                        }}
                                    >
                                        {confirmText}
                                    </button>
                                </div>
                            </Dialog.Panel>
                        </Transition.Child>
                    </div>
                </div>
            </Dialog>
        </Transition>
    );
};

export default ConfirmModal; 
import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import ConfirmModal, { ConfirmModalType, ConfirmModalButton } from '../components/common/ConfirmModal';
import { Ionicons } from '@expo/vector-icons';

export interface ShowConfirmOptions {
  title: string;
  message?: string;
  confirmText?: string;
  cancelText?: string;
  type?: ConfirmModalType;
  icon?: keyof typeof Ionicons.glyphMap;
  onConfirm: () => void | Promise<void>;
  onCancel?: () => void;
}

export interface ShowAlertOptions {
  title: string;
  message?: string;
  buttonText?: string;
  type?: ConfirmModalType;
  icon?: keyof typeof Ionicons.glyphMap;
  onClose?: () => void;
}

export interface ShowPromptOptions {
  title: string;
  message?: string;
  type?: ConfirmModalType;
  icon?: keyof typeof Ionicons.glyphMap;
  buttons: ConfirmModalButton[];
}

interface ConfirmModalContextValue {
  showConfirm: (options: ShowConfirmOptions) => void;
  showAlert: (options: ShowAlertOptions) => void;
  showPrompt: (options: ShowPromptOptions) => void;
  hideConfirm: () => void;
}

const ConfirmModalContext = createContext<ConfirmModalContextValue | undefined>(undefined);

export function ConfirmModalProvider({ children }: { children: ReactNode }) {
  const [visible, setVisible] = useState(false);
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState<string | undefined>('');
  const [confirmText, setConfirmText] = useState('OK');
  const [cancelText, setCancelText] = useState<string | undefined>(undefined);
  const [type, setType] = useState<ConfirmModalType>('danger');
  const [icon, setIcon] = useState<keyof typeof Ionicons.glyphMap | undefined>(undefined);
  const [buttons, setButtons] = useState<ConfirmModalButton[] | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(false);
  const [onConfirmCallback, setOnConfirmCallback] = useState<() => void | Promise<void>>(() => () => {});
  const [onCancelCallback, setOnCancelCallback] = useState<(() => void) | undefined>(undefined);

  const hideConfirm = useCallback(() => {
    setVisible(false);
    setIsLoading(false);
    setButtons(undefined);
    setCancelText(undefined);
  }, []);

  const showConfirm = useCallback((opts: ShowConfirmOptions) => {
    setTitle(opts.title);
    setMessage(opts.message);
    setConfirmText(opts.confirmText || 'Confirm');
    setCancelText(opts.cancelText || 'Cancel');
    setType(opts.type || 'danger');
    setIcon(opts.icon);
    setButtons(undefined);
    setIsLoading(false);
    setOnConfirmCallback(() => opts.onConfirm);
    setOnCancelCallback(() => opts.onCancel);
    setVisible(true);
  }, []);

  const showAlert = useCallback((opts: ShowAlertOptions) => {
    setTitle(opts.title);
    setMessage(opts.message);
    setConfirmText(opts.buttonText || 'OK');
    setCancelText(undefined); // No cancel button for alert
    setType(opts.type || 'info');
    setIcon(opts.icon);
    setButtons(undefined);
    setIsLoading(false);
    setOnConfirmCallback(() => () => {
      setVisible(false);
      opts.onClose?.();
    });
    setOnCancelCallback(undefined);
    setVisible(true);
  }, []);

  const showPrompt = useCallback((opts: ShowPromptOptions) => {
    setTitle(opts.title);
    setMessage(opts.message);
    setCancelText(undefined);
    setType(opts.type || 'info');
    setIcon(opts.icon);
    // Wrap buttons so clicking them dismisses the modal
    const wrappedButtons = opts.buttons.map((btn) => ({
      ...btn,
      onPress: async () => {
        setVisible(false);
        if (btn.onPress) {
          await Promise.resolve(btn.onPress());
        }
      },
    }));
    setButtons(wrappedButtons);
    setIsLoading(false);
    setOnConfirmCallback(() => () => {});
    setOnCancelCallback(() => () => setVisible(false));
    setVisible(true);
  }, []);

  const handleConfirm = async () => {
    try {
      setIsLoading(true);
      await Promise.resolve(onConfirmCallback());
    } finally {
      setVisible(false);
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    if (isLoading) return;
    setVisible(false);
    onCancelCallback?.();
  };

  return (
    <ConfirmModalContext.Provider value={{ showConfirm, showAlert, showPrompt, hideConfirm }}>
      {children}
      <ConfirmModal
        visible={visible}
        title={title}
        message={message}
        confirmText={confirmText}
        cancelText={cancelText}
        type={type}
        icon={icon}
        buttons={buttons}
        isLoading={isLoading}
        onConfirm={handleConfirm}
        onCancel={handleCancel}
      />
    </ConfirmModalContext.Provider>
  );
}

export function useConfirmModal() {
  const ctx = useContext(ConfirmModalContext);
  if (!ctx) {
    throw new Error('useConfirmModal must be used within a ConfirmModalProvider');
  }
  return ctx;
}

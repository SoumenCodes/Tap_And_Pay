import React, { useEffect, useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Animated,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export type ConfirmModalType = 'danger' | 'warning' | 'info' | 'success';

export interface ConfirmModalButton {
  text: string;
  onPress?: () => void | Promise<void>;
  style?: 'default' | 'cancel' | 'destructive';
}

export interface ConfirmModalProps {
  visible: boolean;
  title: string;
  message?: string;
  confirmText?: string;
  cancelText?: string;
  type?: ConfirmModalType;
  icon?: keyof typeof Ionicons.glyphMap;
  isLoading?: boolean;
  buttons?: ConfirmModalButton[];
  onConfirm?: () => void | Promise<void>;
  onCancel?: () => void;
}

const TYPE_CONFIG = {
  danger: {
    badgeBg: '#FEE2E2',
    iconColor: '#DC2626',
    confirmBg: '#DC2626',
    defaultIcon: 'power' as const,
  },
  warning: {
    badgeBg: '#FEF3C7',
    iconColor: '#D97706',
    confirmBg: '#0F172A',
    defaultIcon: 'alert-circle-outline' as const,
  },
  info: {
    badgeBg: '#EFF6FF',
    iconColor: '#2563EB',
    confirmBg: '#0F172A',
    defaultIcon: 'information-circle-outline' as const,
  },
  success: {
    badgeBg: '#D1FAE5',
    iconColor: '#059669',
    confirmBg: '#059669',
    defaultIcon: 'checkmark-circle-outline' as const,
  },
};

export default function ConfirmModal({
  visible,
  title,
  message,
  confirmText = 'OK',
  cancelText,
  type = 'danger',
  icon,
  isLoading = false,
  buttons,
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  const [scaleAnim] = useState(() => new Animated.Value(0.9));
  const [opacityAnim] = useState(() => new Animated.Value(0));

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 8,
          tension: 65,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 180,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      scaleAnim.setValue(0.9);
      opacityAnim.setValue(0);
    }
  }, [visible, opacityAnim, scaleAnim]);

  const cfg = TYPE_CONFIG[type] || TYPE_CONFIG.danger;
  const iconName = icon || cfg.defaultIcon;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onCancel}
      statusBarTranslucent
    >
      <TouchableWithoutFeedback onPress={isLoading ? undefined : onCancel}>
        <View style={styles.backdrop}>
          <TouchableWithoutFeedback onPress={(e) => e.stopPropagation()}>
            <Animated.View
              style={[
                styles.dialogCard,
                {
                  opacity: opacityAnim,
                  transform: [{ scale: scaleAnim }],
                },
              ]}
            >
              {/* Icon Badge */}
              <View style={[styles.iconCircle, { backgroundColor: cfg.badgeBg }]}>
                <Ionicons name={iconName} size={28} color={cfg.iconColor} />
              </View>

              {/* Title & Message */}
              <Text style={styles.titleText}>{title}</Text>
              {message ? <Text style={styles.messageText}>{message}</Text> : null}

              {/* Custom Buttons list or Default dual/single buttons */}
              {buttons && buttons.length > 0 ? (
                <View style={styles.buttonsColumn}>
                  {buttons.map((btn, idx) => {
                    const isCancel = btn.style === 'cancel';
                    const isDestructive = btn.style === 'destructive';
                    return (
                      <TouchableOpacity
                        key={idx}
                        style={[
                          styles.actionItemButton,
                          isCancel && styles.actionItemCancel,
                          isDestructive && styles.actionItemDestructive,
                          !isCancel && !isDestructive && styles.actionItemPrimary,
                        ]}
                        onPress={() => {
                          if (btn.onPress) {
                            btn.onPress();
                          } else if (onCancel) {
                            onCancel();
                          }
                        }}
                        disabled={isLoading}
                        activeOpacity={0.7}
                      >
                        <Text
                          style={[
                            styles.actionItemText,
                            isCancel && styles.actionItemCancelText,
                            isDestructive && styles.actionItemDestructiveText,
                            !isCancel && !isDestructive && styles.actionItemPrimaryText,
                          ]}
                        >
                          {btn.text}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              ) : (
                <View style={styles.actionsRow}>
                  {cancelText ? (
                    <TouchableOpacity
                      style={styles.cancelButton}
                      onPress={onCancel}
                      disabled={isLoading}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.cancelButtonText}>{cancelText}</Text>
                    </TouchableOpacity>
                  ) : null}

                  <TouchableOpacity
                    style={[
                      styles.confirmButton,
                      { backgroundColor: cfg.confirmBg },
                      isLoading && { opacity: 0.75 },
                    ]}
                    onPress={onConfirm}
                    disabled={isLoading}
                    activeOpacity={0.85}
                  >
                    {isLoading ? (
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                      <Text style={styles.confirmButtonText}>{confirmText}</Text>
                    )}
                  </TouchableOpacity>
                </View>
              )}
            </Animated.View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  dialogCard: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    paddingHorizontal: 22,
    paddingTop: 24,
    paddingBottom: 20,
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.16,
        shadowRadius: 20,
      },
      android: {
        elevation: 12,
      },
    }),
  },
  iconCircle: {
    width: 58,
    height: 58,
    borderRadius: 29,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  titleText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
    textAlign: 'center',
    marginBottom: 8,
    letterSpacing: -0.2,
  },
  messageText: {
    fontSize: 13.5,
    fontWeight: '500',
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
    paddingHorizontal: 8,
  },
  actionsRow: {
    flexDirection: 'row',
    width: '100%',
    gap: 10,
    marginTop: 4,
  },
  cancelButton: {
    flex: 1,
    height: 46,
    borderRadius: 14,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButtonText: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#475569',
  },
  confirmButton: {
    flex: 1,
    height: 46,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 2,
  },
  confirmButtonText: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  buttonsColumn: {
    width: '100%',
    gap: 8,
    marginTop: 4,
  },
  actionItemButton: {
    width: '100%',
    height: 46,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionItemText: {
    fontSize: 14,
    fontWeight: '700',
  },
  actionItemPrimary: {
    backgroundColor: '#0F172A',
  },
  actionItemPrimaryText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  actionItemDestructive: {
    backgroundColor: '#FEE2E2',
  },
  actionItemDestructiveText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#DC2626',
  },
  actionItemCancel: {
    backgroundColor: '#F1F5F9',
  },
  actionItemCancelText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#475569',
  },
});

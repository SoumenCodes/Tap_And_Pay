import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Vibration } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface KeypadProps {
  onPress: (key: string) => void;
  disabled?: boolean;
}

const KEYS = [
  ['1', '2', '3'],
  ['4', '5', '6'],
  ['7', '8', '9'],
  ['.', '0', 'backspace'],
];

export const Keypad: React.FC<KeypadProps> = ({ onPress, disabled = false }) => {
  const handlePress = (key: string) => {
    if (disabled) return;
    try {
      Vibration.vibrate(8);
    } catch {
      // ignore
    }
    onPress(key);
  };

  return (
    <View style={styles.container}>
      {KEYS.map((row, rowIdx) => (
        <View key={rowIdx} style={styles.row}>
          {row.map((key) => (
            <TouchableOpacity
              key={key}
              style={[styles.key, disabled && styles.keyDisabled]}
              onPress={() => handlePress(key)}
              activeOpacity={0.6}
              disabled={disabled}
            >
              {key === 'backspace' ? (
                <Ionicons name="backspace-outline" size={20} color="#0F172A" />
              ) : key === '.' ? (
                <Text style={[styles.keyText, styles.dotText]}>.</Text>
              ) : (
                <Text style={styles.keyText}>{key}</Text>
              )}
            </TouchableOpacity>
          ))}
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    gap: 8,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  key: {
    flex: 1,
    height: 48,
    backgroundColor: '#F4F6F9',
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  keyDisabled: {
    opacity: 0.4,
  },
  keyText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#0F172A',
  },
  dotText: {
    fontSize: 26,
    fontWeight: '700',
    marginTop: -6,
  },
});

export default Keypad;

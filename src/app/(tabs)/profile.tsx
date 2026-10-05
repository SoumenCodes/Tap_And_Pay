import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { colors } from '../../constants/colors';

export default function ProfileTabScreen() {
  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      <Text style={styles.title}>Taxi Driver Profile</Text>
      <Text style={styles.subtitle}>Coming up in the next step</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text.primary,
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    color: colors.text.secondary,
  },
});

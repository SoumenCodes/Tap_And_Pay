import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useAuth } from '../../context/AuthContext';
import OtherBusinessProfileScreen from '../../components/other-business/OtherBusinessProfileScreen';
import HeaderBar from '../../components/common/HeaderBar';

export default function ProfileTabScreen() {
  const { user } = useAuth();

  // If user is Other Business (Crown Cuts), render Screen 24 Profile Screen
  if (user.loginType === 'other_business') {
    return <OtherBusinessProfileScreen />;
  }

  // Taxi Driver / Owner Profile placeholder
  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      <HeaderBar title="Profile" />
      <View style={styles.content}>
        <Text style={styles.title}>{user.name || 'Taxi Profile'}</Text>
        <Text style={styles.subtitle}>Taxi Number: {user.taxiNumber || 'M6061'}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    backgroundColor: '#F8FAFC',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    color: '#64748B',
  },
});

import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Text } from 'react-native';
import { EventCreationSettings } from '../components';

export const EventPolicyDemo: React.FC = () => {
  const [showSettings, setShowSettings] = useState(false);

  return (
    <View style={styles.container}>
      {showSettings ? (
        <EventCreationSettings onClose={() => setShowSettings(false)} />
      ) : (
        <View style={styles.content}>
          <Text style={styles.title}>Event Policy Demo</Text>
          <Text style={styles.description}>
            This demo shows the EventCreationSettings Canvas component with:
            {'\n'}• Global event creation toggle
            {'\n'}• Per-club event creation toggles
            {'\n'}• Moderation mode settings
            {'\n'}• Configurable limits and restrictions
          </Text>
          <TouchableOpacity
            style={styles.button}
            onPress={() => setShowSettings(true)}
          >
            <Text style={styles.buttonText}>Open Event Settings</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 16,
    textAlign: 'center',
  },
  description: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  button: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});

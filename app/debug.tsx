import React from 'react';
import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { auth } from '../FirebaseConfig';

export default function DebugScreen() {
  const { user, loading, forceSignOut } = useAuth();

  const checkAuthState = () => {
    const currentUser = auth.currentUser;
    Alert.alert(
      'Auth Debug Info',
      `Context User: ${user?.email || 'null'}\nFirebase User: ${currentUser?.email || 'null'}\nLoading: ${loading}`,
      [{ text: 'OK' }]
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Debug Screen</Text>
      
      <View style={styles.info}>
        <Text style={styles.label}>User Email:</Text>
        <Text style={styles.value}>{user?.email || 'Not signed in'}</Text>
      </View>
      
      <View style={styles.info}>
        <Text style={styles.label}>Loading:</Text>
        <Text style={styles.value}>{loading ? 'Yes' : 'No'}</Text>
      </View>

      <TouchableOpacity style={styles.button} onPress={checkAuthState}>
        <Text style={styles.buttonText}>Check Auth State</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.button} onPress={forceSignOut}>
        <Text style={styles.buttonText}>Force Sign Out</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#F2F2F7',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  info: {
    marginBottom: 15,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
  value: {
    fontSize: 14,
    color: '#8E8E93',
    marginTop: 5,
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    alignItems: 'center',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

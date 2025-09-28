import React from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useAuth } from '../../contexts/AuthContext';

export default function HomeScreen() {
  const { user, signOut, forceSignOut } = useAuth();

  const handleForceSignOut = () => {
    Alert.alert(
      "Force Sign Out",
      "This will sign you out for testing purposes",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Sign Out", style: "destructive", onPress: forceSignOut },
      ]
    );
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.welcome}>Welcome to Campus Events!</Text>
        
        {/* Debug info */}
        <Text style={styles.debugText}>
          User: {user?.email || 'Not signed in'}
        </Text>
        
        {/* Temporary sign out button for testing */}
        <TouchableOpacity style={styles.debugButton} onPress={handleForceSignOut}>
          <Text style={styles.debugButtonText}>Force Sign Out (Debug)</Text>
        </TouchableOpacity>
        
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F2F2F7",
  },
  content: {
    padding: 20,
  },
  welcome: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#000",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: "#8E8E93",
    marginBottom: 24,
  },
  userInfo: {
    backgroundColor: "#E3F2FD",
    borderRadius: 8,
    padding: 12,
    marginBottom: 24,
  },
  userText: {
    fontSize: 14,
    color: "#1976D2",
    textAlign: "center",
  },
  statsContainer: {
    flexDirection: "row",
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 4,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#007AFF",
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: "#8E8E93",
  },
  quickActions: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#000",
    marginBottom: 16,
  },
  actionButton: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  actionText: {
    fontSize: 16,
    color: "#000",
  },
  recentEvents: {
    marginBottom: 24,
  },
  notificationCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#000",
    marginBottom: 4,
  },
  notificationTime: {
    fontSize: 12,
    color: "#8E8E93",
    marginBottom: 8,
  },
  notificationText: {
    fontSize: 14,
    color: "#8E8E93",
    lineHeight: 20,
  },
  debugText: {
    fontSize: 14,
    color: "#007AFF",
    marginBottom: 20,
    textAlign: "center",
  },
  debugButton: {
    backgroundColor: "#FF3B30",
    borderRadius: 8,
    padding: 12,
    alignItems: "center",
    marginTop: 20,
  },
  debugButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
  },
});

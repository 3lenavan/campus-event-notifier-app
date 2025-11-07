import { Ionicons } from '@expo/vector-icons';
import type { AuthError } from '@supabase/supabase-js';
import React, { useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Platform,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { mapSupabaseAuthError } from '../lib/auth';
import { supabase } from '../lib/supabaseClient';

interface LoginProps {
  onSuccess?: () => void;
}

export const Login: React.FC<LoginProps> = ({ onSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);

  const handleEmailAuth = async () => {
    const emailTrimmed = email.trim();
    const passwordTrimmed = password.trim();

    if (!emailTrimmed || !passwordTrimmed) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(emailTrimmed)) {
      Alert.alert('Error', 'Please enter a valid email address');
      return;
    }

    // Basic password validation
    if (passwordTrimmed.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters long');
      return;
    }

    setLoading(true);
    try {
      if (isSignUp) {
        const { data, error } = await supabase.auth.signUp({
          email: emailTrimmed,
          password: passwordTrimmed,
        });

        if (error) {
          throw error;
        }

        const successMessage = data?.session
          ? 'Account created successfully!'
          : 'Account created! Check your email to verify your address.';
        Alert.alert('Success', successMessage);

        if (data?.session) {
          onSuccess?.();
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email: emailTrimmed,
          password: passwordTrimmed,
        });

        if (error) {
          throw error;
        }

        Alert.alert('Success', 'Signed in successfully!');
        onSuccess?.();
      }
    } catch (err) {
      console.error('Auth error:', err);
      const errorMessage = mapSupabaseAuthError(err as AuthError, isSignUp ? 'signup' : 'signin');
      Alert.alert('Error', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleAuth = () => {
    Alert.alert('Info', 'Google Sign-In is coming soon. Please continue with email and password for now.');
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.content}>
        <View style={styles.header}>
          <Ionicons name="school" size={48} color="#3B82F6" />
          <Text style={styles.title}>Campus Event Notifier</Text>
          <Text style={styles.subtitle}>
            {isSignUp ? 'Create your account' : 'Sign in to your account'}
          </Text>
        </View>

        <View style={styles.form}>
          <View style={styles.inputContainer}>
            <Ionicons name="mail-outline" size={20} color="#6B7280" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Email"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          <View style={styles.inputContainer}>
            <Ionicons name="lock-closed-outline" size={20} color="#6B7280" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoCapitalize="none"
            />
          </View>

          <TouchableOpacity
            style={[styles.primaryButton, loading && styles.buttonDisabled]}
            onPress={handleEmailAuth}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text style={styles.primaryButtonText}>
                {isSignUp ? 'Sign Up' : 'Sign In'}
              </Text>
            )}
          </TouchableOpacity>

          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>or</Text>
            <View style={styles.dividerLine} />
          </View>

          <TouchableOpacity
            style={[styles.googleButton, loading && styles.buttonDisabled]}
            onPress={handleGoogleAuth}
            disabled={loading}
          >
            <Ionicons name="logo-google" size={20} color="#DB4437" />
            <Text style={styles.googleButtonText}>Continue with Google</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.switchButton}
            onPress={() => setIsSignUp(!isSignUp)}
            disabled={loading}
          >
            <Text style={styles.switchButtonText}>
              {isSignUp 
                ? 'Already have an account? Sign In' 
                : "Don't have an account? Sign Up"
              }
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
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
    paddingHorizontal: 24,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#111827',
    marginTop: 16,
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    marginTop: 8,
    textAlign: 'center',
  },
  form: {
    width: '100%',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 12,
    marginBottom: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#111827',
  },
  primaryButton: {
    backgroundColor: '#3B82F6',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 16,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  primaryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 16,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E5E7EB',
  },
  dividerText: {
    marginHorizontal: 16,
    color: '#6B7280',
    fontSize: 14,
  },
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'white',
    borderRadius: 12,
    paddingVertical: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 16,
  },
  googleButtonText: {
    color: '#111827',
    fontSize: 16,
    fontWeight: '500',
    marginLeft: 8,
  },
  switchButton: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  switchButtonText: {
    color: '#3B82F6',
    fontSize: 14,
    fontWeight: '500',
  },
});

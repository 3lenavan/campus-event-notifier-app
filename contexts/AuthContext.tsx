import { User, onAuthStateChanged, signOut } from 'firebase/auth';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { auth } from '../FirebaseConfig';

// Define the shape of our authentication context
interface AuthContextType {
  user: User | null;           // Current user (null if not signed in)
  loading: boolean;           // True while checking authentication status
  signOut: () => Promise<void>; // Function to sign out
  forceSignOut: () => void;   // Force sign out for testing
}

// Create the context with default values
const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  signOut: async () => {},
  forceSignOut: () => {},
});

// Custom hook to use the auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Provider component that wraps our app and manages auth state
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Listen for authentication state changes
    // This runs when the app starts and whenever the user signs in/out
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      console.log('Auth state changed:', user ? 'User signed in' : 'User signed out');
      console.log('User email:', user?.email || 'No email');
      setUser(user);           // Set the current user (null if signed out)
      setLoading(false);      // We're done checking auth status
    });

    // Cleanup function - unsubscribe when component unmounts
    return () => unsubscribe();
  }, []);

  // Function to sign out the current user
  const handleSignOut = async () => {
    try {
      await signOut(auth);
      // The onAuthStateChanged listener will automatically update the user state
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  // Force sign out for testing - immediately sets user to null
  const handleForceSignOut = () => {
    console.log('Force sign out called');
    setUser(null);
    setLoading(false);
  };

  // The value we provide to all child components
  const value = {
    user,
    loading,
    signOut: handleSignOut,
    forceSignOut: handleForceSignOut,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

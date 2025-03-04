'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { 
  getAuth, 
  onAuthStateChanged, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut as firebaseSignOut,
  GoogleAuthProvider,
  signInWithPopup,
  User
} from 'firebase/auth';
import { FirebaseError } from 'firebase/app';
import { app } from '../lib/firebase';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  signUp: (email: string, password: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  error: null,
  signUp: async () => {},
  signIn: async () => {},
  signInWithGoogle: async () => {},
  signOut: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const auth = getAuth(app);

  useEffect(() => {
    // This ensures we only have one listener
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });

    // Clean up the listener on unmount
    return () => unsubscribe();
  }, [auth]);

  const signUp = async (email: string, password: string) => {
    setError(null);
    try {
      await createUserWithEmailAndPassword(auth, email, password);
    } catch (error: unknown) {
      if (error instanceof FirebaseError) {
        setError(error.message);
      } else {
        setError('An unexpected error occurred');
      }
      throw error;
    }
  };

  const signIn = async (email: string, password: string) => {
    setError(null);
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error: unknown) {
      if (error instanceof FirebaseError) {
        setError(error.message);
      } else {
        setError('An unexpected error occurred');
      }
      throw error;
    }
  };

  const signInWithGoogle = async () => {
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (error: unknown) {
      if (error instanceof FirebaseError) {
        setError(error.message);
      } else {
        setError('An unexpected error occurred');
      }
      throw error;
    }
  };

  const signOut = async () => {
    try {
      await firebaseSignOut(auth);
    } catch (error: unknown) {
      if (error instanceof FirebaseError) {
        setError(error.message);
      } else {
        setError('An unexpected error occurred');
      }
      throw error;
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, error, signUp, signIn, signInWithGoogle, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}; 
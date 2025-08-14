import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User,
  GoogleAuthProvider,
  signInWithCredential
} from 'firebase/auth';
import { auth } from './firebase';

export interface FirebaseUser {
  uid: string;
  email: string | null;
  displayName?: string | null;
  photoURL?: string | null;
}

export class FirebaseAuthService {
  // Sign in with email and password
  static async signIn(email: string, password: string): Promise<FirebaseUser> {
    try {
      console.log('🔐 Attempting Firebase sign in with:', email);
      console.log('🔐 Firebase config check:', {
        apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY ? '✅ Set' : '❌ Missing',
        authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN ? '✅ Set' : '❌ Missing',
        projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID ? '✅ Set' : '❌ Missing'
      });
      
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      console.log('✅ Firebase sign in successful');
      return this.convertToFirebaseUser(userCredential.user);
    } catch (error: any) {
      console.log('❌ Firebase sign in error details:', error.code, error.message);
      console.log('❌ Full error object:', error);
      throw new Error(this.getErrorMessage(error.code));
    }
  }

  // Sign up with email and password
  static async signUp(email: string, password: string): Promise<FirebaseUser> {
    try {
      console.log('🔐 Attempting Firebase sign up with:', email);
      console.log('🔐 Firebase config check:', {
        apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY ? '✅ Set' : '❌ Missing',
        authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN ? '✅ Set' : '❌ Missing',
        projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID ? '✅ Set' : '❌ Missing'
      });
      
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      console.log('✅ Firebase sign up successful');
      return this.convertToFirebaseUser(userCredential.user);
    } catch (error: any) {
      console.log('❌ Firebase sign up error details:', error.code, error.message);
      console.log('❌ Full error object:', error);
      throw new Error(this.getErrorMessage(error.code));
    }
  }

  // Sign out
  static async signOut(): Promise<void> {
    try {
      await signOut(auth);
    } catch (error: any) {
      throw new Error('Failed to sign out');
    }
  }

  // Get current user
  static getCurrentUser(): FirebaseUser | null {
    const user = auth.currentUser;
    return user ? this.convertToFirebaseUser(user) : null;
  }

  // Listen to auth state changes
  static onAuthStateChange(callback: (user: FirebaseUser | null) => void): () => void {
    return onAuthStateChanged(auth, (user) => {
      callback(user ? this.convertToFirebaseUser(user) : null);
    });
  }

  // Google Sign In
  static async signInWithGoogle(idToken: string): Promise<FirebaseUser> {
    try {
      const credential = GoogleAuthProvider.credential(idToken);
      const userCredential = await signInWithCredential(auth, credential);
      return this.convertToFirebaseUser(userCredential.user);
    } catch (error: any) {
      throw new Error(this.getErrorMessage(error.code));
    }
  }

  // Convert Firebase User to our interface
  private static convertToFirebaseUser(user: User): FirebaseUser {
    return {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName,
      photoURL: user.photoURL
    };
  }

  // Get user-friendly error messages
  private static getErrorMessage(errorCode: string): string {
    switch (errorCode) {
      case 'auth/user-not-found':
        return 'No account found with this email address';
      case 'auth/wrong-password':
        return 'Incorrect password';
      case 'auth/email-already-in-use':
        return 'An account with this email already exists';
      case 'auth/weak-password':
        return 'Password should be at least 6 characters';
      case 'auth/invalid-email':
        return 'Invalid email address';
      case 'auth/too-many-requests':
        return 'Too many failed attempts. Please try again later';
      default:
        return 'Authentication failed. Please try again';
    }
  }
} 
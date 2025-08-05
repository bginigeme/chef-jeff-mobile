console.log('[CHEFJEFF] JS bundle started');
import React, { useEffect, useState } from 'react';
import { Platform, View, Text, Button, Modal } from 'react-native';
import * as TrackingTransparency from 'expo-tracking-transparency';
import { SplashScreen } from './components/SplashScreen';
import { PantryManager } from './components/PantryManager';
import RecipeSection from './components/RecipeSection';
import { WeeklyMealTracker } from './components/WeeklyMealTracker';
import { ProfilePage } from './components/ProfilePage';
import { SignInScreen } from './components/SignInScreen';
import { SignUpScreen } from './components/SignUpScreen';
import { HomeScreen } from './components/HomeScreen';

class ErrorBoundary extends React.Component<any, { hasError: boolean; error: any }> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error: any) {
    return { hasError: true, error };
  }
  componentDidCatch(error: any, info: any) {
    console.log('[ErrorBoundary] Error caught:', error, info);
  }
  render() {
    if (this.state.hasError) {
      return (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#EA580C' }}>
          <Text style={{ color: 'white', fontSize: 20, fontWeight: 'bold' }}>Something went wrong.</Text>
          <Text style={{ color: 'white', marginTop: 10 }}>{String(this.state.error)}</Text>
        </View>
      );
    }
    return this.props.children;
  }
}

export default function App() {
  const [showSplash, setShowSplash] = useState(true);
  const [attChecked, setAttChecked] = useState(false);
  const [pantryItems, setPantryItems] = useState<string[]>([]);
  const [recipes, setRecipes] = useState<{ pantryOnly: any, enhanced: any }>({ pantryOnly: null, enhanced: null });
  const [isGenerating, setIsGenerating] = useState(false);
  const [hasRecipes, setHasRecipes] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [userId] = useState('demo-user');
  const [userName] = useState('Chef Jeff');
  const [loggedIn, setLoggedIn] = useState(true); // No login required for core features
  const [showSignUp, setShowSignUp] = useState(false);

  useEffect(() => {
    console.log('[App] Startup useEffect running');
    const timeout = setTimeout(() => {
      console.log('[App] Splash fallback timeout fired');
      setShowSplash(false);
    }, 3000);
    const requestATT = async () => {
      if (Platform.OS === 'ios') {
        try {
          setTimeout(async () => {
            try {
              const { status } = await TrackingTransparency.getTrackingPermissionsAsync();
              if (status !== 'granted') {
                await TrackingTransparency.requestTrackingPermissionsAsync();
              }
            } catch (e) {
              console.log('[App] ATT error:', e);
            }
            setAttChecked(true);
          }, 2000);
        } catch (e) {
          console.log('[App] ATT setup error:', e);
          setAttChecked(true);
        }
      } else {
        setAttChecked(true);
      }
    };
    requestATT();
    return () => clearTimeout(timeout);
  }, []);

  const handleGenerateRecipes = () => {
    setIsGenerating(true);
    // Simulate recipe generation
    setTimeout(() => {
      setRecipes({
        pantryOnly: {
          id: '1',
          title: 'Pantry Pasta',
          description: 'A quick pasta using your pantry staples.',
          difficulty: 'Easy',
          cookingTime: 20,
          servings: 2,
          ingredients: [{ name: 'Pasta', amount: '200', unit: 'g' }, { name: 'Tomato Sauce' }],
          instructions: ['Boil pasta', 'Add sauce', 'Serve hot']
        },
        enhanced: {
          id: '2',
          title: 'Fancy Pantry Pasta',
          description: 'A gourmet twist on pantry pasta.',
          difficulty: 'Medium',
          cookingTime: 30,
          servings: 2,
          ingredients: [{ name: 'Pasta', amount: '200', unit: 'g' }, { name: 'Tomato Sauce' }, { name: 'Basil' }],
          instructions: ['Boil pasta', 'Add sauce and basil', 'Serve with garnish']
        }
      });
      setIsGenerating(false);
      setHasRecipes(true);
    }, 1500);
  };

  const handleSignUp = () => {
    setShowSignUp(true);
  };
  
  const handleSignUpComplete = () => {
    setShowSignUp(false);
    setLoggedIn(true);
  };
  
  const handleBackToSignIn = () => {
    setShowSignUp(false);
  };
  const handleForgotPassword = () => {
    // Placeholder for forgot password flow
    alert('Forgot password flow not implemented yet.');
  };

  if (showSplash) {
    return <SplashScreen onAnimationFinish={() => {
      console.log('[App] Splash animation finished or forced');
      setShowSplash(false);
    }} />;
  }

  if (!loggedIn) {
    if (showSignUp) {
      return (
        <SignUpScreen
          onSignUp={handleSignUpComplete}
          onBackToSignIn={handleBackToSignIn}
        />
      );
    }
    
    return (
      <SignInScreen
        onSignIn={() => setLoggedIn(true)}
        onSignUp={handleSignUp}
        onForgotPassword={handleForgotPassword}
      />
    );
  }

  return (
    <ErrorBoundary>
      <>
        <HomeScreen
          onProfile={() => setShowProfile(true)}
          onSignOut={() => setLoggedIn(false)}
        />
        <ProfilePage
          userId={userId}
          userName={userName}
          visible={showProfile}
          onClose={() => setShowProfile(false)}
        />
      </>
    </ErrorBoundary>
  );
}
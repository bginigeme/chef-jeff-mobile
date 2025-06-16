import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import SignIn from './components/Auth/SignIn';
import SignUp from './components/Auth/SignUp';
import CreateProfile from './components/Profile/CreateProfile';
import PantrySetup from './components/Pantry/PantrySetup';
import Dashboard from './components/Dashboard/Dashboard';
import { ProfileView } from './components/Profile/ProfileView';
import { Header } from './components/Layout/Header';
import { getProfile, Profile } from './supabase/database';

const AppContent: React.FC = () => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [userStep, setUserStep] = useState<'auth' | 'profile' | 'pantry' | 'dashboard'>('auth');
  const [currentPage, setCurrentPage] = useState<'dashboard' | 'profile'>('dashboard');
  const [userProfile, setUserProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    const checkUserStatus = async () => {
      if (!user) {
        setUserStep('auth');
        setLoading(false);
        return;
      }

      try {
        const profile = await getProfile(user.id);
        setUserProfile(profile);
        
        if (!profile) {
          setUserStep('profile');
        } else if (!profile.pantry_items || profile.pantry_items.length === 0) {
          setUserStep('pantry');
        } else {
          setUserStep('dashboard');
        }
      } catch (error) {
        console.error('Error checking user status:', error);
        setUserStep('auth');
      }
      
      setLoading(false);
    };

    checkUserStatus();
  }, [user]);

  const handleNavigation = (page: 'dashboard' | 'profile') => {
    setCurrentPage(page);
  };

  const handleProfileUpdate = (updatedProfile: Profile) => {
    setUserProfile(updatedProfile);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-orange-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-orange-500 mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  switch (userStep) {
    case 'auth':
      return isSignUp ? (
        <SignUp onToggleMode={() => setIsSignUp(false)} />
      ) : (
        <SignIn onToggleMode={() => setIsSignUp(true)} />
      );
    
    case 'profile':
      return <CreateProfile onProfileComplete={() => setUserStep('pantry')} />;
    
    case 'pantry':
      return <PantrySetup onPantryComplete={() => setUserStep('dashboard')} />;
    
    case 'dashboard':
      return (
        <div className="min-h-screen bg-gray-50">
          <Header 
            currentPage={currentPage}
            onNavigate={handleNavigation}
            userFirstName={userProfile?.first_name}
          />
          <div className="py-8">
            {currentPage === 'dashboard' ? (
              <Dashboard />
            ) : userProfile ? (
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <ProfileView 
                  profile={userProfile}
                  onProfileUpdate={handleProfileUpdate}
                />
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-gray-600">Loading profile...</p>
              </div>
            )}
          </div>
        </div>
      );
    
    default:
      return <SignIn onToggleMode={() => setIsSignUp(true)} />;
  }
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
};

export default App; 
import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { ChefHat, User, Home, LogOut } from 'lucide-react';

interface HeaderProps {
  currentPage: 'dashboard' | 'profile';
  onNavigate: (page: 'dashboard' | 'profile') => void;
  userFirstName?: string;
}

export const Header: React.FC<HeaderProps> = ({ currentPage, onNavigate, userFirstName }) => {
  const { logout } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center space-x-3">
            <ChefHat className="h-8 w-8 text-orange-500" />
            <h1 className="text-xl font-bold text-gray-900">Chef Jeff</h1>
          </div>

          {/* Navigation */}
          <nav className="flex items-center space-x-1">
            <button
              onClick={() => onNavigate('dashboard')}
              className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                currentPage === 'dashboard'
                  ? 'bg-orange-100 text-orange-700'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
              }`}
            >
              <Home size={16} />
              <span>Dashboard</span>
            </button>
            
            <button
              onClick={() => onNavigate('profile')}
              className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                currentPage === 'profile'
                  ? 'bg-orange-100 text-orange-700'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
              }`}
            >
              <User size={16} />
              <span>Profile</span>
            </button>
          </nav>

          {/* User info and logout */}
          <div className="flex items-center space-x-3">
            {userFirstName && (
              <span className="text-gray-700 text-sm">
                Hello, <span className="font-medium">{userFirstName}</span>
              </span>
            )}
            <button
              onClick={handleLogout}
              className="flex items-center space-x-2 text-gray-500 hover:text-gray-700 px-3 py-2 rounded-md text-sm font-medium transition-colors"
            >
              <LogOut size={16} />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}; 
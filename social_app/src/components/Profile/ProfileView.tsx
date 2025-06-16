import React, { useState } from 'react';
import { Profile } from '../../supabase/database';
import { updateProfile } from '../../supabase/database';
import { useAuth } from '../../contexts/AuthContext';
import { Edit3, Save, X, User, Mail, Award, Heart, Clock, ChefHat } from 'lucide-react';

interface ProfileViewProps {
  profile: Profile;
  onProfileUpdate: (updatedProfile: Profile) => void;
}

export const ProfileView: React.FC<ProfileViewProps> = ({ profile, onProfileUpdate }) => {
  const { user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Form state
  const [firstName, setFirstName] = useState(profile.first_name);
  const [lastName, setLastName] = useState(profile.last_name);
  const [dietaryRestrictions, setDietaryRestrictions] = useState<string[]>(profile.dietary_restrictions);
  const [skillLevel, setSkillLevel] = useState(profile.cooking_skill_level);

  const dietaryOptions = [
    'Vegetarian',
    'Vegan',
    'Gluten-free',
    'Dairy-free',
    'Nut allergies',
    'Keto',
    'Paleo',
    'Low-sodium'
  ];

  const handleDietaryChange = (option: string) => {
    setDietaryRestrictions(prev => 
      prev.includes(option) 
        ? prev.filter(item => item !== option)
        : [...prev, option]
    );
  };

  const handleSave = async () => {
    if (!user) return;

    try {
      setLoading(true);
      setError('');

      const updatedProfile = await updateProfile(user.id, {
        first_name: firstName,
        last_name: lastName,
        dietary_restrictions: dietaryRestrictions,
        cooking_skill_level: skillLevel,
      });

      if (updatedProfile) {
        onProfileUpdate(updatedProfile);
        setIsEditing(false);
      }
    } catch (error: any) {
      setError('Failed to update profile: ' + error.message);
    }
    setLoading(false);
  };

  const handleCancel = () => {
    // Reset form to original values
    setFirstName(profile.first_name);
    setLastName(profile.last_name);
    setDietaryRestrictions(profile.dietary_restrictions);
    setSkillLevel(profile.cooking_skill_level);
    setError('');
    setIsEditing(false);
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Profile Header */}
      <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center">
              <User className="w-8 h-8 text-orange-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {profile.first_name} {profile.last_name}
              </h1>
              <p className="text-gray-600 flex items-center space-x-1">
                <Mail size={16} />
                <span>{profile.email}</span>
              </p>
            </div>
          </div>
          
          {!isEditing && (
            <button
              onClick={() => setIsEditing(true)}
              className="flex items-center space-x-2 bg-orange-500 text-white px-4 py-2 rounded-md hover:bg-orange-600 transition-colors"
            >
              <Edit3 size={16} />
              <span>Edit Profile</span>
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
          {error}
        </div>
      )}

      {/* Profile Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Personal Information */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Personal Information</h2>
          </div>

          {isEditing ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    First Name
                  </label>
                  <input
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-orange-500 focus:border-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Last Name
                  </label>
                  <input
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-orange-500 focus:border-orange-500"
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700">Full Name</label>
                <p className="text-gray-900">{profile.first_name} {profile.last_name}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Email</label>
                <p className="text-gray-900">{profile.email}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Member Since</label>
                <p className="text-gray-900">
                  {new Date(profile.created_at).toLocaleDateString()}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Cooking Information */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Cooking Preferences</h2>

          {isEditing ? (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Cooking Skill Level
                </label>
                <select
                  value={skillLevel}
                  onChange={(e) => setSkillLevel(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-orange-500 focus:border-orange-500"
                >
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="advanced">Advanced</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Dietary Restrictions
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {dietaryOptions.map((option) => (
                    <label key={option} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={dietaryRestrictions.includes(option)}
                        onChange={() => handleDietaryChange(option)}
                        className="mr-2 rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                      />
                      <span className="text-sm text-gray-700">{option}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Award className="w-5 h-5 text-orange-500" />
                <div>
                  <label className="block text-sm font-medium text-gray-700">Skill Level</label>
                  <p className="text-gray-900 capitalize">{profile.cooking_skill_level}</p>
                </div>
              </div>

              <div>
                <div className="flex items-center space-x-2 mb-2">
                  <Heart className="w-5 h-5 text-red-500" />
                  <label className="block text-sm font-medium text-gray-700">Dietary Restrictions</label>
                </div>
                {profile.dietary_restrictions.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {profile.dietary_restrictions.map((restriction) => (
                      <span
                        key={restriction}
                        className="bg-red-100 text-red-700 px-2 py-1 rounded-full text-xs font-medium"
                      >
                        {restriction}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 italic">None specified</p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Pantry Stats */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Kitchen Stats</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Pantry Items</span>
              <span className="text-2xl font-bold text-orange-500">
                {profile.pantry_items?.length || 0}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Dietary Restrictions</span>
              <span className="text-2xl font-bold text-red-500">
                {profile.dietary_restrictions.length}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Profile Created</span>
              <span className="text-sm text-gray-500">
                {new Date(profile.created_at).toLocaleDateString()}
              </span>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h2>
          <div className="space-y-3">
            <div className="flex items-center space-x-3 text-sm">
              <Clock className="w-4 h-4 text-gray-400" />
              <span className="text-gray-600">
                Profile updated {new Date(profile.updated_at).toLocaleDateString()}
              </span>
            </div>
            <div className="flex items-center space-x-3 text-sm">
              <ChefHat className="w-4 h-4 text-orange-400" />
              <span className="text-gray-600">
                {profile.pantry_items?.length || 0} ingredients in pantry
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons (when editing) */}
      {isEditing && (
        <div className="flex justify-end space-x-3 mt-6">
          <button
            onClick={handleCancel}
            className="flex items-center space-x-2 px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
          >
            <X size={16} />
            <span>Cancel</span>
          </button>
          <button
            onClick={handleSave}
            disabled={loading}
            className="flex items-center space-x-2 px-4 py-2 bg-orange-500 text-white rounded-md hover:bg-orange-600 disabled:opacity-50 transition-colors"
          >
            <Save size={16} />
            <span>{loading ? 'Saving...' : 'Save Changes'}</span>
          </button>
        </div>
      )}
    </div>
  );
}; 
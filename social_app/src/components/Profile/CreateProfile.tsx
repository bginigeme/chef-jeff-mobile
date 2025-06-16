import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { createProfile } from '../../supabase/database';

interface CreateProfileProps {
  onProfileComplete: () => void;
}

const CreateProfile: React.FC<CreateProfileProps> = ({ onProfileComplete }) => {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [dietaryRestrictions, setDietaryRestrictions] = useState<string[]>([]);
  const [skillLevel, setSkillLevel] = useState('beginner');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { user } = useAuth();

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) return;

    try {
      setLoading(true);
      setError('');

      await createProfile(user.id, user.email || '', {
        first_name: firstName,
        last_name: lastName,
        dietary_restrictions: dietaryRestrictions,
        cooking_skill_level: skillLevel,
      });

      onProfileComplete();
    } catch (error: any) {
      setError('Failed to create profile: ' + error.message);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-orange-100 flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-lg">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-orange-600 mb-2">Chef Jeff</h1>
          <h2 className="text-xl font-semibold text-gray-700">Create Your Profile</h2>
          <p className="text-gray-600 mt-2">Tell us about yourself to get personalized recipes!</p>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-gray-700 text-sm font-bold mb-2">
                First Name
              </label>
              <input
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>
            <div>
              <label className="block text-gray-700 text-sm font-bold mb-2">
                Last Name
              </label>
              <input
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2">
              Cooking Skill Level
            </label>
            <select
              value={skillLevel}
              onChange={(e) => setSkillLevel(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
            >
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
            </select>
          </div>

          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2">
              Dietary Restrictions (Optional)
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

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-orange-500 text-white py-3 px-4 rounded-md hover:bg-orange-600 disabled:opacity-50 transition duration-200 font-medium"
          >
            {loading ? 'Creating Profile...' : 'Create Profile'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default CreateProfile; 
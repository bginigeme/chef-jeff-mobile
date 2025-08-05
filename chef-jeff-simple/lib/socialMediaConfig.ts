// Social Media API Configuration
// In production, these should be stored securely in environment variables

export interface SocialMediaConfig {
  instagram: {
    apiKey?: string;
    apiUrl: string;
    fields: string[];
  };
  tiktok: {
    apiKey?: string;
    apiUrl: string;
  };
  twitter: {
    apiKey?: string;
    apiUrl: string;
  };
}

export const socialMediaConfig: SocialMediaConfig = {
  instagram: {
    apiKey: process.env.EXPO_PUBLIC_INSTAGRAM_API_KEY,
    apiUrl: 'https://graph.instagram.com',
    fields: ['id', 'caption', 'media_type', 'media_url', 'username', 'timestamp'],
  },
  tiktok: {
    apiKey: process.env.EXPO_PUBLIC_TIKTOK_API_KEY,
    apiUrl: 'https://api.tiktok.com',
  },
  twitter: {
    apiKey: process.env.EXPO_PUBLIC_TWITTER_API_KEY,
    apiUrl: 'https://api.twitter.com/2',
  },
};

// Deep linking configuration
export const deepLinkConfig = {
  scheme: 'chefjeff',
  host: 'share',
  path: '/recipe',
};

// Supported social media platforms
export const supportedPlatforms = [
  {
    name: 'Instagram',
    icon: '📷',
    urlPattern: /instagram\.com|instagr\.am/,
    apiKey: socialMediaConfig.instagram.apiKey,
  },
  {
    name: 'TikTok',
    icon: '🎵',
    urlPattern: /tiktok\.com/,
    apiKey: socialMediaConfig.tiktok.apiKey,
  },
  {
    name: 'X (Twitter)',
    icon: '🐦',
    urlPattern: /twitter\.com|x\.com/,
    apiKey: socialMediaConfig.twitter.apiKey,
  },
];

// API rate limiting configuration
export const rateLimitConfig = {
  requestsPerMinute: 60,
  requestsPerHour: 1000,
  retryAttempts: 3,
  retryDelay: 1000, // milliseconds
};

// Error messages
export const errorMessages = {
  invalidUrl: 'Please enter a valid social media link',
  unsupportedPlatform: 'This platform is not supported yet',
  apiError: 'Failed to fetch content from the platform',
  networkError: 'Network error. Please check your connection',
  rateLimitExceeded: 'Too many requests. Please try again later',
  noContentFound: 'No recipe content found in this post',
  extractionFailed: 'Failed to extract recipe information',
};

// Success messages
export const successMessages = {
  recipeExtracted: 'Recipe extracted successfully!',
  recipeSaved: 'Recipe saved to your cookbook',
  recipeShared: 'Recipe shared successfully',
}; 
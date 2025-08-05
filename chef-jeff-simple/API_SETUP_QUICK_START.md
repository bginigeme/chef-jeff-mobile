# Quick API Setup Guide

## What You Need to Do

### 1. Instagram API (Free) - Priority 1

**Step 1: Facebook Developer Account**
1. Go to [Facebook Developers](https://developers.facebook.com/)
2. Click "Get Started" and create a developer account
3. Create a new app (choose "Consumer" type)

**Step 2: Add Instagram Basic Display**
1. In your app dashboard, click "Add Product"
2. Find "Instagram Basic Display" and click "Set Up"
3. Add your Instagram account (Business or Creator account required)

**Step 3: Get Access Token**
1. Go to "Instagram Basic Display" → "Basic Display"
2. Add your Instagram account
3. Generate a long-lived access token
4. Copy the token

**Step 4: Add to Environment**
```bash
# Add to your .env file
EXPO_PUBLIC_INSTAGRAM_API_KEY=your_long_lived_access_token_here
```

### 2. TikTok API (Free via RapidAPI) - Priority 2

**Step 1: RapidAPI Account**
1. Go to [RapidAPI](https://rapidapi.com/)
2. Sign up for a free account

**Step 2: Subscribe to TikTok API**
1. Search for "TikTok Video No Watermark"
2. Click "Subscribe to Test"
3. Choose the free plan (usually 100 requests/month)
4. Copy your API key

**Step 3: Add to Environment**
```bash
# Add to your .env file
EXPO_PUBLIC_TIKTOK_API_KEY=your_rapidapi_key_here
```

### 3. Twitter/X (URL Only - No API)

Twitter/X will work with URL extraction only (no API calls needed). The app will detect Twitter/X links and use mock content.

## Testing Your Setup

### Test URLs to Try

**Instagram:**
```
https://www.instagram.com/p/EXAMPLE_POST_ID/
```

**TikTok:**
```
https://www.tiktok.com/@username/video/EXAMPLE_VIDEO_ID
```

**Twitter/X:**
```
https://twitter.com/username/status/EXAMPLE_TWEET_ID
```

## Environment File Setup

Create a `.env` file in your project root:

```bash
# OpenAI API (you already have this)
EXPO_PUBLIC_OPENAI_API_KEY=your_openai_key

# Instagram API
EXPO_PUBLIC_INSTAGRAM_API_KEY=your_instagram_token

# TikTok API (RapidAPI)
EXPO_PUBLIC_TIKTOK_API_KEY=your_rapidapi_key

# Twitter API (leave empty - using URL only)
EXPO_PUBLIC_TWITTER_API_KEY=
```

## What Happens Next

1. **With API Keys**: The app will fetch real content from Instagram and TikTok
2. **Without API Keys**: The app will use mock data (still works great for testing)
3. **Twitter/X**: Always uses URL detection with mock content

## Cost Breakdown

- **Instagram**: Free (200 requests/hour)
- **TikTok (RapidAPI)**: Free tier (100 requests/month)
- **Twitter/X**: Free (URL only, no API calls)

## Next Steps

1. Set up Instagram API first (easiest)
2. Set up TikTok API second
3. Test with real social media URLs
4. Create a development build to test everything

## Troubleshooting

### Instagram Issues
- Make sure you have a Business or Creator Instagram account
- Verify your app is in "Development" mode
- Check that your access token hasn't expired

### TikTok Issues
- Verify your RapidAPI subscription is active
- Check your API key is correct
- Monitor your request count (free tier limits)

### General Issues
- Restart your development server after adding environment variables
- Check the console for API error messages
- Verify URLs are from public posts 
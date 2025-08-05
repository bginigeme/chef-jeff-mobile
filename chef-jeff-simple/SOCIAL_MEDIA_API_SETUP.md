# Social Media API Setup Guide

This guide explains how to set up real API integrations for Instagram, TikTok, and X (Twitter) to extract recipe content from social media posts.

## Overview

Chef Jeff can extract recipe information from social media posts using real platform APIs. When APIs are not configured, the app falls back to mock data for demonstration purposes.

## Supported Platforms

- **Instagram** - Instagram Basic Display API
- **TikTok** - TikTok API (via third-party services)
- **X (Twitter)** - Twitter API v2

## Environment Variables

Add these environment variables to your `.env` file:

```bash
# Instagram Basic Display API
EXPO_PUBLIC_INSTAGRAM_API_KEY=your_instagram_access_token

# TikTok API (via RapidAPI or similar)
EXPO_PUBLIC_TIKTOK_API_KEY=your_tiktok_api_key

# Twitter API v2
EXPO_PUBLIC_TWITTER_API_KEY=your_twitter_bearer_token
```

## Platform-Specific Setup

### 1. Instagram Basic Display API

#### Prerequisites
- Facebook Developer Account
- Instagram Business or Creator Account
- Instagram App created in Facebook Developer Console

#### Setup Steps

1. **Create a Facebook App**
   - Go to [Facebook Developers](https://developers.facebook.com/)
   - Create a new app or use existing app
   - Add Instagram Basic Display product

2. **Configure Instagram Basic Display**
   - Add Instagram Basic Display to your app
   - Configure OAuth Redirect URIs
   - Set up app review if needed

3. **Get Access Token**
   - Use the Instagram Basic Display API to get user access tokens
   - Store the access token securely

4. **API Endpoints Used**
   ```
   GET https://graph.instagram.com/{post-id}?fields=id,caption,media_type,media_url,username,timestamp&access_token={access-token}
   ```

#### Rate Limits
- 200 requests per hour per user
- 100 requests per hour per app

### 2. TikTok API

#### Prerequisites
- TikTok Developer Account
- TikTok App created in developer console

#### Setup Steps

1. **Create TikTok App**
   - Go to [TikTok for Developers](https://developers.tiktok.com/)
   - Create a new app
   - Configure permissions for video data access

2. **Get API Credentials**
   - Generate client key and client secret
   - Set up OAuth flow for user authorization

3. **API Endpoints Used**
   ```
   GET https://api.tiktok.com/video/info/?video_id={video_id}&access_token={access_token}
   ```

#### Alternative: Third-Party Services
If direct TikTok API access is limited, consider using:
- RapidAPI TikTok API
- Social Blade API
- Other third-party TikTok data providers

### 3. X (Twitter) API v2

#### Prerequisites
- Twitter Developer Account
- Twitter App created in developer portal

#### Setup Steps

1. **Create Twitter App**
   - Go to [Twitter Developer Portal](https://developer.twitter.com/)
   - Create a new app
   - Apply for Elevated access (recommended)

2. **Get Bearer Token**
   - Generate Bearer Token in your app settings
   - Store securely in environment variables

3. **API Endpoints Used**
   ```
   GET https://api.twitter.com/2/tweets/{tweet_id}?expansions=author_id&user.fields=username&media.fields=url
   ```

#### Rate Limits
- 300 requests per 15-minute window (v2 API)
- 900 requests per 15-minute window (with Elevated access)

## Implementation Details

### API Integration Flow

1. **URL Validation**
   - Detect platform from URL
   - Validate URL format
   - Extract post/video ID

2. **Content Extraction**
   - Call platform-specific API
   - Handle rate limiting and errors
   - Fallback to mock data if API fails

3. **Recipe Generation**
   - Use AI to extract recipe from content
   - Parse ingredients and instructions
   - Generate structured recipe data

### Error Handling

The app includes comprehensive error handling:

- **API Errors**: Network issues, rate limits, invalid tokens
- **Content Errors**: No recipe content found, malformed data
- **Fallback**: Mock data when APIs are unavailable

### Rate Limiting

Implemented rate limiting to respect platform limits:

```typescript
const rateLimitConfig = {
  requestsPerMinute: 60,
  requestsPerHour: 1000,
  retryAttempts: 3,
  retryDelay: 1000,
};
```

## Testing

### Test URLs

Use these test URLs to verify API integration:

**Instagram:**
```
https://www.instagram.com/p/EXAMPLE_POST_ID/
```

**TikTok:**
```
https://www.tiktok.com/@username/video/EXAMPLE_VIDEO_ID
```

**Twitter:**
```
https://twitter.com/username/status/EXAMPLE_TWEET_ID
```

### Mock Data

When APIs are not configured, the app uses mock data with 5 different recipe types:
1. Hot Honey Garlic Chicken Tenders
2. Creamy Garlic Parmesan Pasta
3. One-Pan Mexican Rice
4. Homemade Margherita Pizza
5. Mediterranean Quinoa Bowl

## Security Considerations

### API Key Security
- Never commit API keys to version control
- Use environment variables for all API keys
- Rotate keys regularly
- Monitor API usage for unusual activity

### Data Privacy
- Only extract publicly available content
- Respect user privacy settings
- Comply with platform terms of service
- Implement proper data retention policies

## Troubleshooting

### Common Issues

1. **API Key Not Working**
   - Verify key is correct and active
   - Check if key has required permissions
   - Ensure key hasn't expired

2. **Rate Limit Exceeded**
   - Implement exponential backoff
   - Cache responses when possible
   - Monitor usage patterns

3. **Content Not Found**
   - Verify post is public
   - Check if post contains recipe content
   - Ensure URL format is correct

### Debug Mode

Enable debug logging by setting:
```typescript
console.log('🔗 [SOCIAL] Debug mode enabled');
```

## Production Deployment

### Environment Setup
1. Set all required environment variables
2. Configure API keys in EAS dashboard
3. Test with real social media URLs
4. Monitor API usage and costs

### Monitoring
- Track API response times
- Monitor error rates
- Set up alerts for rate limit issues
- Log API usage for billing

## Cost Considerations

### API Costs
- **Instagram**: Free (with rate limits)
- **TikTok**: Varies by provider
- **Twitter**: Free tier available, paid for higher limits

### Optimization
- Cache responses when possible
- Implement smart retry logic
- Use mock data for development
- Monitor and optimize API usage

## Future Enhancements

### Planned Features
- YouTube recipe extraction
- Pinterest recipe pins
- Facebook recipe posts
- Recipe video analysis
- Multi-language support

### API Improvements
- Batch processing for multiple posts
- Real-time content monitoring
- Advanced content filtering
- Machine learning for better extraction 
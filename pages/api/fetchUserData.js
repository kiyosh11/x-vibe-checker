import axios from 'axios';

const cache = new Map();
const CACHE_DURATION = 15 * 60 * 1000; 

export default async function handler(req, res) {
  const { username } = req.query;

  if (!username) {
    return res.status(400).json({ error: 'Username is required' });
  }

  const bearerToken = process.env.TWITTER_BEARER_TOKEN;

  if (!bearerToken) {
    return res.status(500).json({ error: 'Twitter API credentials are not configured' });
  }

  const cachedData = cache.get(username);
  if (cachedData && (Date.now() - cachedData.timestamp < CACHE_DURATION)) {
    return res.status(200).json(cachedData.data);
  }

  try {
    const response = await axios.get(
      `https://api.twitter.com/2/users/by/username/${username}`,
      {
        params: {
          'user.fields': 'description,public_metrics,profile_image_url,created_at,location,verified,url,entities',
        },
        headers: {
          'Authorization': `Bearer ${bearerToken}`,
          'User-Agent': 'VibeCheckerApp'
        }
      }
    );

    if (response.data.errors) {
      return res.status(404).json({ error: 'User not found or API error', details: response.data.errors });
    }

    const userData = response.data.data;
    
    const followRatio = userData.public_metrics.followers_count > 0 
      ? (userData.public_metrics.following_count / userData.public_metrics.followers_count).toFixed(2)
      : 0;

    const accountAge = Math.floor((new Date() - new Date(userData.created_at)) / (1000 * 60 * 60 * 24));
    const tweetsPerDay = (userData.public_metrics.tweet_count / accountAge).toFixed(2);

    const enrichedUserData = {
      ...userData,
      follow_ratio: followRatio,
      account_age_days: accountAge,
      tweets_per_day: tweetsPerDay,    
    };
    
    cache.set(username, { data: enrichedUserData, timestamp: Date.now() });

    res.status(200).json(enrichedUserData);
  } catch (error) {
    console.error('Error fetching user data:', error);
    if (error.response) {
      res.status(error.response.status).json({ 
        error: 'Error fetching user data', 
        details: error.response.data 
      });
    } else if (error.request) {
      res.status(503).json({ error: 'No response from Twitter API' });
    } else {
      res.status(500).json({ error: 'Error setting up request' });
    }
  }
}

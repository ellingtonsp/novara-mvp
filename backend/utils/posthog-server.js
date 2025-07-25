// PostHog Server-Side Client - Vercel Compliant Implementation
// Based on: https://posthog.com/docs/libraries/vercel

const { PostHog } = require('posthog-node');

// Vercel-optimized PostHog configuration
function createPostHogClient() {
  const apiKey = process.env.POSTHOG_API_KEY;
  
  if (!apiKey) {
    console.warn('⚠️ PostHog API key not found. Server-side tracking disabled.');
    return null;
  }

  return new PostHog(apiKey, {
    host: 'https://us.i.posthog.com',
    // Vercel serverless optimizations
    flushAt: 1,        // Flush immediately in serverless environment
    flushInterval: 0,  // Don't wait for interval-based flushing
    
    // Environment context
    defaultProperties: {
      environment: process.env.NODE_ENV || 'development',
      platform: 'server',
      deployment_type: 'railway'
    }
  });
}

// Global PostHog client instance
let posthogClient = null;

// Initialize PostHog client
function initializePostHog() {
  if (!posthogClient) {
    posthogClient = createPostHogClient();
    
    if (posthogClient) {
      console.log('✅ PostHog server-side client initialized');
    }
  }
  
  return posthogClient;
}

// Vercel-compliant event capture with immediate flushing
async function captureServerEvent(event, properties, userId = null) {
  const client = initializePostHog();
  
  if (!client) {
    console.debug('📊 PH-SERVER-DEV Event:', event, properties);
    return;
  }

  try {
    // Use captureImmediate to ensure events are sent before serverless function shuts down
    await client.captureImmediate({
      distinctId: userId || 'anonymous',
      event: event,
      properties: {
        ...properties,
        timestamp: new Date().toISOString(),
        server_side: true,
        // Add Vercel/Railway specific context
        platform: 'server',
        deployment_type: 'railway'
      }
    });

    console.log('📊 PostHog Server Event:', event, 'for user:', userId);
  } catch (error) {
    console.error('❌ Failed to track server event:', event, error);
  }
}

// Vercel-compliant user identification
async function identifyServerUser(userId, userProperties = {}) {
  const client = initializePostHog();
  
  if (!client) {
    console.debug('👤 PH-SERVER-DEV Identify:', userId, userProperties);
    return;
  }

  try {
    await client.captureImmediate({
      distinctId: userId,
      event: '$identify',
      properties: {
        $set: {
          ...userProperties,
          server_identified: true,
          identification_timestamp: new Date().toISOString()
        }
      }
    });

    console.log('👤 PostHog Server Identify:', userId);
  } catch (error) {
    console.error('❌ Failed to identify server user:', userId, error);
  }
}

// Proper shutdown for serverless environments
async function shutdownPostHog() {
  if (posthogClient) {
    try {
      await posthogClient.shutdown();
      console.log('🔄 PostHog server client shutdown completed');
    } catch (error) {
      console.error('❌ PostHog shutdown error:', error);
    }
  }
}

// AN-01 Event Tracking Functions (Server-Side)
async function trackServerSignup(userId, signupData) {
  await captureServerEvent('signup', {
    user_id: userId,
    signup_method: signupData.signup_method || 'email',
    referrer: signupData.referrer || null,
    experiment_variants: signupData.experiment_variants || []
  }, userId);
}

async function trackServerShareAction(userId, shareData) {
  await captureServerEvent('share_action', {
    user_id: userId,
    share_surface: shareData.share_surface,
    destination: shareData.destination,
    content_id: shareData.content_id || null
  }, userId);
}

async function trackServerInsightGenerated(userId, insightData) {
  await captureServerEvent('insight_generated', {
    user_id: userId,
    insight_id: insightData.insight_id,
    insight_type: insightData.insight_type,
    generation_time_ms: insightData.generation_time_ms || null
  }, userId);
}

// Express middleware for automatic PostHog shutdown on response end
function posthogMiddleware() {
  return (req, res, next) => {
    // Initialize PostHog for this request
    initializePostHog();
    
    // Ensure PostHog shuts down properly after response
    const originalEnd = res.end;
    res.end = function(...args) {
      // Use setImmediate to ensure response is sent before shutdown
      setImmediate(async () => {
        await shutdownPostHog();
      });
      
      return originalEnd.apply(this, args);
    };
    
    next();
  };
}

module.exports = {
  initializePostHog,
  captureServerEvent,
  identifyServerUser,
  shutdownPostHog,
  trackServerSignup,
  trackServerShareAction,
  trackServerInsightGenerated,
  posthogMiddleware
}; 
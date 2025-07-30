/**
 * Airtable Request Utility
 * Centralized Airtable API requests
 */

const config = require('../config');
const logger = require('./logger');

/**
 * Make request to Airtable API
 */
async function airtableRequest(endpoint, method = 'GET', data = null) {
  const url = endpoint.startsWith('http') 
    ? endpoint 
    : `${config.airtable.baseUrl}/${endpoint}`;
    
  const options = {
    method,
    headers: {
      'Authorization': `Bearer ${config.airtable.apiKey}`,
      'Content-Type': 'application/json'
    }
  };
  
  if (data && method !== 'GET') {
    options.body = JSON.stringify(data);
  }
  
  try {
    logger.airtable(method, endpoint, { url });
    const response = await fetch(url, options);
    const result = await response.json();
    
    if (!response.ok) {
      logger.error(new Error(`Airtable error: ${result.error?.message || 'Unknown error'}`), null, {
        status: response.status,
        endpoint,
        method
      });
      
      throw new Error(`Airtable error: ${result.error?.message || response.statusText}`);
    }
    
    return result;
  } catch (error) {
    logger.error(error, null, { endpoint, method });
    throw error;
  }
}

module.exports = airtableRequest;
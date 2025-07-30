#!/usr/bin/env node

/**
 * Fix check-in submission to use PostgreSQL when configured
 */

const fs = require('fs');
const path = require('path');

const serverPath = path.join(__dirname, '../server.js');
let serverContent = fs.readFileSync(serverPath, 'utf8');

// Find the check-in POST endpoint
const checkInEndpointRegex = /app\.post\('\/api\/checkins', authenticateToken, async \(req, res\) => \{[\s\S]*?try \{[\s\S]*?console\.log\('📝 Daily check-in submission received:', req\.body\);/;

const match = serverContent.match(checkInEndpointRegex);

if (match) {
  console.log('✅ Found check-in POST endpoint');
  
  // Insert PostgreSQL handling right after the console.log
  const postgresHandling = `
    console.log('📝 Daily check-in submission received:', req.body);
    
    // Handle PostgreSQL database
    if (databaseAdapter.isPostgres) {
      console.log('🐘 Using PostgreSQL for check-in creation');
      try {
        const user = await databaseAdapter.localDb.findUserByEmail(req.user.email);
        if (!user) {
          return res.status(404).json({ 
            success: false, 
            error: 'User not found. Please sign up first.' 
          });
        }
        
        // Extract check-in data
        const { 
          mood_today, 
          primary_concern_today, 
          confidence_today, 
          user_note,
          date_submitted,
          sentiment_analysis,
          medication_taken,
          ...additionalFormFields
        } = req.body;
        
        // Validation
        if (!mood_today || !confidence_today) {
          return res.status(400).json({ 
            success: false, 
            error: 'Missing required fields: mood_today and confidence_today are required' 
          });
        }
        
        if (confidence_today < 1 || confidence_today > 10) {
          return res.status(400).json({ 
            success: false, 
            error: 'confidence_today must be between 1 and 10' 
          });
        }
        
        // Prepare check-in data
        const checkinData = {
          user_id: user.id,
          mood_today,
          confidence_today: parseInt(confidence_today),
          date_submitted: date_submitted || new Date().toISOString().split('T')[0],
          primary_concern_today,
          user_note,
          medication_taken,
          ...additionalFormFields
        };
        
        // Create check-in using PostgreSQL adapter
        const result = await databaseAdapter.localDb.createCheckin(checkinData);
        
        console.log('✅ Check-in created successfully:', result.id);
        
        // Return response
        const responseData = {
          success: true,
          checkin: {
            id: result.id,
            mood_today: result.fields?.mood_today || checkinData.mood_today,
            confidence_today: result.fields?.confidence_today || checkinData.confidence_today,
            date_submitted: result.fields?.date_submitted || checkinData.date_submitted,
            medication_taken: result.fields?.medication_taken || checkinData.medication_taken,
            created_at: result.fields?.created_at || new Date().toISOString()
          },
          message: sentiment_analysis?.sentiment === 'positive' 
            ? 'Daily check-in completed successfully! We love your positive energy today! 🎉' 
            : 'Daily check-in completed successfully! 🌟'
        };
        
        if (sentiment_analysis) {
          responseData.sentiment_analysis = {
            sentiment: sentiment_analysis.sentiment,
            confidence: sentiment_analysis.confidence,
            celebration_triggered: sentiment_analysis.sentiment === 'positive'
          };
        }
        
        return res.status(201).json(responseData);
        
      } catch (error) {
        console.error('❌ PostgreSQL check-in error:', error);
        return res.status(500).json({ 
          success: false, 
          error: 'Internal server error',
          details: error.message
        });
      }
    }
    
    // Continue with Airtable logic`;
  
  // Replace the match with the new code
  serverContent = serverContent.replace(
    'console.log(\'📝 Daily check-in submission received:\', req.body);',
    postgresHandling
  );
  
  fs.writeFileSync(serverPath, serverContent);
  console.log('✅ Added PostgreSQL handling to check-in endpoint');
  console.log('📝 The check-in endpoint now:');
  console.log('  1. Checks if PostgreSQL is configured');
  console.log('  2. Uses PostgreSQL adapter for check-in creation');
  console.log('  3. Returns properly formatted response');
  console.log('  4. Falls back to Airtable if PostgreSQL not configured');
} else {
  console.error('❌ Could not find check-in POST endpoint');
}
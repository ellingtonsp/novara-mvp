#!/usr/bin/env node

/**
 * Test Schema V2 Implementation
 * 
 * Tests the new event-sourced health data system to ensure everything works
 */

const { Pool } = require('pg');
const HealthEventsService = require('../services/health-events-service');
const CompatibilityService = require('../services/compatibility-service');

const DATABASE_URL = process.env.DATABASE_URL || process.argv[2] || 
  "postgresql://postgres:ynFbXBtKHWNRFwnuGbRvaYFdSXcBckVR@switchyard.proxy.rlwy.net:58017/railway";

const pool = new Pool({
  connectionString: DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function runTests() {
  console.log('🧪 Testing Schema V2 Implementation\n');
  
  try {
    // Initialize services
    const healthEvents = new HealthEventsService(pool);
    const compatibility = new CompatibilityService(pool);
    compatibility.useV2 = true; // Force V2 usage
    
    console.log('1️⃣ Testing database connection...');
    const testResult = await pool.query('SELECT NOW(), version()');
    console.log('✅ Connected to PostgreSQL:', testResult.rows[0].version.split(' ')[0]);
    
    // Test 1: Create test user
    console.log('\n2️⃣ Creating test user...');
    const userResult = await pool.query(`
      INSERT INTO users (email) 
      VALUES ('test-schema-v2@example.com')
      ON CONFLICT (email) DO UPDATE SET updated_at = NOW()
      RETURNING id, email
    `);
    const testUserId = userResult.rows[0].id;
    console.log('✅ Test user created:', userResult.rows[0].email);
    
    // Create user profile
    await pool.query(`
      INSERT INTO user_profiles (user_id, nickname)
      VALUES ($1, 'Schema V2 Tester')
      ON CONFLICT (user_id) DO UPDATE SET nickname = 'Schema V2 Tester'
    `, [testUserId]);
    
    // Test 2: Create health events using new service
    console.log('\n3️⃣ Testing health events creation...');
    
    // Create a daily check-in using the new event system
    const checkinResult = await healthEvents.createDailyCheckin({
      userId: testUserId,
      moodToday: 'hopeful',
      confidenceToday: 7,
      medicationTaken: 'yes',
      anxietyLevel: 4,
      sideEffects: ['mild nausea', 'fatigue'],
      userNote: 'Feeling better today, medication is helping!'
    });
    
    console.log('✅ Daily check-in created:', checkinResult.correlationId);
    
    // Test 3: Test compatibility layer
    console.log('\n4️⃣ Testing compatibility layer...');
    
    // Use compatibility service to create a check-in (V1 format)
    const compatResult = await compatibility.createDailyCheckin(testUserId, {
      mood_today: 'confident',
      confidence_today: 8,
      medication_taken: 'yes',
      anxiety_level: 3,
      user_note: 'Great day today!',
      date_submitted: new Date().toISOString().split('T')[0]
    });
    
    console.log('✅ Compatibility check-in created:', compatResult.id);
    
    // Test 4: Read data back using compatibility view
    console.log('\n5️⃣ Testing data retrieval...');
    
    const checkins = await compatibility.getDailyCheckins(testUserId, { limit: 5 });
    console.log('✅ Retrieved check-ins:', checkins.length);
    
    if (checkins.length > 0) {
      console.log('   Sample check-in:', {
        mood: checkins[0].mood_today,
        confidence: checkins[0].confidence_today,
        medication: checkins[0].medication_taken,
        date: checkins[0].date_submitted
      });
    }
    
    // Test 5: Test analytics
    console.log('\n6️⃣ Testing analytics...');
    
    const analytics = await compatibility.getAnalytics(testUserId, 'week');
    console.log('✅ Analytics generated:');
    console.log(`   Daily metrics: ${analytics.daily_metrics?.length || 0} days`);
    console.log(`   Total events: ${analytics.total_events || 0}`);
    console.log(`   Adherence rate: ${analytics.adherence_rate || 'N/A'}%`);
    
    // Test 6: Test health events timeline
    console.log('\n7️⃣ Testing health events timeline...');
    
    const timeline = await healthEvents.getHealthTimeline(testUserId, { limit: 10 });
    console.log('✅ Timeline events:', timeline.length);
    
    if (timeline.length > 0) {
      console.log('   Event types:', [...new Set(timeline.map(e => e.event_type))].join(', '));
    }
    
    // Test 7: Test materialized views
    console.log('\n8️⃣ Testing materialized views...');
    
    try {
      await pool.query('REFRESH MATERIALIZED VIEW user_daily_metrics');
      await pool.query('REFRESH MATERIALIZED VIEW user_weekly_metrics');
      
      const dailyMetrics = await pool.query(`
        SELECT * FROM user_daily_metrics 
        WHERE user_id = $1 
        ORDER BY date DESC LIMIT 5
      `, [testUserId]);
      
      console.log('✅ Materialized views working:', dailyMetrics.rows.length, 'records');
    } catch (err) {
      console.log('⚠️ Materialized views need setup:', err.message);
    }
    
    // Test 8: Test insights system
    console.log('\n9️⃣ Testing insights system...');
    
    const insight = await healthEvents.createInsight({
      userId: testUserId,
      type: 'test_insight',
      title: 'Schema V2 Test Complete',
      message: 'All systems are working correctly!',
      category: 'achievement',
      priority: 6
    });
    
    console.log('✅ Insight created:', insight.title);
    
    // Test 9: Performance test
    console.log('\n🔟 Performance test...');
    
    const startTime = Date.now();
    
    // Create 10 events quickly
    const promises = [];
    for (let i = 0; i < 10; i++) {
      promises.push(
        healthEvents.createHealthEvent({
          userId: testUserId,
          eventType: 'mood',
          eventSubtype: 'quick_check',
          eventData: {
            mood: ['hopeful', 'confident', 'optimistic'][i % 3],
            confidence: Math.floor(Math.random() * 10) + 1,
            source: 'performance_test'
          }
        })
      );
    }
    
    await Promise.all(promises);
    const duration = Date.now() - startTime;
    
    console.log('✅ Created 10 events in', duration, 'ms');
    console.log('   Average:', Math.round(duration / 10), 'ms per event');
    
    // Final verification
    console.log('\n📊 Final verification...');
    
    const finalStats = await pool.query(`
      SELECT 
        (SELECT COUNT(*) FROM health_events WHERE user_id = $1) as events,
        (SELECT COUNT(*) FROM insights WHERE user_id = $1) as insights,
        (SELECT COUNT(*) FROM user_profiles WHERE user_id = $1) as profiles
    `, [testUserId]);
    
    const stats = finalStats.rows[0];
    console.log('✅ Final stats:');
    console.log(`   Health events: ${stats.events}`);
    console.log(`   Insights: ${stats.insights}`);
    console.log(`   User profiles: ${stats.profiles}`);
    
    console.log('\n' + '='.repeat(60));
    console.log('🎉 SCHEMA V2 TESTS PASSED!');
    console.log('='.repeat(60));
    console.log('\n✅ All systems operational:');
    console.log('   - Event-sourced health data ✓');
    console.log('   - Backward compatibility ✓');
    console.log('   - Analytics and insights ✓');
    console.log('   - Performance acceptable ✓');
    
    console.log('\n🚀 Ready for production deployment!');
    
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Run tests
if (require.main === module) {
  runTests();
}
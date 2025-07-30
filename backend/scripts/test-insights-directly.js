#!/usr/bin/env node

const PostgresAdapter = require('../database/postgres-adapter');

process.env.USE_SCHEMA_V2 = 'true';
const db = new PostgresAdapter("postgresql://postgres:ynFbXBtKHWNRFwnuGbRvaYFdSXcBckVR@switchyard.proxy.rlwy.net:58017/railway");

async function testDirectly() {
  try {
    // Test findUserById
    const userId = '08d84601-5f0c-4384-b71a-0751edf9b508';
    console.log('Testing findUserById with:', userId);
    
    const user = await db.findUserById(userId);
    console.log('User found:', {
      id: user?.id,
      email: user?.email,
      nickname: user?.nickname,
      baseline_completed: user?.baseline_completed
    });
    
    // Test if user is suitable for insights
    const hasCompletedOnboarding = !!user?.baseline_completed || 
                                  (user?.onboarding_path === 'control' && 
                                   user?.primary_need && 
                                   user?.cycle_stage) ||
                                  (user?.confidence_meds && user?.confidence_costs && 
                                   user?.confidence_overall && user?.primary_need && 
                                   user?.cycle_stage);
    
    console.log('Has completed onboarding:', hasCompletedOnboarding);
    
    // Get check-ins
    const checkins = await db.getUserCheckins(userId, 7);
    console.log('Check-ins found:', checkins.records?.length);
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await db.close();
  }
}

testDirectly();
# UM-01: User Metrics Dashboard

## Overview
The User Metrics Dashboard provides real-time, personalized metrics about a user's IVF journey, replacing static mock data with dynamically calculated insights based on their check-in history. This feature transforms raw tracking data into actionable insights about medication adherence, mental health trends, and success probability.

## Problem Statement
Users were seeing static mock data (88% adherence, PHQ-4 score of 4, etc.) regardless of their actual journey data. This reduced trust and failed to provide value from their daily tracking efforts.

## Solution
Created a comprehensive metrics calculation engine that:
- Analyzes check-in history in real-time
- Calculates medication adherence rates
- Approximates PHQ-4 mental health scores
- Tracks engagement patterns
- Identifies risk and protective factors
- Provides cycle completion probability

## Key Components
1. **Backend**: `/api/users/metrics` endpoint
2. **Frontend**: `OutcomeMetricsDashboard` component
3. **Empty State**: Onboarding UI for new users
4. **Calculations**: Evidence-based algorithms

## Impact
- **Trust**: Real data builds user confidence
- **Motivation**: Seeing improvements drives engagement  
- **Insights**: Identifies areas needing attention
- **Value**: Justifies daily tracking effort

## Related Epic
- **Epic**: UM (User Metrics)
- **Story**: Provide transparent outcome tracking
- **Priority**: High (core value proposition)

## Success Metrics
- 100% of users see real calculated data
- <2s load time for metrics
- 80%+ users find metrics valuable (survey)
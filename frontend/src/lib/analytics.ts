import React from 'react';
import ReactGA from 'react-ga4';
import { Analytics } from '@vercel/analytics/react';

// Initialize Google Analytics
export const initGA = (measurementId: string) => {
  if (typeof window !== 'undefined' && measurementId) {
    ReactGA.initialize(measurementId);
    console.log('Google Analytics initialized');
  }
};

// Track page views
export const trackPageView = (path: string) => {
  if (typeof window !== 'undefined') {
    ReactGA.send({ hitType: 'pageview', page: path });
  }
};

// Track custom events
export const trackEvent = (category: string, action: string, label?: string, value?: number) => {
  if (typeof window !== 'undefined') {
    ReactGA.event({
      category,
      action,
      label,
      value,
    });
  }
};

// Track user engagement
export const trackUserEngagement = (action: string, details?: any) => {
  trackEvent('User Engagement', action, JSON.stringify(details));
};

// Track form submissions
export const trackFormSubmission = (formName: string, success: boolean) => {
  trackEvent('Form Submission', formName, success ? 'success' : 'error');
};

// Track authentication events
export const trackAuthEvent = (action: 'login' | 'register' | 'logout', success: boolean) => {
  trackEvent('Authentication', action, success ? 'success' : 'error');
};

// Track daily check-ins
export const trackDailyCheckin = (mood: string, energy: number) => {
  trackEvent('Daily Check-in', 'submitted', mood, energy);
};

// Track insights generation
export const trackInsightGeneration = (insightType: string) => {
  trackEvent('Insights', 'generated', insightType);
};

// Analytics component for Vercel
export const AnalyticsWrapper = () => {
  return React.createElement(Analytics);
};

// Environment-based analytics configuration
export const getAnalyticsConfig = () => {
  const isProduction = import.meta.env.PROD;
  const gaMeasurementId = import.meta.env.VITE_GA_MEASUREMENT_ID;
  
  return {
    isProduction,
    gaMeasurementId,
    shouldTrack: isProduction && gaMeasurementId,
  };
}; 
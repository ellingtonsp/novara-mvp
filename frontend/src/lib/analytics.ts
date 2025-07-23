// lib/analytics.ts - FVM Event Tracking

export interface FVMEventData {
  // Onboarding events
  confidence_scores?: {
    meds: number;
    costs: number;
    overall: number;
  };
  primary_need?: string;
  cycle_stage?: string;
  top_concern?: string;
  
  // Insight events
  insight_type?: string;
  insight_id?: string;
  insight_title?: string;
  action_clicked?: string;
  
  // Check-in events
  mood_selected?: string[];
  confidence_level?: number;
  concern_mentioned?: boolean;
  
  // Feedback events
  feedback_type?: 'helpful' | 'not_helpful';
  feedback_context?: 'onboarding' | 'checkin' | 'daily_insight';
}

// Track FVM Events
export async function trackFVMEvent(
  eventType: 'onboarding_complete' | 'insight_delivered' | 'insight_opened' | 'insight_clicked' | 'check_in_completed' | 'feedback_submitted',
  eventData: FVMEventData = {}
): Promise<void> {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      console.warn('No auth token found, skipping analytics');
      return;
    }

    const response = await fetch('http://localhost:3000/api/analytics/events', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        event_type: eventType,
        event_data: eventData
      })
    });

    if (!response.ok) {
      console.warn('Analytics tracking failed:', response.statusText);
    } else {
      console.log(`✅ FVM Event tracked: ${eventType}`);
    }
  } catch (error) {
    console.warn('Analytics tracking error:', error);
  }
}

// Convenience functions for specific FVM events
export const FVMAnalytics = {
  // Track successful onboarding completion
  onboardingComplete: (userProfile: {
    confidence_meds: number;
    confidence_costs: number;
    confidence_overall: number;
    primary_need?: string;
    cycle_stage?: string;
    top_concern?: string;
  }) => {
    trackFVMEvent('onboarding_complete', {
      confidence_scores: {
        meds: userProfile.confidence_meds,
        costs: userProfile.confidence_costs,
        overall: userProfile.confidence_overall
      },
      primary_need: userProfile.primary_need,
      cycle_stage: userProfile.cycle_stage,
      top_concern: userProfile.top_concern
    });
  },

  // Track when micro-insight is successfully delivered
  insightDelivered: (insightType: string, insightTitle: string, insightId?: string) => {
    trackFVMEvent('insight_delivered', {
      insight_type: insightType,
      insight_title: insightTitle,
      insight_id: insightId
    });
  },

  // Track when user opens/views insight modal
  insightOpened: (insightType: string, insightId?: string) => {
    trackFVMEvent('insight_opened', {
      insight_type: insightType,
      insight_id: insightId
    });
  },

  // Track when user clicks insight action button
  insightClicked: (insightType: string, actionClicked: string, insightId?: string) => {
    trackFVMEvent('insight_clicked', {
      insight_type: insightType,
      action_clicked: actionClicked,
      insight_id: insightId
    });
  },

  // Track successful check-in completion
  checkInCompleted: (moods: string[], confidence: number, hasConcern: boolean) => {
    trackFVMEvent('check_in_completed', {
      mood_selected: moods,
      confidence_level: confidence,
      concern_mentioned: hasConcern
    });
  },

  // Track feedback submission
  feedbackSubmitted: (feedbackType: 'helpful' | 'not_helpful', context: 'onboarding' | 'checkin' | 'daily_insight') => {
    trackFVMEvent('feedback_submitted', {
      feedback_type: feedbackType,
      feedback_context: context
    });
  }
}; 
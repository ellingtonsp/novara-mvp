// Enhanced Checklist Logic - Personalized based on user data and check-in patterns
import { ChecklistItem } from './checklistMapping';
import { User } from '../contexts/AuthContext';

export interface UserContext {
  user: User;
  recentMoods?: string[];
  recentConcerns?: string[];
  lastConfidence?: number;
  checkInStreak?: number;
  upcomingAppointmentType?: string;
}

export interface EnhancedChecklistItem extends ChecklistItem {
  priority: 'high' | 'medium' | 'low';
  personalizedReason?: string;
  isContextual?: boolean;
}

// Mood-based checklist recommendations
const MOOD_BASED_ITEMS: Record<string, Partial<EnhancedChecklistItem>[]> = {
  anxious: [
    {
      id: 'anxiety_breathing',
      title: 'Practice 5-minute breathing exercise',
      description: 'Try the 4-7-8 technique before your appointment to calm nerves',
      category: 'comfort',
      priority: 'high',
      personalizedReason: 'You mentioned feeling anxious recently'
    },
    {
      id: 'anxiety_questions',
      title: 'Write down your worries as questions',
      description: 'Convert anxious thoughts into specific questions for your doctor',
      category: 'questions',
      priority: 'high'
    }
  ],
  overwhelmed: [
    {
      id: 'overwhelm_simplify',
      title: 'Pick your top 3 priorities for this visit',
      description: 'Focus on what matters most to avoid information overload',
      category: 'questions',
      priority: 'high',
      personalizedReason: 'Feeling overwhelmed is normal - let\'s simplify'
    },
    {
      id: 'overwhelm_support',
      title: 'Bring a support person or recording app',
      description: 'Having backup helps you remember important details',
      category: 'logistics',
      priority: 'medium'
    }
  ],
  frustrated: [
    {
      id: 'frustration_advocate',
      title: 'Prepare your advocacy statements',
      description: 'Practice saying "I need..." or "Can we discuss..." phrases',
      category: 'questions',
      priority: 'high',
      personalizedReason: 'Your frustration is valid - let\'s channel it productively'
    }
  ],
  hopeful: [
    {
      id: 'hope_celebrate',
      title: 'Acknowledge your progress',
      description: 'Take a moment to recognize how far you\'ve come',
      category: 'comfort',
      priority: 'low',
      personalizedReason: 'Riding the wave of hope!'
    }
  ],
  tired: [
    {
      id: 'tired_energy',
      title: 'Plan for low energy',
      description: 'Schedule appointment for your best time of day if possible',
      category: 'logistics',
      priority: 'high',
      personalizedReason: 'Fatigue is real - let\'s work with it'
    }
  ]
};

// Concern-based checklist items
const CONCERN_BASED_ITEMS: Record<string, Partial<EnhancedChecklistItem>[]> = {
  medication_side_effects: [
    {
      id: 'side_effects_log',
      title: 'Document side effects with timestamps',
      description: 'Note when symptoms occur relative to medication timing',
      category: 'medical',
      priority: 'high',
      personalizedReason: 'Your side effects concern needs attention'
    }
  ],
  financial_stress: [
    {
      id: 'financial_options',
      title: 'Ask about payment plans or assistance',
      description: 'Many clinics have financial counselors - request a meeting',
      category: 'logistics',
      priority: 'high',
      personalizedReason: 'Financial stress shouldn\'t stop your care'
    },
    {
      id: 'insurance_coverage',
      title: 'Bring insurance questions list',
      description: 'Ask about coverage for upcoming procedures and medications',
      category: 'questions',
      priority: 'high'
    }
  ],
  emotional_support: [
    {
      id: 'support_resources',
      title: 'Ask about counseling resources',
      description: 'Many clinics offer mental health support for IVF patients',
      category: 'questions',
      priority: 'medium',
      personalizedReason: 'Your emotional wellbeing matters'
    }
  ],
  treatment_timeline: [
    {
      id: 'timeline_clarity',
      title: 'Request a visual timeline',
      description: 'Ask for a calendar view of your treatment plan',
      category: 'questions',
      priority: 'high',
      personalizedReason: 'Let\'s get clarity on your timeline'
    }
  ]
};

// Confidence-based adjustments
const getConfidenceAdjustedItems = (confidence: number): Partial<EnhancedChecklistItem>[] => {
  if (confidence <= 3) {
    return [
      {
        id: 'low_confidence_support',
        title: 'Consider bringing a trusted advocate',
        description: 'Having support can boost your confidence in appointments',
        category: 'comfort',
        priority: 'high',
        personalizedReason: 'Low confidence days need extra support'
      },
      {
        id: 'low_confidence_prep',
        title: 'Practice your main questions out loud',
        description: 'Rehearsing helps you feel more prepared and confident',
        category: 'questions',
        priority: 'medium'
      }
    ];
  } else if (confidence >= 8) {
    return [
      {
        id: 'high_confidence_advocate',
        title: 'Use your confidence to advocate',
        description: 'This is a great day to discuss any concerns openly',
        category: 'questions',
        priority: 'medium',
        personalizedReason: 'You\'re feeling strong - use it!'
      }
    ];
  }
  return [];
};

// Cycle stage specific enhancements
const getCycleStageEnhancements = (cycleStage: string, context: UserContext): Partial<EnhancedChecklistItem>[] => {
  const items: Partial<EnhancedChecklistItem>[] = [];

  // Add specific items based on cycle stage + context
  if (cycleStage === 'stimulation' && context.recentMoods?.includes('anxious')) {
    items.push({
      id: 'stim_anxiety_specific',
      title: 'Ask about stimulation adjustments',
      description: 'Discuss if anxiety might be medication-related',
      category: 'medical',
      priority: 'high',
      personalizedReason: 'Stimulation can affect mood - let\'s address it'
    });
  }

  if (cycleStage === 'retrieval' && context.lastConfidence && context.lastConfidence < 5) {
    items.push({
      id: 'retrieval_confidence',
      title: 'Review retrieval day logistics in detail',
      description: 'Understanding the process can reduce anxiety',
      category: 'medical',
      priority: 'high',
      personalizedReason: 'Knowledge builds confidence for retrieval'
    });
  }

  if (cycleStage === 'tww' && context.recentMoods?.includes('overwhelmed')) {
    items.push({
      id: 'tww_overwhelm',
      title: 'Ask about symptom expectations',
      description: 'Get clarity on what\'s normal during the wait',
      category: 'medical',
      priority: 'medium',
      personalizedReason: 'The TWW is tough - let\'s get facts'
    });
  }

  return items;
};

// Main function to generate enhanced checklist
export function generateEnhancedChecklist(
  baseItems: ChecklistItem[],
  context: UserContext
): EnhancedChecklistItem[] {
  const enhancedItems: EnhancedChecklistItem[] = [];
  const addedIds = new Set<string>();

  // Start with base items, enhanced with priority
  baseItems.forEach(item => {
    enhancedItems.push({
      ...item,
      priority: 'medium' as const
    });
    addedIds.add(item.id);
  });

  // Add mood-based items
  if (context.recentMoods && context.recentMoods.length > 0) {
    const dominantMood = context.recentMoods[0]; // Most recent mood
    const moodItems = MOOD_BASED_ITEMS[dominantMood] || [];
    
    moodItems.forEach(item => {
      if (!addedIds.has(item.id!)) {
        enhancedItems.push({
          ...item,
          isContextual: true
        } as EnhancedChecklistItem);
        addedIds.add(item.id!);
      }
    });
  }

  // Add concern-based items
  if (context.recentConcerns && context.recentConcerns.length > 0) {
    context.recentConcerns.forEach(concern => {
      const concernItems = CONCERN_BASED_ITEMS[concern] || [];
      concernItems.forEach(item => {
        if (!addedIds.has(item.id!)) {
          enhancedItems.push({
            ...item,
            isContextual: true
          } as EnhancedChecklistItem);
          addedIds.add(item.id!);
        }
      });
    });
  }

  // Add confidence-based items
  if (context.lastConfidence !== undefined) {
    const confidenceItems = getConfidenceAdjustedItems(context.lastConfidence);
    confidenceItems.forEach(item => {
      if (!addedIds.has(item.id!)) {
        enhancedItems.push({
          ...item,
          isContextual: true
        } as EnhancedChecklistItem);
        addedIds.add(item.id!);
      }
    });
  }

  // Add cycle stage specific enhancements
  if (context.user.cycle_stage) {
    const stageItems = getCycleStageEnhancements(context.user.cycle_stage, context);
    stageItems.forEach(item => {
      if (!addedIds.has(item.id!)) {
        enhancedItems.push({
          ...item,
          isContextual: true
        } as EnhancedChecklistItem);
        addedIds.add(item.id!);
      }
    });
  }

  // Sort by priority
  return enhancedItems.sort((a, b) => {
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    return priorityOrder[a.priority] - priorityOrder[b.priority];
  });
}

// Helper to get recent user patterns
export async function getUserContext(user: User): Promise<UserContext> {
  try {
    // Import apiClient dynamically to avoid circular dependencies
    const { apiClient } = await import('./api');
    
    // Fetch recent check-ins (last 7 days)
    const checkinsResponse = await apiClient.getRecentCheckins(7);
    
    if (!checkinsResponse.success || !checkinsResponse.data) {
      // Fallback to user's baseline data if no check-ins
      return {
        user,
        recentMoods: [],
        recentConcerns: user.top_concern ? [user.top_concern] : [],
        lastConfidence: user.confidence_overall || 5,
        checkInStreak: 0
      };
    }
    
    // Handle API response - it might be wrapped in an object
    const checkins = Array.isArray(checkinsResponse.data) 
      ? checkinsResponse.data 
      : checkinsResponse.data?.checkins || [];
    
    // Extract recent moods (last 3 check-ins)
    const recentMoods = checkins
      .slice(0, 3)
      .map((checkin: any) => {
        // mood_today is a comma-separated string
        const moods = checkin.mood_today?.split(',').map((m: string) => m.trim()) || [];
        return moods[0]; // Take primary mood
      })
      .filter(Boolean);
    
    // Extract recent concerns
    const recentConcerns = checkins
      .slice(0, 3)
      .map((checkin: any) => checkin.primary_concern_today)
      .filter(Boolean);
    
    // Get last confidence score
    const lastConfidence = checkins.length > 0 
      ? checkins[0].confidence_today 
      : user.confidence_overall || 5;
    
    // Calculate check-in streak
    const checkInStreak = calculateStreak(checkins);
    
    return {
      user,
      recentMoods,
      recentConcerns,
      lastConfidence,
      checkInStreak
    };
  } catch (error) {
    console.error('Failed to fetch user context:', error);
    // Return safe defaults on error
    return {
      user,
      recentMoods: [],
      recentConcerns: user.top_concern ? [user.top_concern] : [],
      lastConfidence: user.confidence_overall || 5,
      checkInStreak: 0
    };
  }
}

// Helper to calculate check-in streak
function calculateStreak(checkinsData: any): number {
  // Handle different response formats
  const checkins = Array.isArray(checkinsData) 
    ? checkinsData 
    : checkinsData?.checkins || [];
    
  if (!checkins || checkins.length === 0) return 0;
  
  let streak = 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  // Sort checkins by date (newest first)
  const sortedCheckins = [...checkins].sort((a, b) => 
    new Date(b.date_submitted).getTime() - new Date(a.date_submitted).getTime()
  );
  
  for (let i = 0; i < sortedCheckins.length; i++) {
    const checkinDate = new Date(sortedCheckins[i].date_submitted);
    checkinDate.setHours(0, 0, 0, 0);
    
    const daysDiff = Math.floor((today.getTime() - checkinDate.getTime()) / (1000 * 60 * 60 * 24));
    
    // If the check-in is from today or yesterday (accounting for streak)
    if (daysDiff === i) {
      streak++;
    } else {
      break; // Streak is broken
    }
  }
  
  return streak;
}

// Smart suggestions based on patterns
export function getSmartSuggestions(context: UserContext): string[] {
  const suggestions: string[] = [];

  // Mood pattern suggestions
  const moodCounts = context.recentMoods?.reduce((acc, mood) => {
    acc[mood] = (acc[mood] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  if (moodCounts?.anxious >= 2) {
    suggestions.push('I noticed anxiety in your recent check-ins. Consider discussing anxiety management strategies with your care team');
  }
  
  if (moodCounts?.overwhelmed >= 2) {
    suggestions.push('Feeling overwhelmed is showing up frequently. Breaking tasks into smaller steps might help');
  }
  
  if (moodCounts?.frustrated >= 2) {
    suggestions.push('Your frustration is valid. Consider preparing specific questions about what\'s bothering you');
  }

  // Positive mood recognition
  if (moodCounts?.hopeful >= 2 || moodCounts?.grateful >= 2) {
    suggestions.push('Your positive outlook is wonderful! Use this energy to advocate for yourself');
  }

  // Confidence trending
  if (context.lastConfidence !== undefined) {
    const userBaseline = context.user.confidence_overall || 5;
    const confidenceDiff = context.lastConfidence - userBaseline;
    
    if (confidenceDiff <= -2) {
      suggestions.push('Your confidence has dropped from your baseline. This might be a good time to reach out for support');
    } else if (confidenceDiff >= 2) {
      suggestions.push('Your confidence is higher than usual! Great time to tackle any challenging conversations');
    }
  }

  // Concern patterns
  if (context.recentConcerns?.includes('medication_side_effects')) {
    suggestions.push('Track specific side effects with timing - this helps your doctor adjust medications effectively');
  }
  
  if (context.recentConcerns?.includes('financial_stress')) {
    suggestions.push('Many clinics have financial navigators who can help explore options you might not know about');
  }

  // Streak encouragement with different messages
  if (context.checkInStreak) {
    if (context.checkInStreak === 1) {
      suggestions.push('Welcome back! Every check-in helps us support you better');
    } else if (context.checkInStreak >= 3 && context.checkInStreak < 7) {
      suggestions.push(`${context.checkInStreak}-day streak! 🎯 Your consistency is helping us understand your patterns`);
    } else if (context.checkInStreak >= 7) {
      suggestions.push(`Amazing ${context.checkInStreak}-day streak! 🌟 You're building great habits`);
    }
  }

  // Cycle-specific insights
  if (context.user.cycle_stage === 'stimulation' && context.recentMoods?.includes('tired')) {
    suggestions.push('Fatigue during stimulation is common. Don\'t hesitate to discuss energy management with your team');
  }
  
  if (context.user.cycle_stage === 'tww' && (context.recentMoods?.includes('anxious') || context.recentMoods?.includes('worried'))) {
    suggestions.push('The two-week wait is emotionally intense. Consider asking about coping strategies specific to this phase');
  }

  // Limit to top 3 most relevant suggestions
  return suggestions.slice(0, 3);
}
/**
 * Question Generation Utilities
 * Generates personalized check-in questions based on user state
 */

/**
 * Calculate which dimension to focus on for a user today
 * Rotates through medication, financial, and journey concerns
 * with priority overrides for low confidence areas
 */
function calculateDimensionFocus(user) {
  const today = new Date();
  const daysSinceSignup = Math.floor((today - new Date(user.created_at)) / (1000 * 60 * 60 * 24));
  
  // Base rotation: cycle through dimensions every 3 days
  const rotationCycle = daysSinceSignup % 9; // 9 days = 3 dimensions × 3 days each
  
  const dimensions = ['medication', 'financial', 'journey'];
  const baseDimension = dimensions[Math.floor(rotationCycle / 3)];
  
  // Priority overrides based on onboarding concerns
  const { confidence_meds, confidence_costs, confidence_overall, top_concern } = user;
  
  // URGENT: Always check low confidence areas from onboarding
  if (confidence_meds <= 4) return 'medication';
  if (confidence_costs <= 4) return 'financial'; 
  if (confidence_overall <= 4) return 'journey';
  
  // HIGH PRIORITY: Check top concern area more frequently
  if (top_concern) {
    if (top_concern.toLowerCase().includes('medication') && (rotationCycle % 6 < 2)) return 'medication';
    if ((top_concern.toLowerCase().includes('cost') || top_concern.toLowerCase().includes('financial')) && (rotationCycle % 6 < 2)) return 'financial';
  }
  
  // Default to rotation-based dimension
  return baseDimension;
}

/**
 * Detect if cycle stage may need updating based on user behavior patterns
 */
function shouldCheckCycleStageUpdate(user) {
  // Check if it's been a while since user created account (>30 days)
  const accountAge = Date.now() - new Date(user.created_at).getTime();
  const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;
  
  // Suggest cycle stage check if:
  // 1. Account is old (>30 days) - people progress through stages
  // 2. User is in transitional stages that typically change quickly
  return accountAge > thirtyDaysMs || 
         user.cycle_stage === 'stimulation' ||
         user.cycle_stage === 'retrieval' ||
         user.cycle_stage === 'transfer' ||
         user.cycle_stage === 'tww';
}

/**
 * Get human-readable label for cycle stage
 */
function getCycleStageLabel(stage) {
  const labels = {
    'considering': 'just considering IVF',
    'ivf_prep': 'preparing for IVF',
    'stimulation': 'in stimulation phase',
    'retrieval': 'around retrieval',
    'transfer': 'transfer stage',
    'tww': 'two-week wait',
    'pregnant': 'pregnant',
    'between_cycles': 'between cycles'
  };
  return labels[stage] || stage;
}

/**
 * Derive medication status from cycle stage for consistency
 */
function getMedicationStatusFromCycleStage(cycleStage) {
  const medicationMapping = {
    'considering': 'not_taking',        // Just considering IVF
    'ivf_prep': 'starting_soon',        // Preparing for IVF
    'stimulation': 'taking',            // In stimulation phase - definitely on meds
    'retrieval': 'taking',              // Around retrieval - still on meds
    'transfer': 'taking',               // Transfer stage - on support meds
    'tww': 'taking',                    // Two-week wait - on support meds
    'pregnant': 'pregnancy_support',     // Pregnant - different med category
    'between_cycles': 'between_cycles'   // Between cycles - not on cycle meds
  };
  
  return medicationMapping[cycleStage] || 'not_taking';
}

/**
 * Get medication readiness/confidence question based on cycle stage
 */
function getMedicationQuestionForCycleStage(cycleStage) {
  switch (cycleStage) {
    case 'considering':
    case 'ivf_prep':
      return {
        id: 'medication_readiness_today',
        type: 'slider',
        question: 'How prepared do you feel about the medication aspects of IVF?',
        context: 'medication_preparation'
      };
    
    case 'stimulation':
    case 'retrieval':
    case 'transfer':
    case 'tww':
      return {
        id: 'medication_confidence_today',
        type: 'slider', 
        question: 'How confident are you feeling about your current medications?',
        context: 'medication_active'
      };
    
    case 'pregnant':
      return {
        id: 'pregnancy_medication_confidence',
        type: 'slider',
        question: 'How confident are you feeling about your pregnancy support medications?',
        context: 'pregnancy_medications'
      };
    
    case 'between_cycles':
      return {
        id: 'medication_readiness_today',
        type: 'slider',
        question: 'How prepared do you feel about medications for your next cycle?',
        context: 'between_cycles_preparation'
      };
    
    default:
      return {
        id: 'medication_confidence_today',
        type: 'slider',
        question: 'How confident are you feeling about the medication aspects?',
        context: 'medication_general'
      };
  }
}

/**
 * Generate personalized check-in questions based on user state
 */
function generatePersonalizedCheckInQuestions(user) {
  const questions = [
    // Always include baseline questions
    {
      id: 'mood_today',
      type: 'text',
      question: 'How are you feeling today?',
      placeholder: 'anxious, hopeful, tired...',
      required: true,
      priority: 1
    },
    {
      id: 'confidence_today', 
      type: 'slider',
      question: 'Overall confidence level today',
      min: 1,
      max: 10,
      required: true,
      priority: 1
    },
    // Universal journey reflection - ALWAYS present for comprehensive sentiment capture
    {
      id: 'journey_reflection_today',
      type: 'text',
      question: 'How are you feeling about your journey today?',
      placeholder: 'Share anything on your mind - celebrations, worries, thoughts...',
      required: false,
      priority: 2,
      context: 'universal_sentiment',
      sentiment_target: true  // Primary field for sentiment analysis
    }
  ];
  
  // Calculate which dimension to focus on today
  const dimensionToFocus = calculateDimensionFocus(user);
  console.log(`🎯 Today's dimension focus for ${user.email}: ${dimensionToFocus}`);
  
  // Add concern-specific questions based on dimension focus
  const { confidence_meds, confidence_costs, confidence_overall, top_concern } = user;
  
  // Cycle stage update check - ensure cycle stage is current
  if (dimensionToFocus === 'medication' && shouldCheckCycleStageUpdate(user)) {
    questions.push({
      id: 'cycle_stage_update',
      type: 'select',
      question: 'Is your cycle stage still current?',
      options: [
        { value: 'no_change', label: 'No change - still ' + getCycleStageLabel(user.cycle_stage) },
        { value: 'considering', label: 'Just considering IVF' },
        { value: 'ivf_prep', label: 'Preparing for IVF' },
        { value: 'stimulation', label: 'In stimulation phase' },
        { value: 'retrieval', label: 'Around retrieval' },
        { value: 'transfer', label: 'Transfer stage' },
        { value: 'tww', label: 'Two-week wait' },
        { value: 'pregnant', label: 'Pregnant' },
        { value: 'between_cycles', label: 'Between cycles' }
      ],
      required: false,
      priority: 2.7,
      context: 'cycle_stage_update'
    });
  }
  
  if (dimensionToFocus === 'medication') {
    // Use cycle stage to determine appropriate medication question
    const medicationQuestion = getMedicationQuestionForCycleStage(user.cycle_stage);
    const derivedMedicationStatus = getMedicationStatusFromCycleStage(user.cycle_stage);
    
    questions.push({
      ...medicationQuestion,
      min: 1,
      max: 10,
      required: false,
      priority: 3,
      cycle_stage_context: user.cycle_stage,
      derived_medication_status: derivedMedicationStatus
    });
    
    // Add follow-up question based on cycle stage and confidence
    if (derivedMedicationStatus === 'taking' || derivedMedicationStatus === 'pregnancy_support') {
      if (confidence_meds <= 4 || (top_concern && top_concern.toLowerCase().includes('medication'))) {
        // Low confidence: focus on support
        questions.push({
          id: 'medication_concern_today',
          type: 'text', 
          question: user.cycle_stage === 'pregnant' ? 
            'Any specific concerns about your pregnancy medications?' :
            'Any specific medication questions or worries today?',
          placeholder: user.cycle_stage === 'pregnant' ? 
            'prenatal vitamins, hormone support, timing...' :
            'timing, side effects, dosing...',
          required: false,
          priority: 4,
          context: 'medication_focus'
        });
      } else {
        // High/medium confidence: capture what's working
        questions.push({
          id: 'medication_momentum',
          type: 'text',
          question: user.cycle_stage === 'pregnant' ?
            'How are you feeling about your pregnancy medication routine?' :
            'How are things going with your medication routine? Any changes?',
          placeholder: user.cycle_stage === 'pregnant' ?
            'routine working well, doctor feedback, any adjustments...' :
            'routine working well, new concerns, doctor feedback...',
          required: false,
          priority: 4,
          context: 'medication_check'
        });
      }
    } else {
      // Preparation phase - ask about readiness concerns
      questions.push({
        id: 'medication_preparation_concern',
        type: 'text',
        question: derivedMedicationStatus === 'between_cycles' ?
          'Any thoughts about medications for your next cycle?' :
          'Any questions or concerns about upcoming medications?',
        placeholder: derivedMedicationStatus === 'between_cycles' ?
          'next cycle planning, protocol changes, timing...' :
          'timeline questions, preparation concerns, what to expect...',
        required: false,
        priority: 4,
        context: 'medication_preparation'
      });
    }
  }
  
  if (dimensionToFocus === 'financial') {
    // Always check financial dimension when it's the focus
    questions.push({
      id: 'financial_confidence_today',
      type: 'slider',
      question: `How confident are you feeling about the financial aspects today?`,
      min: 1,
      max: 10,
      required: false,
      priority: 3,
      context: 'financial_focus'
    });
    
    if (confidence_costs <= 4 || (top_concern && (top_concern.toLowerCase().includes('cost') || top_concern.toLowerCase().includes('financial')))) {
      // Low confidence or concern: focus on support
      questions.push({
        id: 'financial_concern_today',
        type: 'text',
        question: 'Any new financial concerns or updates today?',
        placeholder: 'insurance updates, cost worries, planning questions...',
        required: false,
        priority: 4,
        context: 'financial_focus'
      });
    } else {
      // High/medium confidence: capture what's working or any changes
      questions.push({
        id: 'financial_momentum',
        type: 'text',
        question: 'How are the financial aspects feeling? Any updates?',
        placeholder: 'insurance progress, cost clarity, financial planning...',
        required: false,
        priority: 4,
        context: 'financial_check'
      });
    }
  }
  
  if (dimensionToFocus === 'journey') {
    // Always check overall journey dimension when it's the focus
    questions.push({
      id: 'journey_confidence_today',
      type: 'slider',
      question: `How confident are you feeling about your journey overall today?`,
      min: 1,
      max: 10,
      required: false,
      priority: 3,
      context: 'journey_focus'
    });
    
    if (confidence_overall <= 4) {
      // Low confidence: focus on readiness and support
      questions.push({
        id: 'journey_readiness_today',
        type: 'text',
        question: 'What feels challenging about your journey right now?',
        placeholder: 'timeline concerns, preparation worries, next steps...',
        required: false,
        priority: 4,
        context: 'journey_focus'
      });
    } else {
      // High/medium confidence: capture what's building strength
      questions.push({
        id: 'journey_momentum',
        type: 'text',
        question: 'What\'s feeling good about your journey today? Any new developments?',
        placeholder: 'team support, progress made, positive changes...',
        required: false,
        priority: 4,
        context: 'journey_check'
      });
    }
  }
  
  // Add medication tracking question (always present but optional)
  questions.push({
    id: 'medication_taken',
    type: 'select',
    question: 'Have you taken your medications today?',
    options: [
      { value: 'yes', label: 'Yes, all taken' },
      { value: 'partial', label: 'Some but not all' },
      { value: 'no', label: 'No, not yet' },
      { value: 'not_applicable', label: 'Not on medications' },
      { value: 'not tracked', label: 'Prefer not to track' }
    ],
    required: false,
    priority: 5,
    context: 'medication_tracking'
  });
  
  // Sort questions by priority
  questions.sort((a, b) => a.priority - b.priority);
  
  return questions;
}

module.exports = {
  generatePersonalizedCheckInQuestions,
  calculateDimensionFocus,
  shouldCheckCycleStageUpdate,
  getCycleStageLabel,
  getMedicationStatusFromCycleStage,
  getMedicationQuestionForCycleStage
};
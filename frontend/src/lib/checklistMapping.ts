// Checklist Mapping - AP-01 Feature
// Static mapping of cycle stages to personalized checklist items

export interface ChecklistItem {
  id: string;
  title: string;
  description: string;
  category: 'medical' | 'comfort' | 'logistics' | 'questions';
}

export interface ChecklistMapping {
  [key: string]: ChecklistItem[];
}

// Cycle-aware appointment prep checklist items
export const CHECKLIST_MAPPING: ChecklistMapping = {
  // Baseline scan stage
  baseline: [
    {
      id: 'baseline_confirmation',
      title: 'Confirm ultrasound appointment time',
      description: 'Double-check your baseline scan appointment and arrive 15 minutes early',
      category: 'logistics'
    },
    {
      id: 'insurance_docs',
      title: 'Bring insurance documentation',
      description: 'Have your insurance card and any pre-authorization paperwork ready',
      category: 'logistics'
    },
    {
      id: 'hydration_prep',
      title: 'Stay well-hydrated today',
      description: 'Drink plenty of water for clearer ultrasound imaging',
      category: 'medical'
    }
  ],

  // Stimulation phase
  stimulation: [
    {
      id: 'med_alarms',
      title: 'Set medication alarms',
      description: 'Double-check timing for your stimulation medications',
      category: 'medical'
    },
    {
      id: 'protein_snacks',
      title: 'Pack protein-rich snacks',
      description: 'Bring healthy snacks to maintain energy during monitoring visits',
      category: 'comfort'
    },
    {
      id: 'nurse_questions',
      title: 'Prepare questions for your nurse',
      description: 'Write down any concerns about medication side effects or symptoms',
      category: 'questions'
    }
  ],

  // Egg retrieval phase
  retrieval: [
    {
      id: 'comfort_items',
      title: 'Pack comfort items',
      description: 'Bring a heating pad and comfortable clothes for post-procedure',
      category: 'comfort'
    },
    {
      id: 'transportation',
      title: 'Confirm transportation arrangements',
      description: 'Ensure you have someone to drive you home after sedation',
      category: 'logistics'
    },
    {
      id: 'recovery_prep',
      title: 'Prepare recovery space at home',
      description: 'Set up a comfortable resting area with easy access to snacks and water',
      category: 'comfort'
    }
  ],

  // Embryo transfer phase
  transfer: [
    {
      id: 'bladder_prep',
      title: 'Plan bladder preparation',
      description: 'Follow clinic instructions for optimal bladder fullness during transfer',
      category: 'medical'
    },
    {
      id: 'comfort_measures',
      title: 'Bring comfort measures',
      description: 'Pack meditation playlist or relaxation aids for before/after transfer',
      category: 'comfort'
    },
    {
      id: 'post_transfer_care',
      title: 'Plan post-transfer activities',
      description: 'Arrange light activities and avoid heavy lifting for the next few days',
      category: 'logistics'
    }
  ],

  // Two-week wait (TWW) phase
  tww: [
    {
      id: 'symptom_tracking',
      title: 'Set up symptom tracking',
      description: 'Create a simple log for any symptoms (but try not to over-analyze)',
      category: 'medical'
    },
    {
      id: 'distraction_activities',
      title: 'Plan distraction activities',
      description: 'Schedule enjoyable, low-stress activities to help pass the time',
      category: 'comfort'
    },
    {
      id: 'support_network',
      title: 'Connect with support network',
      description: 'Reach out to friends, family, or support groups for emotional support',
      category: 'comfort'
    }
  ],

  // Pregnant stage
  pregnant: [
    {
      id: 'prenatal_vitamins',
      title: 'Continue prenatal vitamins',
      description: 'Maintain your prenatal vitamin routine as recommended by your clinic',
      category: 'medical'
    },
    {
      id: 'ob_transition',
      title: 'Plan transition to OB care',
      description: 'Discuss with your RE when to transition to regular prenatal care',
      category: 'medical'
    },
    {
      id: 'celebrate_mindfully',
      title: 'Celebrate this milestone mindfully',
      description: 'Acknowledge this achievement while managing cautious optimism',
      category: 'comfort'
    }
  ],

  // Between cycles
  between_cycles: [
    {
      id: 'cycle_review',
      title: 'Schedule cycle review appointment',
      description: 'Meet with your RE to discuss what went well and potential adjustments',
      category: 'medical'
    },
    {
      id: 'self_care',
      title: 'Focus on self-care',
      description: 'Take time for physical and emotional recovery between cycles',
      category: 'comfort'
    },
    {
      id: 'next_steps',
      title: 'Clarify next steps timeline',
      description: 'Understand timing and any preparatory steps for your next cycle',
      category: 'questions'
    }
  ]
};

// Default fallback items for unknown cycle stages
export const DEFAULT_CHECKLIST_ITEMS: ChecklistItem[] = [
  {
    id: 'general_hydration',
    title: 'Stay well-hydrated',
    description: 'Drink plenty of water throughout the day',
    category: 'medical'
  },
  {
    id: 'general_rest',
    title: 'Prioritize rest',
    description: 'Ensure you get adequate sleep for optimal health',
    category: 'comfort'
  },
  {
    id: 'general_questions',
    title: 'Prepare questions for your care team',
    description: 'Write down any concerns or questions for your next appointment',
    category: 'questions'
  }
];

// Helper function to get checklist items for a specific cycle stage
export function getChecklistForStage(cycleStage: string): ChecklistItem[] {
  const items = CHECKLIST_MAPPING[cycleStage];
  
  if (!items || items.length === 0) {
    console.warn(`No checklist items found for cycle stage: ${cycleStage}, using defaults`);
    return DEFAULT_CHECKLIST_ITEMS;
  }
  
  // Return first 3 items as specified in requirements
  return items.slice(0, 3);
}

// Helper function to get all available cycle stages
export function getAvailableCycleStages(): string[] {
  return Object.keys(CHECKLIST_MAPPING);
}
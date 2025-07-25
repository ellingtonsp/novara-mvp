// CM-01: Dynamic Copy Variants for Sentiment-Based Insights
// Celebratory copy variants for positive days with emoji support

export interface CopyVariant {
  title: string;
  message: string;
  emoji: string;
  tone: 'celebratory' | 'supportive' | 'neutral';
  action?: {
    label: string;
    type: string;
  };
}

export interface InsightCopyData {
  sentiment: 'positive' | 'neutral' | 'negative' | 'mixed';  // Added 'mixed'
  confidence?: number;
  mood_score?: number;
  user_name?: string;
  context?: {
    confidence_level?: number;
    moods?: string[];
    has_note?: boolean;
  };
  criticalConcerns?: string[];  // NEW: Track critical concerns detected
  confidenceFactors?: {        // NEW: Track specific confidence issues
    medication?: number;
    financial?: number;
    overall?: number;
    medication_readiness?: number;  // NEW: For patients not currently on medications
  };
}

// Celebratory copy variants for positive sentiment (CM-01 requirement)
const POSITIVE_COPY_VARIANTS: CopyVariant[] = [
  {
    title: "You're absolutely glowing today! ✨",
    message: "Your positive energy is radiating through every word. This kind of hopeful momentum is exactly what carries you forward on this journey. Keep celebrating these beautiful moments!",
    emoji: "🎉",
    tone: "celebratory",
    action: {
      label: "Share this positivity",
      type: "share_positive_moment"
    }
  },
  {
    title: "What a wonderful day to check in! 💜",
    message: "The gratitude and joy in your words are so beautiful to witness. These are the moments that remind us why this journey, with all its challenges, is so profoundly meaningful.",
    emoji: "💜",
    tone: "celebratory",
    action: {
      label: "Reflect on what's working",
      type: "reflect_positive_patterns"
    }
  },
  {
    title: "Your strength is absolutely shining! 🌟",
    message: "Reading your check-in fills us with so much hope and excitement for you! Your resilience and positive outlook are incredible gifts—not just to yourself, but to everyone on this journey.",
    emoji: "🌟",
    tone: "celebratory",
    action: {
      label: "Capture this feeling",
      type: "save_positive_moment"
    }
  },
  {
    title: "Celebrating YOU today! 🎊",
    message: "Your positivity is absolutely contagious! Days like this are treasures—they're proof of your incredible strength and the beautiful progress you're making, even when it doesn't always feel linear.",
    emoji: "🎊",
    tone: "celebratory",
    action: {
      label: "Keep this momentum",
      type: "positive_momentum_tips"
    }
  },
  {
    title: "This is the energy we love to see! ⭐",
    message: "Your optimism and hope are so inspiring! These moments of joy and confidence are like beacons of light that will carry you through every part of this journey. Simply beautiful.",
    emoji: "⭐",
    tone: "celebratory",
    action: {
      label: "Plan your next step",
      type: "positive_planning"
    }
  }
];

// Supportive copy variants for neutral sentiment (unchanged from current)
const NEUTRAL_COPY_VARIANTS: CopyVariant[] = [
  {
    title: "Thank you for checking in today",
    message: "Every day on this journey brings new experiences. Your consistent commitment to tracking how you're feeling is building valuable insights for your path ahead.",
    emoji: "🤗",
    tone: "supportive"
  },
  {
    title: "Your journey, your pace",
    message: "Not every day needs to feel extraordinary—steady progress and self-awareness are just as valuable. Thank you for being so thoughtful about your experience.",
    emoji: "🌱",
    tone: "supportive"
  },
  {
    title: "One step at a time",
    message: "You're building a meaningful record of your fertility journey. These insights, gathered day by day, are creating a clearer picture of what works best for you.",
    emoji: "👣",
    tone: "supportive"
  }
];

// Compassionate copy variants for negative sentiment (unchanged from current)
const NEGATIVE_COPY_VARIANTS: CopyVariant[] = [
  {
    title: "We're here with you through this",
    message: "Difficult days are part of this journey, and your feelings are completely valid. Taking time to acknowledge where you are emotionally is an act of self-care and courage.",
    emoji: "🤲",
    tone: "supportive",
    action: {
      label: "Find support resources",
      type: "support_resources"
    }
  },
  {
    title: "Your feelings matter",
    message: "Thank you for being honest about how you're feeling today. These challenging moments don't define your entire journey—they're part of the full, complex, human experience of fertility care.",
    emoji: "💙",
    tone: "supportive",
    action: {
      label: "Gentle self-care ideas",
      type: "self_care_suggestions"
    }
  },
  {
    title: "Tomorrow is a new day",
    message: "Today feels heavy, and that's okay. Your resilience shows up not in feeling positive all the time, but in continuing to show up for yourself, even on the hard days.",
    emoji: "🌅",
    tone: "supportive",
    action: {
      label: "Connect with community",
      type: "community_support"
    }
  }
];

// NEW: Mixed sentiment copy variants for complex emotional states
// Acknowledges positive outlook while addressing specific critical concerns
const MIXED_COPY_VARIANTS: CopyVariant[] = [
  {
    title: "Your optimism shines through, and we hear your concerns",
    message: "What strikes us most is your ability to maintain hope while being honest about what's challenging. That combination of resilience and awareness is exactly what will serve you well on this journey.",
    emoji: "💜✨",
    tone: "supportive",
    action: {
      label: "Address specific concerns",
      type: "targeted_support"
    }
  },
  {
    title: "Strength and vulnerability, beautifully balanced",
    message: "You're showing such wisdom—staying positive about your overall journey while naming the specific areas that need attention. This kind of self-awareness is a superpower in fertility care.",
    emoji: "🌟💙",
    tone: "supportive",
    action: {
      label: "Get clarity on concerns",
      type: "concern_clarification"
    }
  },
  {
    title: "Your hope is real, and so are your worries",
    message: "We see both sides of what you're experiencing—the genuine optimism and the valid concerns. Both are important parts of your story, and both deserve attention and care.",
    emoji: "🤗⚡",
    tone: "supportive",
    action: {
      label: "Create action plan",
      type: "mixed_sentiment_planning"
    }
  },
  {
    title: "Resilient heart, thoughtful mind",
    message: "Your ability to hold both hopefulness and specific worries shows incredible emotional intelligence. Let's honor both your strength and the areas where you need more support.",
    emoji: "💪💭",
    tone: "supportive",
    action: {
      label: "Balance hope with action",
      type: "balanced_approach"
    }
  }
];

// NEW: Specialized mixed sentiment variants for specific concerns
const MEDICATION_CONCERN_VARIANTS: CopyVariant[] = [
  {
    title: "Your positivity is beautiful, but let's clear up that medication confusion",
    message: "I love seeing your hopeful spirit! And that medication confidence level tells me something important needs attention. Confusion about protocols is completely normal—let's get you the clarity you deserve.",
    emoji: "💜🔍",
    tone: "supportive",
    action: {
      label: "Get medication clarity",
      type: "medication_support"
    }
  },
  {
    title: "Hopeful heart, confused about meds—both are valid",
    message: "Your optimism about the journey is wonderful, and your medication confusion is totally understandable. Fertility protocols can feel overwhelming. You don't have to figure it out alone.",
    emoji: "❤️💊",
    tone: "supportive",
    action: {
      label: "Medication Q&A resources",
      type: "medication_education"
    }
  }
];

const FINANCIAL_CONCERN_VARIANTS: CopyVariant[] = [
  {
    title: "Your hope is inspiring, and we understand the financial stress",
    message: "What resilience you show—maintaining optimism while navigating very real financial concerns. Both your hope and your worry about costs are completely valid parts of this experience.",
    emoji: "💜💰",
    tone: "supportive",
    action: {
      label: "Financial support resources",
      type: "financial_assistance"
    }
  }
];

// NEW: Medication preparation variants for patients not currently on medications
const MEDICATION_PREPARATION_VARIANTS: CopyVariant[] = [
  {
    title: "It's natural to feel uncertain about starting medications",
    message: "Your concerns about upcoming medications are completely understandable. Many patients feel anxious before starting their protocol. This anticipation often feels bigger than the actual experience.",
    emoji: "💙🌱",
    tone: "supportive",
    action: {
      label: "Medication preparation guide",
      type: "medication_preparation_support"
    }
  },
  {
    title: "Preparation anxiety is so common in this journey",
    message: "Feeling worried about medications you haven't started yet? You're not alone. This shows you're thinking ahead and want to be prepared—that's actually a strength, even when it feels overwhelming.",
    emoji: "🤗💊",
    tone: "supportive",
    action: {
      label: "What to expect with medications",
      type: "medication_education_prep"
    }
  }
];

/**
 * Select appropriate copy variant based on sentiment analysis
 * Enhanced for mixed sentiment and specific concern targeting
 */
export function selectCopyVariant(data: InsightCopyData): CopyVariant {
  const { 
    sentiment, 
    confidence = 0.5, 
    mood_score = 5, 
    user_name, 
    context,
    criticalConcerns = [],
    confidenceFactors = {}
  } = data;
  
  let variants: CopyVariant[];
  
  // NEW: Handle mixed sentiment with specialized variants
  if (sentiment === 'mixed') {
    // Check for specific concern types and use specialized variants
    if (criticalConcerns.includes('medication') || 
        (confidenceFactors.medication !== undefined && confidenceFactors.medication <= 3)) {
      variants = MEDICATION_CONCERN_VARIANTS;
    } else if (criticalConcerns.includes('medication_preparation') || 
               (confidenceFactors.medication_readiness !== undefined && confidenceFactors.medication_readiness <= 3)) {
      variants = MEDICATION_PREPARATION_VARIANTS;
    } else if (criticalConcerns.includes('financial') || 
               (confidenceFactors.financial !== undefined && confidenceFactors.financial <= 3)) {
      variants = FINANCIAL_CONCERN_VARIANTS;
    } else {
      // General mixed sentiment
      variants = MIXED_COPY_VARIANTS;
    }
  } else if (sentiment === 'positive') {
    variants = POSITIVE_COPY_VARIANTS;
  } else if (sentiment === 'negative') {
    variants = NEGATIVE_COPY_VARIANTS;
  } else {
    variants = NEUTRAL_COPY_VARIANTS;
  }
  
  // For positive sentiment, choose variant based on confidence and mood score
  if (sentiment === 'positive' && variants.length > 1) {
    if (mood_score >= 9 && confidence >= 0.8) {
      // Highest positivity - use most celebratory variant
      return variants[0];
    } else if (mood_score >= 7 && confidence >= 0.6) {
      // High positivity - rotate between top variants
      const index = Math.floor(Math.random() * Math.min(3, variants.length));
      return variants[index];
    } else {
      // Moderate positivity - use gentler celebratory variants
      const index = Math.floor(Math.random() * variants.length);
      return variants[index];
    }
  }
  
  // For mixed sentiment, prefer variants that match the specific concern
  if (sentiment === 'mixed' && variants.length > 1) {
    // If we have medication concerns and medication variants, prefer those
    if (variants === MEDICATION_CONCERN_VARIANTS) {
      // Choose based on severity of medication confidence
      const medConfidence = confidenceFactors.medication || 5;
      return medConfidence <= 2 ? variants[0] : variants[1]; // More supportive for very low confidence
    }
    
    // For general mixed sentiment, rotate randomly
    const randomIndex = Math.floor(Math.random() * variants.length);
    return variants[randomIndex];
  }
  
  // For neutral/negative, rotate randomly to avoid repetition
  const randomIndex = Math.floor(Math.random() * variants.length);
  let selectedVariant = variants[randomIndex];
  
  // Personalize with user name if available and appropriate
  if (user_name && (sentiment === 'positive' || sentiment === 'mixed')) {
    selectedVariant = {
      ...selectedVariant,
      title: selectedVariant.title.replace('Your', `${user_name}, your`),
      message: selectedVariant.message
    };
  }
  
  return selectedVariant;
}

/**
 * Generate insight copy based on sentiment analysis results
 * Enhanced to handle mixed sentiment and critical concerns
 */
export function generateSentimentBasedInsight(data: InsightCopyData): {
  title: string;
  message: string;
  action?: { label: string; type: string };
  sentiment_data: {
    sentiment: string;
    confidence: number;
    copy_variant_used: string;
    celebration_triggered: boolean;
    critical_concerns_detected?: string[];
    confidence_factors?: Record<string, number>;
  };
} {
  const variant = selectCopyVariant(data);
  
  return {
    title: variant.title,
    message: variant.message,
    action: variant.action,
    sentiment_data: {
      sentiment: data.sentiment,
      confidence: data.confidence || 0,
      copy_variant_used: variant.tone,
      celebration_triggered: data.sentiment === 'positive',
      critical_concerns_detected: data.criticalConcerns,
      confidence_factors: data.confidenceFactors
    }
  };
}

/**
 * Test function to validate copy variants
 */
export function testCopyVariants(): void {
  console.log('🧪 Testing CM-01 Copy Variants:');
  
  const testCases = [
    { sentiment: 'positive' as const, confidence: 0.9, mood_score: 9, expected_tone: 'celebratory' },
    { sentiment: 'positive' as const, confidence: 0.7, mood_score: 7, expected_tone: 'celebratory' },
    { sentiment: 'positive' as const, confidence: 0.6, mood_score: 6, expected_tone: 'celebratory' },
    { sentiment: 'neutral' as const, confidence: 0.5, mood_score: 5, expected_tone: 'supportive' },
    { sentiment: 'negative' as const, confidence: 0.8, mood_score: 3, expected_tone: 'supportive' }
  ];
  
  testCases.forEach((testCase, index) => {
    const result = generateSentimentBasedInsight(testCase);
    const passed = result.sentiment_data.copy_variant_used === testCase.expected_tone;
    
    console.log(`Test ${index + 1}: ${passed ? '✅' : '❌'}`);
    console.log(`  Sentiment: ${testCase.sentiment}, Mood: ${testCase.mood_score}`);
    console.log(`  Expected: ${testCase.expected_tone}, Got: ${result.sentiment_data.copy_variant_used}`);
    console.log(`  Title: "${result.title}"`);
    console.log(`  Celebration triggered: ${result.sentiment_data.celebration_triggered}`);
    console.log('');
  });
} 
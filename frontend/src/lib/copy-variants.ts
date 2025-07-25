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
  sentiment: 'positive' | 'neutral' | 'negative';
  confidence?: number;
  mood_score?: number;
  user_name?: string;
  context?: {
    confidence_level?: number;
    moods?: string[];
    has_note?: boolean;
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

/**
 * Select appropriate copy variant based on sentiment analysis
 * Implements CM-01 requirement for celebratory copy on positive sentiment
 */
export function selectCopyVariant(data: InsightCopyData): CopyVariant {
  const { sentiment, confidence = 0.5, mood_score = 5, user_name } = data;
  
  let variants: CopyVariant[];
  
  // CM-01: Use celebratory variants for positive sentiment
  if (sentiment === 'positive') {
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
  
  // For neutral/negative, rotate randomly to avoid repetition
  const randomIndex = Math.floor(Math.random() * variants.length);
  let selectedVariant = variants[randomIndex];
  
  // Personalize with user name if available
  if (user_name && sentiment === 'positive') {
    selectedVariant = {
      ...selectedVariant,
      title: selectedVariant.title.replace('You\'re', `${user_name}, you're`),
      message: selectedVariant.message
    };
  }
  
  return selectedVariant;
}

/**
 * Generate insight copy based on sentiment analysis results
 * Main function called from insight generation system
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
      celebration_triggered: data.sentiment === 'positive'
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
// CM-01: Sentiment Analysis Utility
// VADER-based sentiment classification for positive reflection feature
// Enhanced for mixed sentiment and critical concern detection
// Runs client-side with <150ms performance target

export interface SentimentResult {
  sentiment: 'positive' | 'neutral' | 'negative' | 'mixed';  // Added 'mixed'
  confidence: number;
  scores: {
    positive: number;
    neutral: number;
    negative: number;
    compound: number;
  };
  processingTime: number;
  criticalConcerns?: string[];  // NEW: Track specific critical concerns detected
  confidenceFactors?: {        // NEW: Track confidence scores that influenced sentiment
    medication?: number;
    financial?: number;
    overall?: number;
  };
}

// VADER Lexicon - IVF/Fertility-enhanced positive terms
const POSITIVE_WORDS: Record<string, number> = {
  // VADER core positive terms
  amazing: 2.2, awesome: 2.2, brilliant: 2.2, excellent: 2.5, fantastic: 2.5,
  good: 1.9, great: 2.0, happy: 2.2, love: 2.4, wonderful: 2.5,
  excited: 2.0, hopeful: 2.0, grateful: 2.1, proud: 2.0, confident: 1.8,
  perfect: 2.3, beautiful: 1.9, best: 2.1, success: 2.0, positive: 1.5,
  
  // IVF/Fertility-specific positive terms
  blessed: 2.2, miracle: 2.4, journey: 1.2, progress: 1.8, support: 1.6,
  strong: 1.7, brave: 1.9, determined: 1.8, resilient: 1.9, empowered: 2.0,
  healing: 1.8, growth: 1.5, breakthrough: 2.1, achievement: 2.0, milestone: 1.8,
  clarity: 1.6, peaceful: 1.8, optimistic: 2.0, encouraged: 1.9, motivated: 1.8,
  celebration: 2.2, victory: 2.1, triumph: 2.2, accomplishment: 2.0,
  
  // Fertility journey positive phrases (compound scoring)
  "feeling good": 2.0, "going well": 1.8, "positive energy": 2.1,
  "great news": 2.3, "so grateful": 2.4, "really happy": 2.5,
  "feeling hopeful": 2.2, "things looking up": 1.9, "on track": 1.7,
  "feeling strong": 2.0, "good vibes": 1.8, "blessed day": 2.3,
  "amazing support": 2.4, "perfect timing": 2.1, "wonderful news": 2.5
};

const NEGATIVE_WORDS: Record<string, number> = {
  // VADER core negative terms
  awful: -2.2, terrible: -2.4, horrible: -2.3, bad: -1.9, worst: -2.6,
  hate: -2.4, angry: -2.1, sad: -1.8, frustrated: -2.0, stressed: -2.1,
  worried: -1.8, anxious: -1.9, overwhelmed: -2.2, depressed: -2.4,
  
  // IVF/Fertility-specific negative terms
  failed: -2.3, disappointment: -2.1, setback: -1.9, canceled: -2.0,
  delayed: -1.6, unsuccessful: -2.2, rejected: -2.1, denied: -2.0,
  exhausted: -2.0, drained: -1.9, hopeless: -2.5, defeated: -2.3,
  
  // NEW: Critical medication/treatment concerns
  confusing: -2.1, confused: -2.0, unclear: -1.8,
  complicated: -1.7, uncertain: -1.8, "no idea": -2.1, 
  "can't figure": -2.2, scary: -2.1,
  
  // Fertility journey negative phrases
  "not working": -2.1, "so hard": -1.8, "giving up": -2.4,
  "too much": -1.9, "can't handle": -2.2, "feeling lost": -2.1,
  "broken down": -2.3, "no hope": -2.6, "waste of time": -2.2,
  
  // NEW: Medication-specific critical phrases
  "so confusing": -2.4, "don't understand": -2.3, "makes no sense": -2.5,
  "too complicated": -2.1, "overwhelming protocol": -2.6, "lost with meds": -2.7
};

// NEW: Critical concern detection patterns
const CRITICAL_CONCERN_PATTERNS = {
  medication: [
    /confus(ed|ing)/i, /don'?t understand/i, /unclear/i, /complicated/i,
    /overwhelming.*med/i, /med.*overwhelming/i, /protocol.*confus/i,
    /lost.*med/i, /scared.*med/i, /worried.*med/i
  ],
  financial: [
    /can'?t afford/i, /too expensive/i, /financial.*stress/i, /money.*worry/i,
    /cost.*overwhelming/i, /broke/i, /debt/i
  ],
  emotional: [
    /can'?t handle/i, /breaking down/i, /losing hope/i, /giving up/i,
    /too much.*bear/i, /emotionally.*drained/i
  ]
};

// Intensifiers and modifiers
const INTENSIFIERS: Record<string, number> = {
  absolutely: 1.5, completely: 1.4, extremely: 1.6, incredibly: 1.6,
  really: 1.3, very: 1.2, quite: 1.1, pretty: 1.1, so: 1.3,
  totally: 1.4, utterly: 1.5, highly: 1.2, truly: 1.3, deeply: 1.4
};

const NEGATIONS = ['not', 'no', 'never', 'none', 'nobody', 'nothing', 'neither', 'nowhere', 'hardly', 'barely', 'seldom', 'rarely', "don't", "won't", "can't", "shouldn't", "wouldn't", "couldn't", "isn't", "aren't", "wasn't", "weren't"];

// Punctuation scoring
const EXCLAMATION_BOOST = 0.292;
const QUESTION_REDUCTION = -0.18;

/**
 * NEW: Detect critical concerns in text
 */
function detectCriticalConcerns(text: string): string[] {
  const concerns: string[] = [];
  const lowerText = text.toLowerCase();
  
  Object.entries(CRITICAL_CONCERN_PATTERNS).forEach(([category, patterns]) => {
    for (const pattern of patterns) {
      if (pattern.test(lowerText)) {
        concerns.push(category);
        break; // Only add category once
      }
    }
  });
  
  return concerns;
}

/**
 * Tokenize text into words and clean them
 */
function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(word => word.length > 0);
}

/**
 * Check for multi-word phrases in text
 */
function findPhrases(text: string, wordMap: Record<string, number>): Array<{phrase: string, score: number, start: number, end: number}> {
  const phrases: Array<{phrase: string, score: number, start: number, end: number}> = [];
  const lowerText = text.toLowerCase();
  
  // Sort phrases by length (longest first) to match longest phrases first
  const sortedPhrases = Object.keys(wordMap)
    .filter(phrase => phrase.includes(' '))
    .sort((a, b) => b.length - a.length);
  
  for (const phrase of sortedPhrases) {
    let index = 0;
    while ((index = lowerText.indexOf(phrase, index)) !== -1) {
      phrases.push({
        phrase,
        score: wordMap[phrase],
        start: index,
        end: index + phrase.length
      });
      index += phrase.length;
    }
  }
  
  // Remove overlapping phrases (keep longest)
  return phrases.filter((phrase, i) => {
    return !phrases.some((otherPhrase, j) => {
      if (i === j) return false;
      return (phrase.start >= otherPhrase.start && phrase.end <= otherPhrase.end);
    });
  });
}

/**
 * Calculate sentiment scores using enhanced VADER algorithm
 */
export function analyzeSentiment(text: string): SentimentResult {
  const startTime = performance.now();
  
  if (!text || text.trim().length === 0) {
    const endTime = performance.now();
    return {
      sentiment: 'neutral',
      confidence: 0,
      scores: { positive: 0, neutral: 1, negative: 0, compound: 0 },
      processingTime: endTime - startTime
    };
  }

  const originalText = text;
  const tokens = tokenize(text);
  
  // NEW: Detect critical concerns first
  const criticalConcerns = detectCriticalConcerns(text);
  
  // Find phrases first
  const positivePhrases = findPhrases(text, POSITIVE_WORDS);
  const negativePhrases = findPhrases(text, NEGATIVE_WORDS);
  
  let sentimentScores: number[] = [];
  
  // Score phrases
  [...positivePhrases, ...negativePhrases].forEach(phraseMatch => {
    let phraseScore = phraseMatch.score;
    
    // Check if phrase is negated (look for negation words before the phrase)
    const phraseStart = phraseMatch.start;
    // const phraseTokens = tokenize(phraseMatch.phrase); // Unused variable
    let isNegated = false;
    
    // Convert character position to word position
    const wordsBeforePhrase = originalText.substring(0, phraseStart).split(/\s+/).filter(w => w.length > 0);
    const phraseWordIndex = wordsBeforePhrase.length;
    
    // Look for negations in the 3 words before the phrase
    for (let i = Math.max(0, phraseWordIndex - 3); i < phraseWordIndex; i++) {
      if (i < tokens.length && NEGATIONS.includes(tokens[i])) {
        isNegated = true;
        break;
      }
    }
    
    if (isNegated) {
      // Flip the sentiment for negated phrases
      if (phraseScore > 0) {
        phraseScore = -Math.abs(phraseScore) * 2.0; // Strong negative flip
      } else if (phraseScore < 0) {
        phraseScore = Math.abs(phraseScore) * 0.5; // Weak positive flip
      }
    }
    
    sentimentScores.push(phraseScore);
  });
  
  // Score individual words (skip words that are part of phrases)
  const phraseWords = new Set([...positivePhrases, ...negativePhrases]
    .flatMap(p => tokenize(p.phrase)));
  
  for (let i = 0; i < tokens.length; i++) {
    const word = tokens[i];
    
    // Skip if word is part of a phrase
    if (phraseWords.has(word)) continue;
    
    let wordScore = 0;
    
    // Check for word in lexicons
    if (POSITIVE_WORDS[word]) {
      wordScore = POSITIVE_WORDS[word];
    } else if (NEGATIVE_WORDS[word]) {
      wordScore = NEGATIVE_WORDS[word];
    }
    
    if (wordScore !== 0) {
      // Apply intensifiers
      if (i > 0 && INTENSIFIERS[tokens[i - 1]]) {
        wordScore *= INTENSIFIERS[tokens[i - 1]];
      }
      
      // Apply negation (look back 3 words)
      let isNegated = false;
      for (let j = Math.max(0, i - 3); j < i; j++) {
        if (NEGATIONS.includes(tokens[j])) {
          isNegated = true;
          break;
        }
      }
      
      if (isNegated) {
        // For negation, we want to flip the sentiment more strongly
        if (wordScore > 0) {
          wordScore = -Math.abs(wordScore) * 2.0; // Much stronger negative flip
        } else if (wordScore < 0) {
          wordScore = Math.abs(wordScore) * 0.5; // Weaker positive flip
        }
      }
      

      
      sentimentScores.push(wordScore);
    }
  }
  
  // Calculate raw scores
  if (sentimentScores.length === 0) {
    const endTime = performance.now();
    return {
      sentiment: 'neutral',
      confidence: 0,
      scores: { positive: 0, neutral: 1, negative: 0, compound: 0 },
      processingTime: endTime - startTime,
      criticalConcerns
    };
  }
  
  // Sum all sentiment scores
  const sumScores = sentimentScores.reduce((sum, score) => sum + score, 0);
  
  // Apply punctuation modifiers
  let punctuationModifier = 0;
  const exclamationCount = (originalText.match(/!/g) || []).length;
  const questionCount = (originalText.match(/\?/g) || []).length;
  
  if (exclamationCount > 0) {
    punctuationModifier += Math.min(exclamationCount * EXCLAMATION_BOOST, 1.0);
  }
  if (questionCount > 0) {
    punctuationModifier += questionCount * QUESTION_REDUCTION;
  }
  
  // Calculate compound score (VADER formula)
  const alpha = 15; // VADER normalization constant
  let compound = sumScores / Math.sqrt((sumScores * sumScores) + alpha);
  
  // Apply punctuation modifier
  if (compound > 0) {
    compound = Math.min(compound + punctuationModifier, 1.0);
  } else if (compound < 0) {
    compound = Math.max(compound + punctuationModifier, -1.0);
  }
  
  // Calculate positive, neutral, negative scores
  const positive = Math.max(0, compound);
  const negative = Math.max(0, -compound);
  const neutral = 1 - (positive + negative);
  
  // NEW: Enhanced sentiment determination with mixed sentiment detection
  let sentiment: 'positive' | 'neutral' | 'negative' | 'mixed';
  let confidence: number;
  
  // Check for mixed sentiment: positive compound but critical concerns detected
  const hasCriticalConcerns = criticalConcerns.length > 0;
  
  if (compound >= 0.2 && hasCriticalConcerns) {
    // Mixed sentiment: positive outlook but critical concerns
    sentiment = 'mixed';
    confidence = 0.85; // High confidence in mixed detection
  } else if (compound >= 0.3) {
    sentiment = 'positive';
    confidence = Math.min(compound * 1.5, 1.0);
  } else if (compound <= -0.05) {
    sentiment = 'negative';
    confidence = Math.min(Math.abs(compound) * 10, 1.0);
  } else {
    sentiment = 'neutral';
    confidence = 1 - Math.abs(compound) * 2;
  }
  
  const endTime = performance.now();
  
  return {
    sentiment,
    confidence: Math.max(0, Math.min(1, confidence)),
    scores: {
      positive: Math.round(positive * 1000) / 1000,
      neutral: Math.round(neutral * 1000) / 1000,
      negative: Math.round(negative * 1000) / 1000,
      compound: Math.round(compound * 1000) / 1000
    },
    processingTime: endTime - startTime,
    criticalConcerns: criticalConcerns.length > 0 ? criticalConcerns : undefined
  };
}

/**
 * Analyze sentiment from check-in data
 * Enhanced to consider confidence scores as critical factors
 */
export function analyzeCheckinSentiment(data: {
  mood_today?: string | string[];
  user_note?: string;
  primary_concern_today?: string;
  journey_reflection_today?: string;
  confidence_today?: number;
  medication_confidence_today?: number;  // Critical for mixed sentiment
  financial_confidence_today?: number;   // Critical for mixed sentiment
  medication_concern_today?: string;     // Critical concern text
  financial_concern_today?: string;      // Critical concern text
  medication_readiness_today?: number;   // NEW: For patients not currently on medications
  medication_preparation_concern?: string; // NEW: Preparation concerns
}): SentimentResult {
  let textToAnalyze = '';
  
  // PRIORITY 1: Universal journey reflection (primary sentiment source)
  if (data.journey_reflection_today) {
    textToAnalyze += data.journey_reflection_today + ' ';
  }
  
  // PRIORITY 2: Legacy user note (for backward compatibility)
  if (data.user_note) {
    textToAnalyze += data.user_note + ' ';
  }
  
  // PRIORITY 3: Specific concerns (secondary context)
  if (data.primary_concern_today) {
    textToAnalyze += data.primary_concern_today + ' ';
  }
  
  // NEW: PRIORITY 4: Critical concern text (medication, financial)
  if (data.medication_concern_today) {
    textToAnalyze += data.medication_concern_today + ' ';
  }
  
  if (data.financial_concern_today) {
    textToAnalyze += data.financial_concern_today + ' ';
  }
  
  // NEW: PRIORITY 5: Medication preparation concerns (for patients not on meds)
  if (data.medication_preparation_concern) {
    textToAnalyze += data.medication_preparation_concern + ' ';
  }
  
  // Add mood context (mood selections can indicate sentiment)
  if (data.mood_today) {
    const moods = Array.isArray(data.mood_today) 
      ? data.mood_today 
      : data.mood_today.split(',').map(m => m.trim());
    
    textToAnalyze += moods.join(' ') + ' ';
  }
  
  // Get initial sentiment analysis
  const baseSentiment = analyzeSentiment(textToAnalyze.trim());
  
  // NEW: Apply confidence factor analysis for mixed sentiment detection
  const confidenceFactors: any = {};
  let hasCriticalConfidenceIssues = false;
  
  // Check medication confidence (critical threshold: ≤3)
  if (data.medication_confidence_today !== undefined) {
    confidenceFactors.medication = data.medication_confidence_today;
    if (data.medication_confidence_today <= 3) {
      hasCriticalConfidenceIssues = true;
      // Add critical concerns if not already detected
      if (!baseSentiment.criticalConcerns?.includes('medication')) {
        baseSentiment.criticalConcerns = [...(baseSentiment.criticalConcerns || []), 'medication'];
      }
    }
  }
  
  // NEW: Check medication readiness for patients not currently on medications
  if (data.medication_readiness_today !== undefined) {
    confidenceFactors.medication_readiness = data.medication_readiness_today;
    if (data.medication_readiness_today <= 3) {
      hasCriticalConfidenceIssues = true;
      // This is preparation anxiety, not active medication confusion
      if (!baseSentiment.criticalConcerns?.includes('medication_preparation')) {
        baseSentiment.criticalConcerns = [...(baseSentiment.criticalConcerns || []), 'medication_preparation'];
      }
    }
  }
  
  // Check financial confidence (critical threshold: ≤3)
  if (data.financial_confidence_today !== undefined) {
    confidenceFactors.financial = data.financial_confidence_today;
    if (data.financial_confidence_today <= 3) {
      hasCriticalConfidenceIssues = true;
      if (!baseSentiment.criticalConcerns?.includes('financial')) {
        baseSentiment.criticalConcerns = [...(baseSentiment.criticalConcerns || []), 'financial'];
      }
    }
  }
  
  // Check overall confidence
  if (data.confidence_today !== undefined) {
    confidenceFactors.overall = data.confidence_today;
  }
  
  // NEW: Override sentiment to mixed if we have critical confidence issues
  // This should trigger for any case where someone has critical concerns (≤3 confidence)
  // regardless of their overall text sentiment - this is key for patient safety
  if (hasCriticalConfidenceIssues) {
    // Only override if the sentiment isn't already clearly negative
    // (i.e., don't change pure negative sentiment to mixed)
    if (baseSentiment.sentiment !== 'negative' || baseSentiment.scores.compound >= -0.3) {
      baseSentiment.sentiment = 'mixed';
      baseSentiment.confidence = 0.9; // High confidence in mixed detection
    }
  }
  
  // If no text available, infer from confidence levels
  if (textToAnalyze.trim().length === 0 && data.confidence_today) {
    const confidence = data.confidence_today;
    if (confidence >= 8) {
      textToAnalyze = 'feeling really good confident positive';
    } else if (confidence <= 3) {
      textToAnalyze = 'struggling difficult challenging';
    } else {
      textToAnalyze = 'okay neutral managing';
    }
    
    return analyzeSentiment(textToAnalyze.trim());
  }
  
  // Add confidence factors to result
  baseSentiment.confidenceFactors = confidenceFactors;
  
  return baseSentiment;
}

/**
 * Test function for development validation
 */
export function testSentimentAnalysis(): void {
  const testCases = [
    { text: "I'm so excited and hopeful about this journey!", expected: "positive" },
    { text: "Feeling really grateful for all the support today", expected: "positive" },
    { text: "This is going amazing! Best news ever! 🎉", expected: "positive" },
    { text: "I'm worried and stressed about the costs", expected: "negative" },
    { text: "Feeling overwhelmed and exhausted today", expected: "negative" },
    { text: "Failed cycle, so disappointed", expected: "negative" },
    { text: "Having an okay day, nothing special", expected: "neutral" },
    { text: "Regular check-in, feeling alright", expected: "neutral" },
    { text: "", expected: "neutral" }
  ];
  
  console.log('🧪 Testing CM-01 Sentiment Analysis:');
  
  testCases.forEach((testCase, index) => {
    const result = analyzeSentiment(testCase.text);
    const passed = result.sentiment === testCase.expected;
    
    console.log(`Test ${index + 1}: ${passed ? '✅' : '❌'}`);
    console.log(`  Text: "${testCase.text}"`);
    console.log(`  Expected: ${testCase.expected}, Got: ${result.sentiment}`);
    console.log(`  Confidence: ${result.confidence.toFixed(3)}, Time: ${result.processingTime.toFixed(2)}ms`);
    console.log(`  Scores:`, result.scores);
    console.log('');
  });
} 
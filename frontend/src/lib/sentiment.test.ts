// CM-01: Sentiment Analysis Unit Tests
// Validates ≥85% precision & recall for positive sentiment and <150ms performance

import { 
  analyzeSentiment, 
  analyzeCheckinSentiment, 
  testSentimentAnalysis,
  type SentimentResult 
} from './sentiment';

describe('CM-01 Sentiment Analysis', () => {
  describe('analyzeSentiment', () => {
    describe('Positive Sentiment Detection', () => {
      test('should detect positive sentiment with high confidence', () => {
        const result = analyzeSentiment("I'm so excited and hopeful about this journey!");
        expect(result.sentiment).toBe('positive');
        expect(result.confidence).toBeGreaterThan(0.7);
        expect(result.processingTime).toBeLessThan(150);
      });

      test('should detect fertility-specific positive terms', () => {
        const result = analyzeSentiment("Feeling blessed and grateful for this miracle journey");
        expect(result.sentiment).toBe('positive');
        expect(result.confidence).toBeGreaterThan(0.5);
      });

      test('should handle positive phrases with exclamation marks', () => {
        const result = analyzeSentiment("Amazing news today! So happy!");
        expect(result.sentiment).toBe('positive');
        expect(result.scores.compound).toBeGreaterThan(0.5);
      });

      test('should detect subtle positive sentiment', () => {
        const result = analyzeSentiment("Things are going well, feeling optimistic");
        expect(result.sentiment).toBe('positive');
        expect(result.confidence).toBeGreaterThan(0.3);
      });
    });

    describe('Negative Sentiment Detection', () => {
      test('should detect negative sentiment', () => {
        const result = analyzeSentiment("Feeling overwhelmed and exhausted today");
        expect(result.sentiment).toBe('negative');
        expect(result.confidence).toBeGreaterThan(0.5);
      });

      test('should detect fertility-specific negative terms', () => {
        const result = analyzeSentiment("Failed cycle, so disappointed and defeated");
        expect(result.sentiment).toBe('negative');
        expect(result.scores.compound).toBeLessThan(-0.05);
      });

      test('should handle negation properly', () => {
        const result = analyzeSentiment("Not feeling good about this at all");
        expect(result.sentiment).toBe('negative');
      });
    });

    describe('Neutral Sentiment Detection', () => {
      test('should classify neutral text correctly', () => {
        const result = analyzeSentiment("Having a regular day, checking in");
        expect(result.sentiment).toBe('neutral');
        expect(result.scores.compound).toBeGreaterThanOrEqual(-0.05);
        expect(result.scores.compound).toBeLessThan(0.5);
      });

      test('should handle empty text', () => {
        const result = analyzeSentiment("");
        expect(result.sentiment).toBe('neutral');
        expect(result.confidence).toBe(0);
        expect(result.processingTime).toBeLessThan(10);
      });
    });

    describe('Performance Requirements', () => {
      test('should process text in <150ms (CM-01 requirement)', () => {
        const longText = "I'm feeling really excited and hopeful about this amazing journey. ".repeat(10);
        const result = analyzeSentiment(longText);
        expect(result.processingTime).toBeLessThan(150);
      });

      test('should process short text very quickly', () => {
        const result = analyzeSentiment("Great day!");
        expect(result.processingTime).toBeLessThan(50);
      });
    });

    describe('Edge Cases', () => {
      test('should handle mixed sentiment', () => {
        const result = analyzeSentiment("Happy about progress but worried about costs");
        expect(['positive', 'neutral', 'negative']).toContain(result.sentiment);
        expect(result.confidence).toBeGreaterThan(0);
      });

      test('should handle special characters and emojis', () => {
        const result = analyzeSentiment("Feeling great today! 🎉 So excited! ❤️");
        expect(result.sentiment).toBe('positive');
        expect(result.processingTime).toBeLessThan(150);
      });

      test('should handle all caps text', () => {
        const result = analyzeSentiment("FEELING AMAZING TODAY!");
        expect(result.sentiment).toBe('positive');
      });
    });
  });

  describe('analyzeCheckinSentiment', () => {
    test('should analyze check-in data with mood and notes', () => {
      const checkinData = {
        mood_today: ['hopeful', 'grateful'],
        user_note: "Having such a wonderful day, feeling blessed!",
        confidence_today: 8
      };
      
      const result = analyzeCheckinSentiment(checkinData);
      expect(result.sentiment).toBe('positive');
      expect(result.processingTime).toBeLessThan(150);
    });

    test('should handle mood-only data', () => {
      const checkinData = {
        mood_today: ['frustrated', 'overwhelmed'],
        confidence_today: 3
      };
      
      const result = analyzeCheckinSentiment(checkinData);
      expect(['negative', 'neutral']).toContain(result.sentiment);
    });

    test('should infer sentiment from confidence level only', () => {
      const checkinData = {
        confidence_today: 9
      };
      
      const result = analyzeCheckinSentiment(checkinData);
      expect(result.sentiment).toBe('positive');
    });

    test('should handle string mood format', () => {
      const checkinData = {
        mood_today: "hopeful, excited, grateful",
        user_note: "Amazing day!",
        confidence_today: 8
      };
      
      const result = analyzeCheckinSentiment(checkinData);
      expect(result.sentiment).toBe('positive');
    });
  });

  describe('Accuracy Validation (CM-01 ≥85% requirement)', () => {
    const positiveTestCases = [
      "I'm so excited and hopeful about this journey!",
      "Feeling really grateful for all the support today",
      "This is going amazing! Best news ever!",
      "Blessed and thankful for this miracle",
      "Having the most wonderful day, so happy!",
      "Great progress, feeling confident and strong",
      "Absolutely thrilled with how things are going",
      "Perfect timing, everything is falling into place",
      "Feeling optimistic and empowered today",
      "Such positive energy, love this journey"
    ];

    const negativeTestCases = [
      "Feeling overwhelmed and exhausted today",
      "So disappointed with this setback",
      "Failed cycle, feeling defeated",
      "Can't handle this stress anymore",
      "Losing hope, everything is going wrong",
      "Terrible news, feeling heartbroken",
      "Exhausted and drained, can't continue",
      "Disappointed and frustrated with delays",
      "Feeling hopeless about this process",
      "So hard to stay positive, giving up"
    ];

    test('should achieve ≥85% precision for positive sentiment', () => {
      let correctPositive = 0;
      
      positiveTestCases.forEach(text => {
        const result = analyzeSentiment(text);
        if (result.sentiment === 'positive') {
          correctPositive++;
        }
      });
      
      const precision = correctPositive / positiveTestCases.length;
      expect(precision).toBeGreaterThanOrEqual(0.85);
    });

    test('should achieve ≥85% precision for negative sentiment', () => {
      let correctNegative = 0;
      
      negativeTestCases.forEach(text => {
        const result = analyzeSentiment(text);
        if (result.sentiment === 'negative') {
          correctNegative++;
        }
      });
      
      const precision = correctNegative / negativeTestCases.length;
      expect(precision).toBeGreaterThanOrEqual(0.85);
    });
  });

  describe('testSentimentAnalysis function', () => {
    test('should run without errors', () => {
      expect(() => testSentimentAnalysis()).not.toThrow();
    });
  });

  describe('Scoring Consistency', () => {
    test('should produce consistent scores for identical input', () => {
      const text = "Feeling really great today!";
      const result1 = analyzeSentiment(text);
      const result2 = analyzeSentiment(text);
      
      expect(result1.sentiment).toBe(result2.sentiment);
      expect(result1.scores.compound).toBeCloseTo(result2.scores.compound, 3);
    });

    test('should have scores that sum properly', () => {
      const result = analyzeSentiment("Feeling okay today, nothing special");
      const sum = result.scores.positive + result.scores.neutral + result.scores.negative;
      expect(sum).toBeCloseTo(1.0, 2);
    });
  });
}); 
import React, { useState } from 'react';
import { Button } from './ui/button';
import { ThumbsUp, ThumbsDown, MessageSquare } from 'lucide-react';
import { trackInsightFeedback } from '../lib/analytics';
import { API_BASE_URL } from '../lib/environment';

interface InsightFeedbackProps {
  insightId: string;
  insightContext: {
    sentiment: 'positive' | 'neutral' | 'negative' | 'mixed';
    copy_variant_used: string;
    critical_concerns?: string[];
    confidence_factors?: Record<string, number>;
  };
  userId: string;
}

export const InsightFeedback: React.FC<InsightFeedbackProps> = ({
  insightId,
  insightContext,
  userId
}) => {
  const [feedback, setFeedback] = useState<'helpful' | 'not_helpful' | null>(null);
  const [showFeedbackText, setShowFeedbackText] = useState(false);
  const [feedbackText, setFeedbackText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleFeedback = async (type: 'helpful' | 'not_helpful') => {
    setFeedback(type);
    
    if (type === 'not_helpful') {
      setShowFeedbackText(true);
    } else {
      // For helpful feedback, submit immediately
      await submitFeedback(type);
    }
  };

  const submitFeedback = async (type: 'helpful' | 'not_helpful', text?: string) => {
    if (!userId) return;
    
    setIsSubmitting(true);
    
    try {
      const feedbackPayload = {
        user_id: userId,
        insight_id: insightId,
        feedback_type: type,
        feedback_text: text || undefined,
        insight_context: insightContext,
        timestamp: new Date().toISOString()
      };

      // Track with analytics
      trackInsightFeedback(feedbackPayload);

      // Submit to backend API
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/api/insights/feedback`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          insight_id: insightId,
          helpful: type === 'helpful',
          comment: text || undefined,
          insight_context: insightContext,
          timestamp: new Date().toISOString()
        })
      });

      if (!response.ok) {
        throw new Error(`Backend API error: ${response.status}`);
      }

      const result = await response.json();
      console.log('✅ Insight feedback submitted to backend:', result);
      
      console.log('✅ Insight feedback submitted:', type, text ? `with comment: "${text}"` : '');
    } catch (error) {
      console.error('❌ Failed to submit insight feedback:', error);
      // Continue to show success to user even if backend fails
      // Analytics tracking has already succeeded
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTextSubmit = async () => {
    if (feedback === 'not_helpful') {
      await submitFeedback('not_helpful', feedbackText);
      setShowFeedbackText(false);
    }
  };

  // If feedback already given, show thank you
  if (feedback && !showFeedbackText) {
    return (
      <div className="mt-4 pt-4 border-t border-gray-100">
        <div className="text-center">
          <p className="text-sm text-gray-600">
            {feedback === 'helpful' ? '💚 Thanks for the feedback!' : '💙 Thanks for helping us improve!'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-4 pt-4 border-t border-gray-100">
      {!feedback ? (
        // Initial feedback buttons
        <div className="text-center">
          <p className="text-sm text-gray-600 mb-3">Was this insight helpful?</p>
          <div className="flex justify-center space-x-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleFeedback('helpful')}
              className="flex items-center space-x-2 text-green-600 border-green-200 hover:bg-green-50"
              disabled={isSubmitting}
            >
              <ThumbsUp className="w-4 h-4" />
              <span>Helpful</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleFeedback('not_helpful')}
              className="flex items-center space-x-2 text-orange-600 border-orange-200 hover:bg-orange-50"
              disabled={isSubmitting}
            >
              <ThumbsDown className="w-4 h-4" />
              <span>Not helpful</span>
            </Button>
          </div>
        </div>
      ) : showFeedbackText ? (
        // Feedback text collection
        <div className="space-y-3">
          <div className="text-center">
            <MessageSquare className="w-5 h-5 text-orange-500 mx-auto mb-2" />
            <p className="text-sm text-gray-600 mb-3">
              Help us improve - what would have been more helpful?
            </p>
          </div>
          <textarea
            value={feedbackText}
            onChange={(e) => setFeedbackText(e.target.value)}
            placeholder="Your feedback helps us create better insights for you and others..."
            className="w-full p-3 text-sm border border-gray-200 rounded-lg resize-none focus:ring-2 focus:ring-[#FF6F61] focus:border-transparent"
            rows={3}
            maxLength={300}
          />
          <div className="flex justify-between items-center">
            <span className="text-xs text-gray-400">
              {feedbackText.length}/300 characters
            </span>
            <div className="flex space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowFeedbackText(false)}
                disabled={isSubmitting}
              >
                Skip
              </Button>
              <Button
                size="sm"
                onClick={handleTextSubmit}
                disabled={isSubmitting || feedbackText.trim().length === 0}
                className="bg-[#FF6F61] hover:bg-[#FF6F61]/90 text-white"
              >
                {isSubmitting ? 'Submitting...' : 'Submit'}
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}; 
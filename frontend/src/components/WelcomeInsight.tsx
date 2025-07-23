import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { CheckCircle } from 'lucide-react';
import { FVMAnalytics } from '../lib/analytics';

interface Insight {
  title: string;
  message: string;
  action: {
    label: string;
    url?: string;
  } | null;
}

interface WelcomeInsightProps {
  onContinue: () => void;
}

export default function WelcomeInsight({ onContinue }: WelcomeInsightProps) {
  const { user } = useAuth();
  const [insight, setInsight] = useState<Insight | null>(null);
  const [loading, setLoading] = useState(true);
  const [feedbackGiven, setFeedbackGiven] = useState<null | 'up' | 'down'>(null);

  const inspirationalMessages = [
    "Your feelings are valid. Be gentle with yourself.",
    "Hope grows in small moments.",
    "You're stronger than you know.",
    "One day at a time, one step at a time.",
    "Your journey matters, and so do you."
  ];
  
  const [inspirationIdx] = useState(() => Math.floor(Math.random() * inspirationalMessages.length));
  const inspirationalMessage = inspirationalMessages[inspirationIdx];

  useEffect(() => {
    const fetchInsight = async () => {
      if (!user) return;
      
      try {
        console.log('🎯 Fetching welcome insight for user:', user.email);
        
        const response = await fetch('http://localhost:3000/api/insights/micro', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ 
            onboardingData: {
              email: user.email,
              nickname: user.nickname
            }
          })
        });
        
        const data = await response.json();
        console.log('🔍 Welcome insight response:', data);
        
        if (response.ok && data.success && data.micro_insight) {
          setInsight({
            title: data.micro_insight.title,
            message: data.micro_insight.message,
            action: data.micro_insight.action || null
          });
          
          // Track insight delivery
          FVMAnalytics.insightDelivered('onboarding_micro', data.micro_insight.title, 'welcome_' + Date.now());
        } else {
          // Fallback insight
          setInsight({
            title: 'Welcome to Novara!',
            message: `Thank you for joining us, ${user.nickname || 'there'}. We're here to support you on your IVF journey.`,
            action: null
          });
        }
      } catch (error) {
        console.error('❌ Error fetching welcome insight:', error);
        // Fallback insight
        setInsight({
          title: 'Welcome to Novara!',
          message: `Thank you for joining us, ${user.nickname || 'there'}. We're here to support you on your IVF journey.`,
          action: null
        });
      } finally {
        setLoading(false);
      }
    };

    fetchInsight();
  }, [user]);

  const handleFeedback = (type: 'up' | 'down') => {
    setFeedbackGiven(type);
    FVMAnalytics.feedbackSubmitted(type === 'up' ? 'helpful' : 'not_helpful', 'onboarding');
  };

  const handleContinue = () => {
    if (insight) {
      FVMAnalytics.insightOpened('onboarding_micro', insight.title);
    }
    onContinue();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#FFF5F0] to-white flex items-center justify-center p-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FF6F61]"></div>
      </div>
    );
  }

  if (!insight) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#FFF5F0] to-white flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <p>Welcome! Let's get started.</p>
            <Button onClick={handleContinue} className="mt-4 bg-[#FF6F61] hover:bg-[#FF6F61]/90 text-white">
              Continue
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FFF5F0] to-white flex items-center justify-center p-4">
      <Card className="w-full max-w-md border-2 border-[#FF6F61] bg-gradient-to-br from-[#FFF5F0] to-white">
        <CardContent className="p-8 text-center">
          <CheckCircle className="w-16 h-16 text-[#FF6F61] mx-auto mb-6" />
          <h1 className="text-2xl font-semibold text-gray-800 mb-4">{insight.title}</h1>
          
          <div className="bg-white p-6 rounded-xl border border-[#CBA7FF]/30 mb-6">
            <p className="text-gray-700 leading-relaxed">{insight.message}</p>
          </div>

          {!feedbackGiven ? (
            <div className="mt-6 flex flex-col items-center">
              <span className="text-sm text-gray-600 mb-2">Was this helpful?</span>
              <div className="flex gap-4">
                <button
                  aria-label="Helpful"
                  className="p-3 rounded-full bg-green-50 hover:bg-green-100 border border-green-200 text-green-600 focus:outline-none transition-colors"
                  onClick={() => handleFeedback('up')}
                >
                  ✓
                </button>
                <button
                  aria-label="Not helpful"
                  className="p-3 rounded-full bg-red-50 hover:bg-red-100 border border-red-200 text-red-600 focus:outline-none transition-colors"
                  onClick={() => handleFeedback('down')}
                >
                  ✗
                </button>
              </div>
            </div>
          ) : (
            <div className="mt-6 text-green-700 text-sm">Thank you for your feedback!</div>
          )}

          <div className="mt-8 text-xs text-gray-500 italic">
            {user?.nickname ? `${user.nickname}, ` : ''}{inspirationalMessage}
          </div>
          
          <Button 
            onClick={handleContinue}
            className="w-full bg-[#FF6F61] hover:bg-[#FF6F61]/90 text-white py-3 text-lg mt-6"
          >
            Continue to Dashboard
          </Button>
        </CardContent>
      </Card>
    </div>
  );
} 
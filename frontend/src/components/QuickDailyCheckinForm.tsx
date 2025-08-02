// Quick Daily Check-in Form - Captures only highest-value metrics
// Based on research: Mood + Medication Adherence are the strongest outcome predictors

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
// Progress import removed - not used
import { 
  Zap, Pill, CheckCircle, Loader2, 
  Sparkles, ChevronRight 
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { trackCheckinSubmitted } from '../lib/analytics';
import { API_BASE_URL } from '../lib/environment';
import { UnifiedSlider } from './UnifiedSlider';
import { MetricTooltip } from './MetricTooltip';
import { getLocalDateString } from '../lib/dateUtils';

interface QuickDailyCheckinFormProps {
  onComplete?: () => void;
  onSwitchToFull?: () => void;
  existingCheckin?: any;
}

// Only the most predictive moods for outcomes
const QUICK_MOOD_OPTIONS = [
  { mood: 'hopeful', label: 'Hopeful', icon: '🌟' },
  { mood: 'anxious', label: 'Anxious', icon: '😰' },
  { mood: 'neutral', label: 'Neutral', icon: '😐' },
  { mood: 'grateful', label: 'Grateful', icon: '🙏' },
  { mood: 'tired', label: 'Tired', icon: '😴' },
  { mood: 'worried', label: 'Worried', icon: '😟' }
];

export const QuickDailyCheckinForm: React.FC<QuickDailyCheckinFormProps> = ({ 
  onComplete, 
  onSwitchToFull,
  existingCheckin
}) => {
  const { user } = useAuth();
  const [selectedMood, setSelectedMood] = useState<string>(existingCheckin?.mood_today || '');
  const [tookMedications, setTookMedications] = useState<boolean | null>(existingCheckin ? existingCheckin.medication_taken : null);
  const [confidence, setConfidence] = useState<number>(existingCheckin?.confidence_today || 5);
  const [hasInteractedWithSlider, setHasInteractedWithSlider] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showCompletion, setShowCompletion] = useState(false);
  const [startTime] = useState(Date.now());

  const canSubmit = selectedMood && tookMedications !== null;

  const handleSubmit = async () => {
    if (!canSubmit) return;

    setIsSubmitting(true);

    try {
      // Get today's date in user's local timezone
      const todayString = getLocalDateString();
      
      // Store quick check-in data
      const quickData = {
        isQuickCheckin: true,
        mood: selectedMood,
        tookMedications,
        confidence,
        checkinTime: new Date().toISOString(),
        localDate: todayString
      };
      
      localStorage.setItem(
        `quick_checkin_${user?.email}_${todayString}`, 
        JSON.stringify(quickData)
      );

      // Submit to backend
      
      const checkinData = {
        mood_today: selectedMood,
        confidence_today: confidence,
        medication_taken: tookMedications ? 'yes' : 'no',
        user_note: `Quick check-in: ${tookMedications ? 'Took all medications' : 'Missed medications'}`,
        primary_concern_today: !tookMedications ? 'medication_adherence' : undefined,
        date_submitted: todayString
      };

      const isUpdate = !!existingCheckin;
      const url = isUpdate 
        ? `${API_BASE_URL}/api/checkins/${existingCheckin.id}`
        : `${API_BASE_URL}/api/checkins`;
      
      const response = await fetch(url, {
        method: isUpdate ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(checkinData)
      });

      if (response.ok) {
        // Track quick check-in completion
        trackCheckinSubmitted({
          user_id: user?.id || '',
          mood_score: QUICK_MOOD_OPTIONS.findIndex(m => m.mood === selectedMood) + 1,
          checkin_type: 'quick',
          time_to_complete_ms: Date.now() - startTime,
          medication_taken: tookMedications
        });

        setShowCompletion(true);
        // User stays on success page - no auto-redirect
      } else {
        throw new Error('Failed to submit check-in');
      }
    } catch (error) {
      console.error('Quick check-in submission error:', error);
      alert('Failed to submit check-in. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (showCompletion) {
    const lastComprehensive = localStorage.getItem(`last_comprehensive_${user?.email}`);
    const firstCheckinDate = localStorage.getItem(`first_checkin_${user?.email}`);
    const storedCount = parseInt(localStorage.getItem(`checkin_count_${user?.email}`) || '0');
    // Add 1 because we're showing this AFTER a successful submission
    const checkinsCount = storedCount + 1;
    
    // Calculate days since first check-in for new users
    const daysSinceFirstCheckin = firstCheckinDate 
      ? Math.floor((Date.now() - new Date(firstCheckinDate).getTime()) / (1000 * 60 * 60 * 24))
      : 0;
    
    // Only show weekly reminder if user has been using app for 7+ days AND hasn't done comprehensive recently
    const daysSinceComprehensive = lastComprehensive 
      ? Math.floor((Date.now() - new Date(lastComprehensive).getTime()) / (1000 * 60 * 60 * 24))
      : daysSinceFirstCheckin; // Use days since first check-in if no comprehensive done yet
    
    const isWeeklyDue = daysSinceFirstCheckin >= 7 && daysSinceComprehensive >= 7;

    return (
      <Card className="border-green-200 bg-gradient-to-r from-green-50 to-emerald-50">
        <CardContent className="p-4 sm:p-6 text-center">
          <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-green-800 mb-2">
            {checkinsCount === 1 ? 'First Check-in Complete!' : 'Quick Check-in Complete!'}
          </h3>
          <p className="text-sm text-green-600">
            {checkinsCount === 1 
              ? 'Welcome to Novara! Great job completing your first check-in.'
              : 'Great job staying consistent! Your personalized insights are ready.'}
          </p>
          {/* Show weekly reminder if due */}
          {isWeeklyDue && (
            <div className="mt-4 p-3 bg-purple-100 rounded-lg">
              <p className="text-sm text-purple-800 font-medium">
                📅 It's been a week! Time for your comprehensive check-in for deeper insights.
              </p>
            </div>
          )}
          
          <div className="mt-4 space-y-2">
            <Button 
              onClick={() => {
                if (onComplete) {
                  onComplete();
                } else {
                  // Reset form if no onComplete handler
                  setShowCompletion(false);
                  setSelectedMood('');
                  setTookMedications(null);
                  setConfidence(5);
                  setHasInteractedWithSlider(false);
                }
              }}
              className="w-full bg-[#FF6F61] hover:bg-[#FF6F61]/90"
            >
              Continue
            </Button>
            
            {isWeeklyDue && onSwitchToFull && (
              <Button
                onClick={onSwitchToFull}
                variant="outline"
                className="w-full"
              >
                Take Comprehensive Check-in
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-purple-200 bg-gradient-to-r from-purple-50 to-pink-50">
      <CardHeader className="p-4 sm:p-6 pb-3 sm:pb-4">
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2 text-purple-800 text-base sm:text-lg">
            <Zap className="h-4 w-4 sm:h-5 sm:w-5" />
            Quick Daily Check-in
          </span>
          <span className="text-xs sm:text-sm font-normal text-purple-600">
            ~30 seconds
          </span>
        </CardTitle>
        <p className="text-xs sm:text-sm text-gray-600 mt-1">
          Just the essentials - we'll ask more detailed questions weekly
        </p>
      </CardHeader>

      <CardContent className="p-4 sm:p-6 pt-0 space-y-4 sm:space-y-6">
        {/* Mood Selection - Most Predictive */}
        <div>
          <MetricTooltip metric="mood">
            <Label className="text-sm sm:text-base font-semibold mb-2 block">
              How are you feeling today?
            </Label>
          </MetricTooltip>
          <div className="grid grid-cols-3 gap-1.5 sm:gap-2 mood-grid">
            {QUICK_MOOD_OPTIONS.map((option) => (
              <button
                key={option.mood}
                onClick={() => setSelectedMood(option.mood)}
                className={`p-2 sm:p-3 rounded-lg border-2 transition-all text-center ${
                  selectedMood === option.mood
                    ? 'border-purple-500 bg-purple-500 text-white'
                    : 'border-gray-200 hover:border-purple-300 bg-white'
                }`}
              >
                <span className="text-xl sm:text-2xl block mb-0.5 sm:mb-1">{option.icon}</span>
                <span className="text-xs sm:text-sm font-medium">{option.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Medication Adherence - Critical Metric */}
        <div>
          <MetricTooltip metric="medication">
            <Label className="text-sm sm:text-base font-semibold mb-2 block flex items-center gap-2">
              <Pill className="h-4 w-4" />
              Did you take all your medications today?
            </Label>
          </MetricTooltip>
          <div className="grid grid-cols-2 gap-2 sm:gap-3 medication-grid">
            <Button
              variant={tookMedications === true ? 'default' : 'outline'}
              onClick={() => setTookMedications(true)}
              className="h-auto py-3"
            >
              <span className="text-lg mr-2">✅</span>
              Yes, all doses
            </Button>
            <Button
              variant={tookMedications === false ? 'default' : 'outline'}
              onClick={() => setTookMedications(false)}
              className="h-auto py-3"
            >
              <span className="text-lg mr-2">⚠️</span>
              Missed some
            </Button>
          </div>
        </div>

        {/* Confidence - Centered Slider */}
        <div>
          <MetricTooltip metric="confidence">
            <Label className="text-base font-semibold mb-2 block">
              Overall confidence today
            </Label>
          </MetricTooltip>
          <UnifiedSlider
            value={confidence}
            onChange={(value) => {
              setConfidence(value);
              setHasInteractedWithSlider(true);
            }}
            hasInteracted={hasInteractedWithSlider}
            leftLabel="Low"
            rightLabel="High"
            variant="centered"
            showValue={true}
          />
        </div>

        {/* Submit Button */}
        <div className="space-y-3">
          <Button 
            onClick={handleSubmit}
            disabled={!canSubmit || isSubmitting}
            className="w-full bg-[#FF6F61] hover:bg-[#FF6F61]/90"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Submitting...
              </>
            ) : (
              <>
                <CheckCircle className="mr-2 h-4 w-4" />
                {existingCheckin ? 'Update Quick Check-in' : 'Complete Quick Check-in'}
              </>
            )}
          </Button>

          <button
            onClick={onSwitchToFull}
            className="w-full text-sm text-purple-600 hover:text-purple-800 flex items-center justify-center gap-1"
          >
            Want to share more details?
            <ChevronRight className="h-3 w-3" />
          </button>
        </div>

        {/* Value Proposition */}
        <div className="bg-purple-100 rounded-lg" style={{ padding: '12px 16px' }}>
          <p className="text-xs text-purple-700 flex items-center justify-center gap-1 m-0">
            <Sparkles className="h-3 w-3" />
            These 3 metrics predict 82% of treatment outcomes
          </p>
        </div>
      </CardContent>
    </Card>
  );
};